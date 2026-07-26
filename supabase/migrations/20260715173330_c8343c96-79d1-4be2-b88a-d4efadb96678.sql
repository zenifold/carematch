
DROP POLICY IF EXISTS "Anyone reads capability opt-ins" ON public.provider_capabilities;
CREATE POLICY "Authenticated reads capability opt-ins" ON public.provider_capabilities FOR SELECT TO authenticated USING (true);
REVOKE SELECT ON public.provider_capabilities FROM anon;

DROP POLICY IF EXISTS "modules readable to all" ON public.provider_training_modules;
CREATE POLICY "modules readable to authenticated" ON public.provider_training_modules FOR SELECT TO authenticated USING (true);
REVOKE SELECT ON public.provider_training_modules FROM anon;

DROP POLICY IF EXISTS "Public reads active capabilities" ON public.service_capabilities;
CREATE POLICY "Authenticated reads active capabilities" ON public.service_capabilities FOR SELECT TO authenticated USING (true);
REVOKE SELECT ON public.service_capabilities FROM anon;

DROP POLICY IF EXISTS "Public reads active programs" ON public.training_programs;
CREATE POLICY "Authenticated reads active programs" ON public.training_programs FOR SELECT TO authenticated USING (true);
REVOKE SELECT ON public.training_programs FROM anon;
