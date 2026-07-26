
-- 1) has_role: switch to SECURITY INVOKER so it can't be misused by signed-in users.
--    Safe because it only reads user_roles, and RLS on user_roles allows each user to read their own rows.
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- 2) verifications: restrict SELECT to owner or admin (drop broad "passed" exposure).
DROP POLICY IF EXISTS "verifications select passed or owner" ON public.verifications;

CREATE POLICY "verifications select owner or admin"
ON public.verifications
FOR SELECT
TO authenticated
USING (
  auth.uid() = provider_id
  OR public.has_role(auth.uid(), 'admin'::public.app_role)
);

-- 3) family_invites: add scoped SELECT policy for the recipient who redeemed the invite.
--    (Senior owner is already covered by the existing ALL policy. Pre-redemption lookup goes
--    through a service-role server function, so no broader read is needed.)
CREATE POLICY "family_invites redeemer reads own"
ON public.family_invites
FOR SELECT
TO authenticated
USING (redeemed_by = auth.uid());
