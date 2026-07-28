-- Same gap as the earlier bookings/profiles/tickets/incidents/user_roles
-- fixes, missed in that sweep: family_links only had a participant-scoped
-- SELECT policy. listAdminSeniors (admin.functions.ts) counts approved
-- family links per senior through the RLS-scoped client, so the "Family
-- links" column on /admin/seniors always read 0 for staff, regardless of
-- how many links actually existed.
CREATE POLICY "family_links readable by staff"
  ON public.family_links FOR SELECT TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin','staff','support','success']::public.app_role[]));
