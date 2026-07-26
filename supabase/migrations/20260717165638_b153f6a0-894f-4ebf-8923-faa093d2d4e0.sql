
-- 1) Lock down apply_change_request: revoke from authenticated; take actor_id explicitly.
CREATE OR REPLACE FUNCTION public.apply_change_request(_request_id uuid, _actor_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  req public.change_requests%ROWTYPE;
  new_budget bigint;
  new_permission text;
  new_note text;
  existing_notes text;
BEGIN
  SELECT * INTO req FROM public.change_requests WHERE id = _request_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Request not found';
  END IF;
  IF req.senior_id <> _actor_id THEN
    RAISE EXCEPTION 'Only the senior can approve this request';
  END IF;
  IF req.status <> 'pending' THEN
    RAISE EXCEPTION 'Request is not pending';
  END IF;
  IF req.expires_at < now() THEN
    UPDATE public.change_requests SET status = 'expired', resolved_at = now()
      WHERE id = _request_id;
    RAISE EXCEPTION 'Request has expired';
  END IF;

  CASE req.kind
    WHEN 'budget' THEN
      new_budget := (req.payload->>'monthly_budget_cents')::bigint;
      IF new_budget IS NULL OR new_budget < 0 THEN
        RAISE EXCEPTION 'Invalid budget value';
      END IF;
      UPDATE public.profiles SET monthly_budget_cents = new_budget
        WHERE id = req.senior_id;

    WHEN 'permission' THEN
      new_permission := req.payload->>'permission';
      IF new_permission NOT IN ('view', 'modify', 'financial') THEN
        RAISE EXCEPTION 'Invalid permission value';
      END IF;
      UPDATE public.family_links
        SET permission = new_permission
        WHERE senior_id = req.senior_id
          AND family_id = req.requester_id
          AND approved = true;

    WHEN 'cancel_visit' THEN
      IF req.target_id IS NULL THEN
        RAISE EXCEPTION 'Missing booking id';
      END IF;
      UPDATE public.bookings
        SET status = 'cancelled'
        WHERE id = req.target_id
          AND senior_id = req.senior_id;

    WHEN 'care_note' THEN
      new_note := req.payload->>'note';
      IF new_note IS NULL OR length(trim(new_note)) = 0 THEN
        RAISE EXCEPTION 'Missing note';
      END IF;
      SELECT care_notes INTO existing_notes FROM public.profiles WHERE id = req.senior_id;
      UPDATE public.profiles
        SET care_notes = COALESCE(existing_notes || E'\n\n', '') ||
                         '[' || to_char(now(), 'YYYY-MM-DD') || '] ' || new_note
        WHERE id = req.senior_id;
  END CASE;

  UPDATE public.change_requests
    SET status = 'approved', resolved_at = now()
    WHERE id = _request_id;
END;
$function$;

-- Drop the old single-arg overload so signed-in users can no longer call the SECURITY DEFINER function directly.
DROP FUNCTION IF EXISTS public.apply_change_request(uuid);

REVOKE EXECUTE ON FUNCTION public.apply_change_request(uuid, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.apply_change_request(uuid, uuid) TO service_role;

-- 2) Allow admins/staff to update verification records via RLS (previously no UPDATE policy existed).
CREATE POLICY "verifications update by staff"
ON public.verifications
FOR UPDATE
TO authenticated
USING (public.has_any_role(auth.uid(), ARRAY['admin','staff','support','success']::public.app_role[]))
WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin','staff','support','success']::public.app_role[]));
