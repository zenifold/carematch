-- Off-platform migration detection: a marketplace's core retention risk is a
-- family and caregiver exchanging contact info in-app and moving scheduling/
-- payment off-platform entirely. Rather than block messages (too paternalistic
-- — breaks legitimate conversation like "call the concierge at..."), just flag
-- likely attempts for staff review. A dedicated table rather than reusing
-- `incidents`: incidents.category has no good fit for this, and reporter_id is
-- NOT NULL with no human reporter for an automated flag.
CREATE TABLE public.message_flags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason text NOT NULL,
  matched_text text,
  reviewed_at timestamptz,
  reviewed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  dismissed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_message_flags_unreviewed ON public.message_flags(created_at DESC) WHERE reviewed_at IS NULL;

GRANT SELECT, UPDATE ON public.message_flags TO authenticated;
GRANT ALL ON public.message_flags TO service_role;

ALTER TABLE public.message_flags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff read message flags"
  ON public.message_flags FOR SELECT TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin','trust_safety','staff','support']::public.app_role[]));

CREATE POLICY "Staff update message flags"
  ON public.message_flags FOR UPDATE TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin','trust_safety','staff','support']::public.app_role[]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin','trust_safety','staff','support']::public.app_role[]));

-- \y is Postgres's word-boundary regex extension (not standard POSIX, but
-- supported here). Phrase list is intentionally simple to start — tune based
-- on real false-positive rate once there's real usage, not guesswork now.
CREATE OR REPLACE FUNCTION public.flag_offplatform_message()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  reason text := NULL;
BEGIN
  IF NEW.body ~ '[0-9]{3}[-. ]?[0-9]{3}[-. ]?[0-9]{4}' THEN
    reason := 'phone_number';
  ELSIF NEW.body ~* '[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}' THEN
    reason := 'email_address';
  ELSIF NEW.body ~* '\y(venmo|zelle|cash ?app|paypal|pay (you )?cash|text me|call me|my (cell|number)|off[- ]?platform|outside the app|off the app)\y' THEN
    reason := 'offplatform_phrase';
  END IF;

  IF reason IS NOT NULL THEN
    INSERT INTO public.message_flags (message_id, conversation_id, sender_id, reason, matched_text)
    VALUES (NEW.id, NEW.conversation_id, NEW.sender_id, reason, NEW.body);
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_flag_offplatform_message
  AFTER INSERT ON public.messages
  FOR EACH ROW EXECUTE FUNCTION public.flag_offplatform_message();
