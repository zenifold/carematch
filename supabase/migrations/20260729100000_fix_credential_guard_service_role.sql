-- provider_credentials_guard_verif_fields() only exempted callers where
-- has_any_role(auth.uid(), staff_roles) is true. auth.uid() reads the JWT
-- 'sub' claim — which is simply absent for requests made with the service
-- role key (no JWT at all), so auth.uid() evaluates to NULL and the guard
-- always raised "Not authorized to change verification status" for exactly
-- the calls decideCredential() makes via supabaseAdmin, even though the
-- staff check already happened at the application layer before the call.
-- BYPASSRLS (which service_role has) only skips RLS *policies* — it does
-- not skip triggers — so this BEFORE UPDATE trigger fired regardless and
-- silently broke the entire admin credential approve/reject action: any
-- staff member clicking Approve or Reject in the Credentials queue got a
-- Postgres exception. Found while testing the notification-trigger fix
-- above using the exact update decideCredential performs.
--
-- current_user is the literal Postgres role PostgREST connects as for a
-- service-role-authenticated request — the same role every GRANT ... TO
-- service_role statement in this schema already relies on — so it's a
-- direct, reliable way to recognize the trusted server-side client.
CREATE OR REPLACE FUNCTION public.provider_credentials_guard_verif_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF current_user = 'service_role' THEN
    RETURN NEW;
  END IF;
  IF public.has_any_role(auth.uid(), ARRAY['admin','staff','support','success']::public.app_role[]) THEN
    RETURN NEW;
  END IF;
  IF NEW.status IS DISTINCT FROM OLD.status
     OR NEW.verified_at IS DISTINCT FROM OLD.verified_at
     OR NEW.verified_by IS DISTINCT FROM OLD.verified_by THEN
    RAISE EXCEPTION 'Not authorized to change verification status';
  END IF;
  RETURN NEW;
END;
$$;
