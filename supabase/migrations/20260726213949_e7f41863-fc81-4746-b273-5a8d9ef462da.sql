DROP POLICY IF EXISTS "Staff update credentials" ON public.provider_credentials;
CREATE POLICY "Staff update credentials"
ON public.provider_credentials
FOR UPDATE
TO authenticated
USING (public.has_any_role(auth.uid(), ARRAY['admin','staff','support']::public.app_role[]))
WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin','staff','support']::public.app_role[]));