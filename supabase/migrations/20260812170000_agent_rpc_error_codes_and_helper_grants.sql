-- Two findings from running scripts/verify-agent-rpcs.py end to end.
--
-- 1. `no_data_found` (P0002) surfaces through PostgREST as HTTP 500. A caller
--    passing a ticket id that does not exist should get a 404, not a server error —
--    the difference decides whether a client retries, escalates, or fixes its input.
--    Same class of mistake as the earlier 40001 hang: picking a Postgres errcode
--    without checking how PostgREST maps it. Switched to `PT404`, which PostgREST
--    translates to a plain 404.
--
-- 2. The two internal helpers were callable directly by the agent. `REVOKE ... FROM
--    PUBLIC, anon` missed it, because Supabase's default privileges on the public
--    schema grant EXECUTE to `authenticated` explicitly rather than through PUBLIC.
--    Low impact — both helpers only raise or return void, and neither touches data —
--    but they are internal and should not be part of the API surface.

REVOKE ALL ON FUNCTION public.agent_assert_under_rate_limit() FROM authenticated;
REVOKE ALL ON FUNCTION public.agent_assert_approver(uuid, boolean) FROM authenticated;

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
    RAISE EXCEPTION 'ticket not found' USING ERRCODE = 'PT404';
  END IF;

  PERFORM public.agent_assert_under_rate_limit();

  IF _internal IS NOT TRUE THEN
    PERFORM public.agent_assert_approver(_approved_by, false);
  END IF;

  INSERT INTO public.support_messages (ticket_id, author_id, body, internal)
  VALUES (_ticket_id, auth.uid(), _body, coalesce(_internal, true))
  RETURNING id INTO new_id;

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

  IF NOT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = _requester_id AND deleted_at IS NULL
  ) THEN
    RAISE EXCEPTION 'requester profile not found or deleted' USING ERRCODE = 'PT404';
  END IF;

  PERFORM public.agent_assert_under_rate_limit();

  INSERT INTO public.support_tickets (requester_id, subject, body, category, portal, priority)
  VALUES (_requester_id, _subject, _body, _category, _portal, _priority)
  RETURNING id INTO new_id;

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

-- Also carries the PT404 change into the two functions last defined in 20260812160000.
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
  updated integer;
BEGIN
  IF NOT public.has_any_role(
    auth.uid(), ARRAY['admin','support','staff']::public.app_role[]
  ) THEN
    RAISE EXCEPTION 'not authorised to update support tickets'
      USING ERRCODE = 'insufficient_privilege';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.support_tickets WHERE id = _ticket_id) THEN
    RAISE EXCEPTION 'ticket not found' USING ERRCODE = 'PT404';
  END IF;

  PERFORM public.agent_assert_under_rate_limit();

  IF coalesce(_status IN ('resolved', 'closed'), false) THEN
    PERFORM public.agent_assert_approver(_approved_by, false);
  END IF;

  UPDATE public.support_tickets
     SET status = coalesce(_status, status),
         priority = coalesce(_priority, priority),
         assignee_id = CASE WHEN _set_assignee THEN _assignee_id ELSE assignee_id END,
         resolved_at = CASE
           WHEN coalesce(_status IN ('resolved', 'closed'), false) THEN now()
           WHEN _status IS NOT NULL THEN NULL
           ELSE resolved_at
         END,
         last_activity_at = now()
   WHERE id = _ticket_id
     AND (_expected_last_activity_at IS NULL
          OR last_activity_at = _expected_last_activity_at);

  GET DIAGNOSTICS updated = ROW_COUNT;
  IF updated = 0 THEN
    RAISE EXCEPTION
      'ticket changed since you read it — re-read and decide again'
      USING ERRCODE = 'PT409';
  END IF;

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
  updated integer;
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

  SELECT category INTO inc_category FROM public.incidents WHERE id = _incident_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'incident not found' USING ERRCODE = 'PT404';
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
         resolved_by = CASE
           WHEN is_terminal THEN _approved_by
           WHEN _status IS NOT NULL THEN NULL
           ELSE resolved_by
         END
   WHERE id = _incident_id
     AND category = inc_category;

  GET DIAGNOSTICS updated = ROW_COUNT;
  IF updated = 0 THEN
    RAISE EXCEPTION
      'incident changed since you read it — re-read and decide again'
      USING ERRCODE = 'PT409';
  END IF;

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
