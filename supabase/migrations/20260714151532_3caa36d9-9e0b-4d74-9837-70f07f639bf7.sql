
ALTER TABLE public.providers
  ADD COLUMN IF NOT EXISTS motivation text,
  ADD COLUMN IF NOT EXISTS last_onboarding_activity_at timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS reengagement_stage smallint NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS reengagement_paused_at timestamptz,
  ADD COLUMN IF NOT EXISTS acknowledged_serious_at timestamptz;

CREATE TABLE IF NOT EXISTS public.provider_onboarding_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id uuid NOT NULL REFERENCES public.providers(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  step text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  occurred_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS provider_onboarding_events_provider_idx
  ON public.provider_onboarding_events(provider_id, occurred_at DESC);

GRANT SELECT, INSERT ON public.provider_onboarding_events TO authenticated;
GRANT ALL ON public.provider_onboarding_events TO service_role;

ALTER TABLE public.provider_onboarding_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Providers read their own onboarding events"
  ON public.provider_onboarding_events
  FOR SELECT TO authenticated
  USING (provider_id = auth.uid() OR public.has_any_role(auth.uid(), ARRAY['admin']::app_role[]));

CREATE POLICY "Providers insert their own onboarding events"
  ON public.provider_onboarding_events
  FOR INSERT TO authenticated
  WITH CHECK (provider_id = auth.uid());
