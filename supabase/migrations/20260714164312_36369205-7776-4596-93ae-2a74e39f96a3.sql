
DROP POLICY IF EXISTS "Providers manage own credentials" ON public.provider_credentials;

CREATE POLICY "Providers read own credentials" ON public.provider_credentials
  FOR SELECT TO authenticated
  USING (auth.uid() = provider_id);

CREATE POLICY "Providers insert own credential submission" ON public.provider_credentials
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = provider_id
    AND status = 'pending'
    AND verified_at IS NULL
    AND verified_by IS NULL
  );

CREATE POLICY "Providers update own credential fields" ON public.provider_credentials
  FOR UPDATE TO authenticated
  USING (auth.uid() = provider_id)
  WITH CHECK (auth.uid() = provider_id);

CREATE OR REPLACE FUNCTION public.provider_credentials_guard_verif_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
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

DROP TRIGGER IF EXISTS trg_provider_credentials_guard ON public.provider_credentials;
CREATE TRIGGER trg_provider_credentials_guard
BEFORE UPDATE ON public.provider_credentials
FOR EACH ROW EXECUTE FUNCTION public.provider_credentials_guard_verif_fields();

DROP POLICY IF EXISTS "provider writes own completions" ON public.provider_module_completions;
DROP POLICY IF EXISTS "provider updates own completions" ON public.provider_module_completions;

DROP POLICY IF EXISTS "time_off readable by authenticated" ON public.provider_time_off;

CREATE POLICY "time_off readable by owner or booking parties" ON public.provider_time_off
  FOR SELECT TO authenticated
  USING (
    provider_id = auth.uid()
    OR public.has_any_role(auth.uid(), ARRAY['admin','staff','support','success']::public.app_role[])
    OR EXISTS (
      SELECT 1 FROM public.bookings b
      WHERE b.provider_id = provider_time_off.provider_id
        AND b.senior_id = auth.uid()
        AND b.status IN ('requested','confirmed','in_progress','completed')
    )
  );

DROP POLICY IF EXISTS "verifications manage own" ON public.verifications;

CREATE POLICY "verifications insert own" ON public.verifications
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = provider_id
    AND (status IS NULL OR status = 'pending')
    AND verified_on IS NULL
  );

CREATE OR REPLACE FUNCTION public.verifications_guard_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF public.has_any_role(auth.uid(), ARRAY['admin','staff','support','success']::public.app_role[]) THEN
    RETURN NEW;
  END IF;
  IF NEW.status IS DISTINCT FROM OLD.status
     OR NEW.verified_on IS DISTINCT FROM OLD.verified_on
     OR NEW.kind IS DISTINCT FROM OLD.kind
     OR NEW.provider_id IS DISTINCT FROM OLD.provider_id THEN
    RAISE EXCEPTION 'Not authorized to change verification record';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_verifications_guard ON public.verifications;
CREATE TRIGGER trg_verifications_guard
BEFORE UPDATE ON public.verifications
FOR EACH ROW EXECUTE FUNCTION public.verifications_guard_status();

CREATE OR REPLACE FUNCTION public.has_any_role(_user_id uuid, _roles public.app_role[])
RETURNS boolean
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = ANY(_roles)
  )
$$;
