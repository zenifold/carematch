DROP POLICY IF EXISTS "profiles readable by authenticated" ON public.profiles;

CREATE POLICY "profiles select self or related" ON public.profiles
FOR SELECT TO authenticated
USING (
  auth.uid() = id
  OR EXISTS (
    SELECT 1 FROM public.family_links fl
    WHERE fl.approved = true
      AND (
        (fl.senior_id = profiles.id AND fl.family_id = auth.uid())
        OR (fl.family_id = profiles.id AND fl.senior_id = auth.uid())
      )
  )
  OR EXISTS (
    SELECT 1 FROM public.bookings b
    WHERE (b.senior_id = profiles.id AND b.provider_id = auth.uid())
       OR (b.provider_id = profiles.id AND b.senior_id = auth.uid())
  )
);

DROP POLICY IF EXISTS "verifications readable by authenticated" ON public.verifications;

CREATE POLICY "verifications select passed or owner" ON public.verifications
FOR SELECT TO authenticated
USING (
  auth.uid() = provider_id
  OR status = 'passed'
);
