
-- =====================================================================
-- Enums
-- =====================================================================
CREATE TYPE public.consent_kind AS ENUM (
  'fcra_disclosure',
  'fcra_summary_of_rights',
  'background_check_authorization',
  'investigative_consumer_report',
  'continuous_monitoring',
  'mvr_authorization',
  'state_addendum_ca',
  'state_addendum_ny',
  'state_addendum_wa',
  'state_addendum_ma',
  'state_addendum_nj',
  'state_addendum_mn'
);

CREATE TYPE public.identity_document_kind AS ENUM (
  'id_front',
  'id_back',
  'selfie_liveness',
  'selfie_with_id',
  'proof_of_address',
  'ssn_card',
  'passport'
);

CREATE TYPE public.identity_document_status AS ENUM (
  'uploaded',
  'accepted',
  'rejected',
  'superseded'
);

-- =====================================================================
-- provider_identity
-- =====================================================================
CREATE TABLE public.provider_identity (
  provider_id           uuid PRIMARY KEY REFERENCES public.providers(id) ON DELETE CASCADE,
  legal_first_name      text,
  legal_middle_name     text,
  legal_last_name       text,
  other_names_used      jsonb NOT NULL DEFAULT '[]'::jsonb,
  date_of_birth         date,
  ssn_last4             text,
  ssn_provided_at       timestamptz,
  phone                 text,
  email                 text,
  current_address       jsonb,
  address_history       jsonb NOT NULL DEFAULT '[]'::jsonb,
  drivers_license_number   text,
  drivers_license_state    text,
  drivers_license_expires_on date,
  identity_completed_at timestamptz,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT provider_identity_ssn_last4_len CHECK (ssn_last4 IS NULL OR ssn_last4 ~ '^[0-9]{4}$')
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.provider_identity TO authenticated;
GRANT ALL ON public.provider_identity TO service_role;

ALTER TABLE public.provider_identity ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Provider reads own identity"
  ON public.provider_identity FOR SELECT TO authenticated
  USING (auth.uid() = provider_id
         OR public.has_any_role(auth.uid(), ARRAY['admin','staff','support','success']::public.app_role[]));

CREATE POLICY "Provider inserts own identity"
  ON public.provider_identity FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = provider_id);

CREATE POLICY "Provider updates own identity"
  ON public.provider_identity FOR UPDATE TO authenticated
  USING (auth.uid() = provider_id
         OR public.has_any_role(auth.uid(), ARRAY['admin','staff','support','success']::public.app_role[]))
  WITH CHECK (auth.uid() = provider_id
              OR public.has_any_role(auth.uid(), ARRAY['admin','staff','support','success']::public.app_role[]));

CREATE TRIGGER trg_provider_identity_updated_at
  BEFORE UPDATE ON public.provider_identity
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- =====================================================================
-- provider_consents (append-only ledger)
-- =====================================================================
CREATE TABLE public.provider_consents (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id        uuid NOT NULL REFERENCES public.providers(id) ON DELETE CASCADE,
  kind               public.consent_kind NOT NULL,
  document_version   text NOT NULL,
  document_text_hash text NOT NULL,
  state              text,
  signed_full_name   text NOT NULL,
  signed_at          timestamptz NOT NULL DEFAULT now(),
  ip_address         inet,
  user_agent         text,
  created_at         timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_provider_consents_provider ON public.provider_consents(provider_id, kind, document_version);

GRANT SELECT, INSERT ON public.provider_consents TO authenticated;
GRANT ALL ON public.provider_consents TO service_role;

ALTER TABLE public.provider_consents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Provider reads own consents"
  ON public.provider_consents FOR SELECT TO authenticated
  USING (auth.uid() = provider_id
         OR public.has_any_role(auth.uid(), ARRAY['admin','staff','support','success']::public.app_role[]));

CREATE POLICY "Provider inserts own consents"
  ON public.provider_consents FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = provider_id);

-- Immutability: block UPDATE/DELETE from everyone except service_role
CREATE OR REPLACE FUNCTION public.provider_consents_immutable()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  RAISE EXCEPTION 'Consent records are immutable';
END; $$;

CREATE TRIGGER trg_provider_consents_no_update
  BEFORE UPDATE ON public.provider_consents
  FOR EACH ROW EXECUTE FUNCTION public.provider_consents_immutable();

CREATE TRIGGER trg_provider_consents_no_delete
  BEFORE DELETE ON public.provider_consents
  FOR EACH ROW EXECUTE FUNCTION public.provider_consents_immutable();

-- =====================================================================
-- provider_documents
-- =====================================================================
CREATE TABLE public.provider_documents (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id       uuid NOT NULL REFERENCES public.providers(id) ON DELETE CASCADE,
  kind              public.identity_document_kind NOT NULL,
  document_type     text,
  storage_path      text NOT NULL,
  mime_type         text,
  byte_size         bigint,
  width             integer,
  height            integer,
  capture_metadata  jsonb NOT NULL DEFAULT '{}'::jsonb,
  status            public.identity_document_status NOT NULL DEFAULT 'uploaded',
  rejected_reason   text,
  uploaded_at       timestamptz NOT NULL DEFAULT now(),
  reviewed_at       timestamptz,
  reviewed_by       uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_provider_documents_provider_kind
  ON public.provider_documents(provider_id, kind, status);

GRANT SELECT, INSERT, UPDATE ON public.provider_documents TO authenticated;
GRANT ALL ON public.provider_documents TO service_role;

ALTER TABLE public.provider_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Provider reads own documents"
  ON public.provider_documents FOR SELECT TO authenticated
  USING (auth.uid() = provider_id
         OR public.has_any_role(auth.uid(), ARRAY['admin','staff','support','success']::public.app_role[]));

CREATE POLICY "Provider inserts own documents"
  ON public.provider_documents FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = provider_id);

-- Provider may mark their own doc superseded; only staff can set accepted/rejected.
CREATE POLICY "Provider updates own documents (limited)"
  ON public.provider_documents FOR UPDATE TO authenticated
  USING (auth.uid() = provider_id
         OR public.has_any_role(auth.uid(), ARRAY['admin','staff','support','success']::public.app_role[]))
  WITH CHECK (auth.uid() = provider_id
              OR public.has_any_role(auth.uid(), ARRAY['admin','staff','support','success']::public.app_role[]));

CREATE OR REPLACE FUNCTION public.provider_documents_guard_review()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF public.has_any_role(auth.uid(), ARRAY['admin','staff','support','success']::public.app_role[]) THEN
    RETURN NEW;
  END IF;
  -- Non-staff: can only move status from 'uploaded' -> 'superseded', and cannot set review fields.
  IF NEW.status IS DISTINCT FROM OLD.status
     AND NOT (OLD.status = 'uploaded' AND NEW.status = 'superseded') THEN
    RAISE EXCEPTION 'Only staff may accept or reject documents';
  END IF;
  IF NEW.reviewed_at IS DISTINCT FROM OLD.reviewed_at
     OR NEW.reviewed_by IS DISTINCT FROM OLD.reviewed_by
     OR NEW.rejected_reason IS DISTINCT FROM OLD.rejected_reason THEN
    RAISE EXCEPTION 'Not authorized to change review fields';
  END IF;
  RETURN NEW;
END; $$;

CREATE TRIGGER trg_provider_documents_guard_review
  BEFORE UPDATE ON public.provider_documents
  FOR EACH ROW EXECUTE FUNCTION public.provider_documents_guard_review();

CREATE TRIGGER trg_provider_documents_updated_at
  BEFORE UPDATE ON public.provider_documents
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
