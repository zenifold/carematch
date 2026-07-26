
DO $$ BEGIN
  CREATE TYPE public.provider_verification_state AS ENUM ('pending','provisional','verified','suspended');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE public.providers
  ADD COLUMN IF NOT EXISTS verification_state public.provider_verification_state NOT NULL DEFAULT 'pending';

CREATE TABLE IF NOT EXISTS public.provider_training_modules (
  code text PRIMARY KEY,
  title text NOT NULL,
  version integer NOT NULL DEFAULT 1,
  required_for_tier smallint NOT NULL DEFAULT 0,
  pass_threshold smallint NOT NULL DEFAULT 5,
  total_questions smallint NOT NULL DEFAULT 6,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.provider_training_modules TO authenticated, anon;
GRANT ALL ON public.provider_training_modules TO service_role;
ALTER TABLE public.provider_training_modules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "modules readable to all" ON public.provider_training_modules;
CREATE POLICY "modules readable to all" ON public.provider_training_modules
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "admins manage modules" ON public.provider_training_modules;
CREATE POLICY "admins manage modules" ON public.provider_training_modules
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE IF NOT EXISTS public.provider_module_completions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id uuid NOT NULL REFERENCES public.providers(id) ON DELETE CASCADE,
  module_code text NOT NULL REFERENCES public.provider_training_modules(code) ON DELETE CASCADE,
  score smallint NOT NULL,
  total smallint NOT NULL,
  passed boolean NOT NULL,
  attempts smallint NOT NULL DEFAULT 1,
  passed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (provider_id, module_code)
);

GRANT SELECT, INSERT, UPDATE ON public.provider_module_completions TO authenticated;
GRANT ALL ON public.provider_module_completions TO service_role;
ALTER TABLE public.provider_module_completions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "provider reads own completions" ON public.provider_module_completions;
CREATE POLICY "provider reads own completions" ON public.provider_module_completions
  FOR SELECT TO authenticated
  USING (provider_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "provider writes own completions" ON public.provider_module_completions;
CREATE POLICY "provider writes own completions" ON public.provider_module_completions
  FOR INSERT TO authenticated
  WITH CHECK (provider_id = auth.uid());

DROP POLICY IF EXISTS "provider updates own completions" ON public.provider_module_completions;
CREATE POLICY "provider updates own completions" ON public.provider_module_completions
  FOR UPDATE TO authenticated
  USING (provider_id = auth.uid())
  WITH CHECK (provider_id = auth.uid());

INSERT INTO public.provider_training_modules (code, title, version, required_for_tier, pass_threshold, total_questions)
VALUES ('companion_basics_v1', 'Companion Basics', 1, 0, 5, 6)
ON CONFLICT (code) DO NOTHING;

CREATE OR REPLACE FUNCTION public.recompute_provider_verification_state(_provider_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  has_id_submitted boolean;
  has_bg_passed boolean;
  has_basics boolean;
  new_state public.provider_verification_state;
BEGIN
  SELECT EXISTS (SELECT 1 FROM public.provider_credentials
                  WHERE provider_id = _provider_id AND kind = 'id_verification' AND status IN ('pending','submitted','passed')),
         EXISTS (SELECT 1 FROM public.provider_credentials
                  WHERE provider_id = _provider_id AND kind = 'background_check' AND status = 'passed'),
         EXISTS (SELECT 1 FROM public.provider_module_completions
                  WHERE provider_id = _provider_id AND module_code = 'companion_basics_v1' AND passed = true)
    INTO has_id_submitted, has_bg_passed, has_basics;

  IF has_bg_passed AND has_basics THEN
    new_state := 'verified';
  ELSIF has_id_submitted THEN
    new_state := 'provisional';
  ELSE
    new_state := 'pending';
  END IF;

  UPDATE public.providers
    SET verification_state = new_state
    WHERE id = _provider_id
      AND verification_state <> 'suspended'
      AND verification_state IS DISTINCT FROM new_state;
END; $$;

CREATE OR REPLACE FUNCTION public.trg_recompute_verif_state()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM public.recompute_provider_verification_state(COALESCE(NEW.provider_id, OLD.provider_id));
  RETURN COALESCE(NEW, OLD);
END; $$;

DROP TRIGGER IF EXISTS provider_credentials_verif_state ON public.provider_credentials;
CREATE TRIGGER provider_credentials_verif_state
AFTER INSERT OR UPDATE OR DELETE ON public.provider_credentials
FOR EACH ROW EXECUTE FUNCTION public.trg_recompute_verif_state();

DROP TRIGGER IF EXISTS provider_completions_verif_state ON public.provider_module_completions;
CREATE TRIGGER provider_completions_verif_state
AFTER INSERT OR UPDATE OR DELETE ON public.provider_module_completions
FOR EACH ROW EXECUTE FUNCTION public.trg_recompute_verif_state();
