-- notify_verification_change() was wired to the legacy `verifications` table
-- (AFTER UPDATE ON public.verifications), but nothing has written to that
-- table since provider_credentials was introduced as its replacement — it
-- was only ever a one-time backfill target (see the migration that created
-- provider_credentials). decideCredential(), the actual live credential
-- adjudication path, sends no notification of its own. Net effect: a
-- provider has never been notified when staff approved or rejected one of
-- their credentials — the one trigger meant to do that fires on a table
-- nothing writes to anymore. Re-point it at provider_credentials, whose
-- status changes are the real adjudication events.
DROP TRIGGER IF EXISTS trg_notify_verification_change ON public.verifications;

CREATE OR REPLACE FUNCTION public.notify_verification_change()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO public.notifications (user_id, kind, title, body, link)
    VALUES (NEW.provider_id, 'verification_update', 'Verification ' || NEW.status,
      'Your ' || NEW.kind || ' verification is now ' || NEW.status, '/provider/profile');
  END IF;
  RETURN NEW;
END; $$;

CREATE TRIGGER trg_notify_credential_change
AFTER UPDATE ON public.provider_credentials
FOR EACH ROW EXECUTE FUNCTION public.notify_verification_change();
