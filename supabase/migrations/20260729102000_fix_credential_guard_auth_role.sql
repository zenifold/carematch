-- The previous fix checked current_user = 'service_role', but current_user
-- inside a SECURITY DEFINER function reflects the function's OWNER, not the
-- calling connection — it evaluated to 'postgres' regardless of who called
-- it, so the guard was still blocking every service-role update. Confirmed
-- via a temporary debug RPC: session_user is the pooler's shared
-- 'authenticator' role and current_user is the definer, but auth.role()
-- correctly reads 'service_role' from the request JWT's role claim
-- regardless of SECURITY DEFINER context. That's the right check.
CREATE OR REPLACE FUNCTION public.provider_credentials_guard_verif_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.role() = 'service_role' THEN
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

DROP FUNCTION IF EXISTS public.debug_auth_context();
