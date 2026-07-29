-- Records that a user acknowledged a specific version of a legal document at
-- signup — separate from provider_consents (which is scoped to provider_id
-- and covers FCRA/background-check-specific consents only). This table
-- applies to all account types (Terms of Service, Privacy Policy for
-- everyone; the Independent Contractor Agreement additionally for providers).
CREATE TABLE public.user_legal_acceptances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind text NOT NULL,
  document_version text NOT NULL,
  document_hash text NOT NULL,
  ip_address text,
  user_agent text,
  accepted_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, kind, document_version)
);

CREATE INDEX idx_user_legal_acceptances_user ON public.user_legal_acceptances(user_id);

GRANT SELECT, INSERT ON public.user_legal_acceptances TO authenticated;
GRANT ALL ON public.user_legal_acceptances TO service_role;

ALTER TABLE public.user_legal_acceptances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own legal acceptances"
  ON public.user_legal_acceptances FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Staff read all legal acceptances"
  ON public.user_legal_acceptances FOR SELECT TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin','staff','support','trust_safety']::public.app_role[]));

CREATE POLICY "Users record their own acceptance"
  ON public.user_legal_acceptances FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
