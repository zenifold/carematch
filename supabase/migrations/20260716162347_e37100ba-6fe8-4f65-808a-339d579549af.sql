
-- Enums
CREATE TYPE public.background_check_vendor AS ENUM ('certn','checkr','yardstik','goodhire','manual');
CREATE TYPE public.background_check_package_tier AS ENUM ('basic','basic_plus','enhanced','enhanced_plus_mvr');
CREATE TYPE public.background_check_status AS ENUM ('created','invitation_sent','pending_candidate_info','pending_vendor','clear','consider','suspended','dispute','canceled','error');
CREATE TYPE public.background_check_adjudication AS ENUM ('pending','engaged','pre_adverse_action','adverse_action','cleared');

-- Main table
CREATE TABLE public.provider_background_checks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id uuid NOT NULL REFERENCES public.providers(id) ON DELETE CASCADE,
  vendor public.background_check_vendor NOT NULL,
  vendor_candidate_id text,
  vendor_report_id text,
  package_code text NOT NULL,
  package_tier public.background_check_package_tier NOT NULL,
  status public.background_check_status NOT NULL DEFAULT 'created',
  adjudication public.background_check_adjudication NOT NULL DEFAULT 'pending',
  invitation_url text,
  invitation_expires_at timestamptz,
  ordered_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  cost_cents integer,
  raw_last_event jsonb,
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_pbc_provider ON public.provider_background_checks(provider_id, ordered_at DESC);
CREATE INDEX idx_pbc_status ON public.provider_background_checks(status);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.provider_background_checks TO authenticated;
GRANT ALL ON public.provider_background_checks TO service_role;

ALTER TABLE public.provider_background_checks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Provider reads own background checks"
  ON public.provider_background_checks FOR SELECT TO authenticated
  USING (provider_id = auth.uid());

CREATE POLICY "Staff read all background checks"
  ON public.provider_background_checks FOR SELECT TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin','staff','support','success']::public.app_role[]));

CREATE POLICY "Staff update background checks"
  ON public.provider_background_checks FOR UPDATE TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin','staff','support','success']::public.app_role[]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin','staff','support','success']::public.app_role[]));

CREATE TRIGGER trg_pbc_updated_at BEFORE UPDATE ON public.provider_background_checks
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Events ledger
CREATE TABLE public.background_check_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  background_check_id uuid REFERENCES public.provider_background_checks(id) ON DELETE CASCADE,
  vendor public.background_check_vendor NOT NULL,
  vendor_event_id text NOT NULL,
  event_type text NOT NULL,
  payload jsonb NOT NULL,
  signature_verified boolean NOT NULL DEFAULT false,
  received_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (vendor, vendor_event_id)
);
CREATE INDEX idx_bce_check ON public.background_check_events(background_check_id, received_at DESC);

GRANT SELECT, INSERT ON public.background_check_events TO authenticated;
GRANT ALL ON public.background_check_events TO service_role;

ALTER TABLE public.background_check_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff read all background check events"
  ON public.background_check_events FOR SELECT TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin','staff','support','success']::public.app_role[]));

-- Immutability trigger for events
CREATE OR REPLACE FUNCTION public.background_check_events_immutable()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  RAISE EXCEPTION 'Background check events are immutable';
END; $$;

CREATE TRIGGER trg_bce_no_update BEFORE UPDATE ON public.background_check_events
  FOR EACH ROW EXECUTE FUNCTION public.background_check_events_immutable();
CREATE TRIGGER trg_bce_no_delete BEFORE DELETE ON public.background_check_events
  FOR EACH ROW EXECUTE FUNCTION public.background_check_events_immutable();

-- Credential writeback trigger
CREATE OR REPLACE FUNCTION public.bg_check_writeback_credential()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status = 'clear' AND NEW.adjudication = 'cleared'
     AND (TG_OP = 'INSERT'
          OR OLD.status IS DISTINCT FROM NEW.status
          OR OLD.adjudication IS DISTINCT FROM NEW.adjudication) THEN
    INSERT INTO public.provider_credentials (provider_id, kind, status, verified_at, source_ref)
    VALUES (NEW.provider_id, 'background_check', 'passed', now(),
            NEW.vendor::text || ':' || COALESCE(NEW.vendor_report_id, NEW.vendor_candidate_id, NEW.id::text))
    ON CONFLICT (provider_id, kind) DO UPDATE
      SET status = 'passed',
          verified_at = now(),
          source_ref = EXCLUDED.source_ref;
  END IF;
  RETURN NEW;
END; $$;

CREATE TRIGGER trg_pbc_writeback AFTER INSERT OR UPDATE ON public.provider_background_checks
  FOR EACH ROW EXECUTE FUNCTION public.bg_check_writeback_credential();
