CREATE OR REPLACE FUNCTION public.debug_auth_context()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN jsonb_build_object(
    'current_user', current_user,
    'session_user', session_user,
    'jwt_claims', current_setting('request.jwt.claims', true),
    'jwt_role_claim', current_setting('request.jwt.claim.role', true),
    'auth_uid', auth.uid(),
    'auth_role', auth.role()
  );
END;
$$;
GRANT EXECUTE ON FUNCTION public.debug_auth_context() TO service_role, authenticated, anon;
