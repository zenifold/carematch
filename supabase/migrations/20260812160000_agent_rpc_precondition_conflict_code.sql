-- Fixes a hang in agent_update_ticket and agent_triage_incident when the optimistic
-- concurrency precondition fails.
--
-- Both raised `serialization_failure` (SQLSTATE 40001) on a mismatch. That code is
-- not a free-form "conflict" signal: it specifically means the transaction failed
-- due to concurrent access and is safe to replay, and PostgREST acts on it by
-- retrying. Our mismatch is deterministic — the precondition will never match on a
-- retry — so the request never returned. It presented as a network hang, which sent
-- the original diagnosis in the wrong direction; the giveaway was that it failed at
-- exactly the same call every run while unrelated calls succeeded.
--
-- PostgREST maps a `PTxxx` SQLSTATE to HTTP status xxx, so `PT409` returns a plain
-- 409 Conflict: correct semantics for a failed precondition, and not retryable.
--
-- Clients should treat 409 as "re-read the row and decide again", never as "retry
-- the same call".

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
    RAISE EXCEPTION 'ticket not found' USING ERRCODE = 'no_data_found';
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
