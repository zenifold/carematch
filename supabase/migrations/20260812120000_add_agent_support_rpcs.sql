-- RPCs for external AI agents (Buzz) acting on support tickets and incidents.
--
-- Why these exist rather than letting the agent PATCH/POST the tables directly:
--
-- 1. `last_activity_at` is maintained only in application code (postTicketMessage
--    and updateTicket in src/lib/support.functions.ts), not by a trigger. A raw
--    REST insert into support_messages leaves it untouched, and both staff inbox
--    queries order by `last_activity_at DESC` — so every ticket an agent replied
--    to would sink to the bottom of the queue humans work from. Silent, and it
--    looks like a healthy inbox.
--
-- 2. `resolved_at` is derived in updateTicket, not by the database. Setting
--    status='resolved' over raw REST leaves it null forever, breaking any
--    resolution-time reporting.
--
-- 3. Approval provenance. When a human approves an agent's draft inside the
--    agent's own tool, that fact has to cross the boundary and land here.
--    Otherwise every write is attributed to "the Buzz account", and the honest
--    answer to "who told this family that?" is unavailable. These functions take
--    the approving human's id and the agent-side approval record, and write both
--    to admin_audit_log.
--
-- All four are SECURITY DEFINER because they write columns the caller's RLS does
-- not cover (and audit rows), so each one re-checks authorisation itself rather
-- than relying on RLS. They are the only sanctioned write path for an agent;
-- reads can continue to go straight to /rest/v1.

-- ---------------------------------------------------------------- rate limiting

-- Deliberately low. A support queue that legitimately needs more than this in an
-- hour needs a human, not a faster agent. The point is to bound a looping agent
-- before it posts a thousand replies to one family.
CREATE OR REPLACE FUNCTION public.agent_assert_under_rate_limit()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  recent integer;
  limit_per_hour constant integer := 200;
BEGIN
  -- Counts this actor's agent actions in the last hour. Uses
  -- admin_audit_log_actor_idx (actor_id, created_at DESC), so no new table or
  -- index is needed to make this cheap.
  SELECT count(*) INTO recent
    FROM public.admin_audit_log
   WHERE actor_id = auth.uid()
     AND action LIKE 'agent.%'
     AND created_at > now() - interval '1 hour';

  IF recent >= limit_per_hour THEN
    RAISE EXCEPTION
      'agent rate limit reached: % actions in the last hour (limit %)', recent, limit_per_hour
      USING ERRCODE = 'check_violation';
  END IF;
END;
$$;

-- ------------------------------------------------------------------- approvals

-- Validates that a human actually approved this, and that it wasn't the agent
-- approving itself.
--
-- `_require_admin` is for irreversible or high-stakes transitions. A staff
-- approver is enough to send a reply; closing an abuse allegation is not
-- something a general support approver should be able to wave through from a
-- chat tool.
CREATE OR REPLACE FUNCTION public.agent_assert_approver(
  _approved_by uuid,
  _require_admin boolean DEFAULT false
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF _approved_by IS NULL THEN
    RAISE EXCEPTION 'this action requires an approving human (approved_by is null)'
      USING ERRCODE = 'check_violation';
  END IF;

  -- The whole point of an approval is a second party. Without this an agent
  -- passes its own id and the gate is theatre.
  IF _approved_by = auth.uid() THEN
    RAISE EXCEPTION 'approved_by must be a different user than the caller'
      USING ERRCODE = 'check_violation';
  END IF;

  IF _require_admin THEN
    IF NOT public.has_any_role(_approved_by, ARRAY['admin']::public.app_role[]) THEN
      RAISE EXCEPTION 'this action requires an approver holding the admin role'
        USING ERRCODE = 'insufficient_privilege';
    END IF;
  ELSE
    IF NOT public.has_any_role(
      _approved_by,
      ARRAY['admin','staff','support','success','trust_safety']::public.app_role[]
    ) THEN
      RAISE EXCEPTION 'approved_by is not a staff user'
        USING ERRCODE = 'insufficient_privilege';
    END IF;
  END IF;
END;
$$;

-- ------------------------------------------------------------ post a reply

-- Posts a message on a ticket and keeps last_activity_at correct.
--
-- A public reply (internal = false) reaches the customer, so it requires an
-- approving human. An internal note does not, because staff-only notes are how an
-- agent shows its reasoning and proposes a draft in the first place — gating those
-- would make the approval flow impossible to build.
CREATE OR REPLACE FUNCTION public.agent_post_reply(
  _ticket_id uuid,
  _body text,
  _internal boolean DEFAULT true,
  _approved_by uuid DEFAULT NULL,
  _approval_ref text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_id uuid;
BEGIN
  IF NOT public.has_any_role(
    auth.uid(), ARRAY['admin','support','staff']::public.app_role[]
  ) THEN
    RAISE EXCEPTION 'not authorised to post on support tickets'
      USING ERRCODE = 'insufficient_privilege';
  END IF;

  IF _body IS NULL OR length(btrim(_body)) < 1 THEN
    RAISE EXCEPTION 'body is required' USING ERRCODE = 'check_violation';
  END IF;
  IF length(_body) > 5000 THEN
    RAISE EXCEPTION 'body exceeds 5000 characters' USING ERRCODE = 'check_violation';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.support_tickets WHERE id = _ticket_id) THEN
    RAISE EXCEPTION 'ticket not found' USING ERRCODE = 'no_data_found';
  END IF;

  PERFORM public.agent_assert_under_rate_limit();

  IF _internal IS NOT TRUE THEN
    PERFORM public.agent_assert_approver(_approved_by, false);
  END IF;

  INSERT INTO public.support_messages (ticket_id, author_id, body, internal)
  VALUES (_ticket_id, auth.uid(), _body, coalesce(_internal, true))
  RETURNING id INTO new_id;

  -- The reason this function exists. See the header note.
  UPDATE public.support_tickets
     SET last_activity_at = now()
   WHERE id = _ticket_id;

  INSERT INTO public.admin_audit_log (actor_id, action, entity, entity_id, payload)
  VALUES (
    auth.uid(),
    CASE WHEN coalesce(_internal, true) THEN 'agent.support.note' ELSE 'agent.support.reply' END,
    'support_messages',
    new_id,
    jsonb_build_object(
      'ticket_id', _ticket_id,
      'internal', coalesce(_internal, true),
      'approved_by', _approved_by,
      'approval_ref', _approval_ref,
      'body_chars', length(_body)
    )
  );

  RETURN new_id;
END;
$$;

-- ------------------------------------------------------- update a ticket

-- Status, priority, and assignment, with resolved_at derived the same way
-- updateTicket does it, plus optimistic concurrency.
--
-- `_expected_last_activity_at` guards against an agent and a human clobbering
-- each other. Pass the value read a moment ago; if anything has touched the ticket
-- since, this fails loudly instead of silently overwriting a human's decision.
-- Pass NULL to skip the check.
CREATE OR REPLACE FUNCTION public.agent_update_ticket(
  _ticket_id uuid,
  _status public.support_status DEFAULT NULL,
  _priority public.support_priority DEFAULT NULL,
  _assignee_id uuid DEFAULT NULL,
  _set_assignee boolean DEFAULT false,
  _approved_by uuid DEFAULT NULL,
  _approval_ref text DEFAULT NULL,
  _expected_last_activity_at timestamptz DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_activity timestamptz;
BEGIN
  IF NOT public.has_any_role(
    auth.uid(), ARRAY['admin','support','staff']::public.app_role[]
  ) THEN
    RAISE EXCEPTION 'not authorised to update support tickets'
      USING ERRCODE = 'insufficient_privilege';
  END IF;

  SELECT last_activity_at INTO current_activity
    FROM public.support_tickets WHERE id = _ticket_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'ticket not found' USING ERRCODE = 'no_data_found';
  END IF;

  IF _expected_last_activity_at IS NOT NULL
     AND current_activity <> _expected_last_activity_at THEN
    RAISE EXCEPTION
      'ticket changed since you read it (expected %, found %) — re-read and retry',
      _expected_last_activity_at, current_activity
      USING ERRCODE = 'serialization_failure';
  END IF;

  PERFORM public.agent_assert_under_rate_limit();

  -- Closing a ticket ends the conversation for the customer, so a human signs off.
  -- coalesce because `NULL IN (...)` is NULL, not false, and a bare NULL in an IF
  -- takes the else branch silently — fine here, but not something to rely on.
  IF coalesce(_status IN ('resolved', 'closed'), false) THEN
    PERFORM public.agent_assert_approver(_approved_by, false);
  END IF;

  UPDATE public.support_tickets
     SET status = coalesce(_status, status),
         priority = coalesce(_priority, priority),
         assignee_id = CASE WHEN _set_assignee THEN _assignee_id ELSE assignee_id END,
         -- Mirrors updateTicket: derived from status, never set independently.
         resolved_at = CASE
           WHEN _status IN ('resolved', 'closed') THEN now()
           WHEN _status IS NOT NULL THEN NULL
           ELSE resolved_at
         END,
         last_activity_at = now()
   WHERE id = _ticket_id;

  INSERT INTO public.admin_audit_log (actor_id, action, entity, entity_id, payload)
  VALUES (
    auth.uid(), 'agent.support.update', 'support_tickets', _ticket_id,
    jsonb_build_object(
      'status', _status, 'priority', _priority,
      'assignee_set', _set_assignee, 'assignee_id', _assignee_id,
      'approved_by', _approved_by, 'approval_ref', _approval_ref
    )
  );
END;
$$;

-- --------------------------------------------------- triage an incident

-- Trust-and-safety triage. Always needs an approving human, because an incident is
-- a report of something that may have gone wrong for a person in their own home.
--
-- Harm categories (abuse, safety, theft) additionally require an `admin` approver
-- to reach a terminal status. RLS alone cannot express that — trust_safety grants
-- UPDATE on the whole row — so the rule lives here, which makes it enforced rather
-- than conventional. A trust-and-safety lead working in the admin console is
-- unaffected; this only constrains the agent path.
CREATE OR REPLACE FUNCTION public.agent_triage_incident(
  _incident_id uuid,
  _status public.incident_status DEFAULT NULL,
  _severity smallint DEFAULT NULL,
  _resolution_notes text DEFAULT NULL,
  _approved_by uuid DEFAULT NULL,
  _approval_ref text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  inc_category public.incident_category;
  is_terminal boolean;
BEGIN
  IF NOT public.has_any_role(
    auth.uid(), ARRAY['admin','trust_safety','staff']::public.app_role[]
  ) THEN
    RAISE EXCEPTION 'not authorised to triage incidents'
      USING ERRCODE = 'insufficient_privilege';
  END IF;

  IF _severity IS NOT NULL AND (_severity < 1 OR _severity > 4) THEN
    RAISE EXCEPTION 'severity must be between 1 and 4' USING ERRCODE = 'check_violation';
  END IF;

  SELECT category INTO inc_category
    FROM public.incidents WHERE id = _incident_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'incident not found' USING ERRCODE = 'no_data_found';
  END IF;

  PERFORM public.agent_assert_under_rate_limit();

  is_terminal := coalesce(_status IN ('resolved', 'dismissed'), false);

  PERFORM public.agent_assert_approver(
    _approved_by,
    is_terminal AND inc_category IN ('abuse', 'safety', 'theft')
  );

  UPDATE public.incidents
     SET status = coalesce(_status, status),
         severity = coalesce(_severity, severity),
         resolution_notes = coalesce(_resolution_notes, resolution_notes),
         resolved_at = CASE
           WHEN is_terminal THEN now()
           WHEN _status IS NOT NULL THEN NULL
           ELSE resolved_at
         END,
         -- The approving human, not the agent. They made the call; the record
         -- should say so, and "resolved by a bot" is the wrong answer to give a
         -- family asking who closed their report.
         resolved_by = CASE
           WHEN is_terminal THEN _approved_by
           WHEN _status IS NOT NULL THEN NULL
           ELSE resolved_by
         END
   WHERE id = _incident_id;

  INSERT INTO public.admin_audit_log (actor_id, action, entity, entity_id, payload)
  VALUES (
    auth.uid(), 'agent.incident.triage', 'incidents', _incident_id,
    jsonb_build_object(
      'category', inc_category, 'status', _status, 'severity', _severity,
      'notes_set', _resolution_notes IS NOT NULL,
      'approved_by', _approved_by, 'approval_ref', _approval_ref
    )
  );
END;
$$;

-- ------------------------------------------------ file a ticket for a customer

-- Opens a ticket on someone else's behalf, for inbound email or chat that the
-- agent picked up outside the app.
--
-- RLS pins INSERT on support_tickets to `requester_id = auth.uid()`, which is
-- correct for the browser and is why this needs to be a definer function. The
-- ticket is attributed to the customer, and the initial message is seeded the same
-- way createSupportTicket does it so threads always open with the requester's own
-- words.
CREATE OR REPLACE FUNCTION public.agent_create_ticket_for(
  _requester_id uuid,
  _subject text,
  _body text,
  _portal public.support_portal DEFAULT 'other',
  _priority public.support_priority DEFAULT 'normal',
  _category text DEFAULT NULL,
  _approval_ref text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_id uuid;
BEGIN
  IF NOT public.has_any_role(
    auth.uid(), ARRAY['admin','support','staff']::public.app_role[]
  ) THEN
    RAISE EXCEPTION 'not authorised to create support tickets'
      USING ERRCODE = 'insufficient_privilege';
  END IF;

  IF _subject IS NULL OR length(btrim(_subject)) < 3 THEN
    RAISE EXCEPTION 'subject must be at least 3 characters' USING ERRCODE = 'check_violation';
  END IF;
  IF _body IS NULL OR length(btrim(_body)) < 3 THEN
    RAISE EXCEPTION 'body must be at least 3 characters' USING ERRCODE = 'check_violation';
  END IF;

  -- A ticket filed against a deleted or missing profile is unanswerable, and
  -- would leave the customer unable to see it in their own portal.
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = _requester_id AND deleted_at IS NULL
  ) THEN
    RAISE EXCEPTION 'requester profile not found or deleted' USING ERRCODE = 'no_data_found';
  END IF;

  PERFORM public.agent_assert_under_rate_limit();

  INSERT INTO public.support_tickets (requester_id, subject, body, category, portal, priority)
  VALUES (_requester_id, _subject, _body, _category, _portal, _priority)
  RETURNING id INTO new_id;

  -- Authored by the customer, not the agent: this is their words, relayed.
  INSERT INTO public.support_messages (ticket_id, author_id, body, internal)
  VALUES (new_id, _requester_id, _body, false);

  INSERT INTO public.admin_audit_log (actor_id, target_user_id, action, entity, entity_id, payload)
  VALUES (
    auth.uid(), _requester_id, 'agent.support.create_for', 'support_tickets', new_id,
    jsonb_build_object('portal', _portal, 'priority', _priority, 'approval_ref', _approval_ref)
  );

  RETURN new_id;
END;
$$;

-- ------------------------------------------------------------------- grants

REVOKE ALL ON FUNCTION public.agent_assert_under_rate_limit() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.agent_assert_approver(uuid, boolean) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.agent_post_reply(uuid, text, boolean, uuid, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.agent_update_ticket(
  uuid, public.support_status, public.support_priority, uuid, boolean, uuid, text, timestamptz
) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.agent_triage_incident(
  uuid, public.incident_status, smallint, text, uuid, text
) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.agent_create_ticket_for(
  uuid, text, text, public.support_portal, public.support_priority, text, text
) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.agent_post_reply(uuid, text, boolean, uuid, text)
  TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.agent_update_ticket(
  uuid, public.support_status, public.support_priority, uuid, boolean, uuid, text, timestamptz
) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.agent_triage_incident(
  uuid, public.incident_status, smallint, text, uuid, text
) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.agent_create_ticket_for(
  uuid, text, text, public.support_portal, public.support_priority, text, text
) TO authenticated, service_role;
-- The two helpers are internal; nothing outside these functions should call them.
GRANT EXECUTE ON FUNCTION public.agent_assert_under_rate_limit() TO service_role;
GRANT EXECUTE ON FUNCTION public.agent_assert_approver(uuid, boolean) TO service_role;
