
REVOKE ALL ON FUNCTION public.recompute_provider_verification_state(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.trg_recompute_verif_state() FROM PUBLIC, anon, authenticated;
