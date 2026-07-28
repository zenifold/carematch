-- recompute_provider_verification_state() referenced the literal
-- 'submitted' in a status IN (...) list, but verification_status only
-- has pending/passed/failed/expired — 'submitted' was never valid.
-- Since this SECURITY DEFINER function runs from an AFTER INSERT/UPDATE
-- trigger on provider_credentials (trg_recompute_verif_state), and
-- Postgres rejects the invalid enum literal as soon as the IN-list is
-- evaluated, EVERY insert or update to provider_credentials — any
-- provider, any credential kind — has been failing at the trigger level
-- since this function was created, independent of whatever status value
-- the calling code actually used. 'pending' already covers what
-- 'submitted' was meant to mean.
CREATE OR REPLACE FUNCTION public.recompute_provider_verification_state(_provider_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  has_id_submitted boolean;
  has_bg_passed boolean;
  has_basics boolean;
  new_state public.provider_verification_state;
BEGIN
  SELECT EXISTS (SELECT 1 FROM public.provider_credentials
                  WHERE provider_id = _provider_id AND kind = 'id_verification' AND status IN ('pending','passed')),
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
END; $function$;
