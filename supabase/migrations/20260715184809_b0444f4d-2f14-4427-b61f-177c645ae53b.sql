-- Enum for request status
CREATE TYPE public.change_request_status AS ENUM ('pending', 'approved', 'declined', 'expired', 'cancelled');

-- Enum for request kind
CREATE TYPE public.change_request_kind AS ENUM ('budget', 'permission', 'cancel_visit', 'care_note');

-- Main table
CREATE TABLE public.change_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  senior_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  requester_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  kind public.change_request_kind NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  reason text NOT NULL CHECK (length(reason) <= 500),
  status public.change_request_status NOT NULL DEFAULT 'pending',
  decline_reason text,
  target_id uuid,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '14 days'),
  resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX change_requests_senior_status_idx ON public.change_requests (senior_id, status);
CREATE INDEX change_requests_requester_status_idx ON public.change_requests (requester_id, status);

-- Grants
GRANT SELECT, INSERT, UPDATE ON public.change_requests TO authenticated;
GRANT ALL ON public.change_requests TO service_role;

-- RLS
ALTER TABLE public.change_requests ENABLE ROW LEVEL SECURITY;

-- Senior can view their incoming requests
CREATE POLICY "Senior can view own incoming requests"
  ON public.change_requests FOR SELECT
  TO authenticated
  USING (auth.uid() = senior_id);

-- Requester (family) can view their own outgoing requests
CREATE POLICY "Requester can view own outgoing requests"
  ON public.change_requests FOR SELECT
  TO authenticated
  USING (auth.uid() = requester_id);

-- Requester can insert only if they have an approved family_link to the senior
CREATE POLICY "Family can create requests for linked seniors"
  ON public.change_requests FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = requester_id
    AND EXISTS (
      SELECT 1 FROM public.family_links fl
      WHERE fl.family_id = auth.uid()
        AND fl.senior_id = change_requests.senior_id
        AND fl.approved = true
    )
  );

-- Senior can update their own incoming requests (approve/decline)
CREATE POLICY "Senior can update own incoming requests"
  ON public.change_requests FOR UPDATE
  TO authenticated
  USING (auth.uid() = senior_id)
  WITH CHECK (auth.uid() = senior_id);

-- Requester can update their own pending request only to cancel
CREATE POLICY "Requester can cancel own pending requests"
  ON public.change_requests FOR UPDATE
  TO authenticated
  USING (auth.uid() = requester_id AND status = 'pending')
  WITH CHECK (auth.uid() = requester_id);

-- updated_at trigger
CREATE TRIGGER trg_change_requests_updated_at
BEFORE UPDATE ON public.change_requests
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Notify senior when a new request is created
CREATE OR REPLACE FUNCTION public.notify_change_request_created()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  requester_name text;
BEGIN
  SELECT full_name INTO requester_name FROM public.profiles WHERE id = NEW.requester_id;
  INSERT INTO public.notifications (user_id, kind, title, body, link)
  VALUES (
    NEW.senior_id,
    'change_request',
    COALESCE(requester_name, 'A family member') || ' requested a change',
    LEFT(NEW.reason, 140),
    '/senior'
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_change_request_created
AFTER INSERT ON public.change_requests
FOR EACH ROW EXECUTE FUNCTION public.notify_change_request_created();

-- Notify requester on approve/decline
CREATE OR REPLACE FUNCTION public.notify_change_request_resolved()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  senior_name text;
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status
     AND NEW.status IN ('approved', 'declined') THEN
    SELECT full_name INTO senior_name FROM public.profiles WHERE id = NEW.senior_id;
    INSERT INTO public.notifications (user_id, kind, title, body, link)
    VALUES (
      NEW.requester_id,
      'change_request_' || NEW.status::text,
      COALESCE(senior_name, 'Your senior') || ' ' || NEW.status::text || ' your request',
      COALESCE(NEW.decline_reason, LEFT(NEW.reason, 140)),
      '/family'
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_change_request_resolved
AFTER UPDATE ON public.change_requests
FOR EACH ROW EXECUTE FUNCTION public.notify_change_request_resolved();

-- Apply function: called by the senior via server function.
-- Runs as owner (SECURITY DEFINER) so it can mutate profiles/bookings/family_links,
-- but validates auth.uid() = senior_id and status = 'pending' first.
CREATE OR REPLACE FUNCTION public.apply_change_request(_request_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
  IF req.senior_id <> auth.uid() THEN
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
$$;

REVOKE ALL ON FUNCTION public.apply_change_request(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.apply_change_request(uuid) TO authenticated;