
-- Identity verification records (one per provider, upsert-on-provider)
CREATE TYPE public.idv_status AS ENUM (
  'not_started','processing','requires_input','verified','canceled','failed'
);

CREATE TABLE public.provider_identity_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vendor TEXT NOT NULL DEFAULT 'stripe_identity',
  vendor_session_id TEXT UNIQUE,
  vendor_report_id TEXT,
  client_secret TEXT,
  hosted_url TEXT,
  status public.idv_status NOT NULL DEFAULT 'not_started',
  last_error TEXT,
  raw_last_event JSONB,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (provider_id, vendor)
);

CREATE INDEX idx_pidv_provider ON public.provider_identity_verifications(provider_id);
CREATE INDEX idx_pidv_status ON public.provider_identity_verifications(status);

GRANT SELECT ON public.provider_identity_verifications TO authenticated;
GRANT ALL ON public.provider_identity_verifications TO service_role;

ALTER TABLE public.provider_identity_verifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Providers read own IDV"
  ON public.provider_identity_verifications FOR SELECT
  TO authenticated
  USING (auth.uid() = provider_id);

CREATE POLICY "Staff read all IDV"
  ON public.provider_identity_verifications FOR SELECT
  TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin','staff','support','success']::public.app_role[]));

CREATE TRIGGER trg_pidv_touch
  BEFORE UPDATE ON public.provider_identity_verifications
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Writeback to provider_credentials on verified
CREATE OR REPLACE FUNCTION public.idv_writeback_credential()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'verified'
     AND (TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM NEW.status) THEN
    INSERT INTO public.provider_credentials (provider_id, kind, status, verified_at, source_ref)
    VALUES (NEW.provider_id, 'id_verification', 'passed', now(),
            NEW.vendor || ':' || COALESCE(NEW.vendor_session_id, NEW.id::text))
    ON CONFLICT (provider_id, kind) DO UPDATE
      SET status = 'passed',
          verified_at = now(),
          source_ref = EXCLUDED.source_ref;
  END IF;
  RETURN NEW;
END; $$;

REVOKE EXECUTE ON FUNCTION public.idv_writeback_credential() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER trg_pidv_writeback
  AFTER INSERT OR UPDATE ON public.provider_identity_verifications
  FOR EACH ROW EXECUTE FUNCTION public.idv_writeback_credential();
