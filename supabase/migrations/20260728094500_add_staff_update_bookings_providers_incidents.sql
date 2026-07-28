-- Same silent-failure pattern as the SELECT gaps fixed earlier, but on
-- UPDATE: the app layer already gates these mutations to staff, but the
-- functions run through the RLS-scoped client, and no staff UPDATE policy
-- existed — so the call would "succeed" (no error) while updating zero
-- rows. Confirmed against actual call sites:
--   - adminReassignBooking (admin.functions.ts) updates bookings, gated
--     by assertAdmin ('admin' only) — bookings only had a participants-
--     only UPDATE policy.
--   - adminSetProviderActive (admin.functions.ts) updates providers,
--     gated by assertAdmin ('admin' only) — providers only had a
--     manage-own ALL policy (auth.uid() = id).
--   - updateIncident (incidents.functions.ts) is gated by
--     isTrustSafetyStaff (admin/trust_safety/staff), but the existing
--     "Admins update incidents" policy only covered role='admin' — so a
--     trust_safety or staff (non-admin) user resolving an incident would
--     silently update nothing.

CREATE POLICY "bookings updatable by staff"
  ON public.bookings FOR UPDATE TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin','staff','support','success']::public.app_role[]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin','staff','support','success']::public.app_role[]));

CREATE POLICY "providers updatable by staff"
  ON public.providers FOR UPDATE TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin']::public.app_role[]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin']::public.app_role[]));

DROP POLICY "Admins update incidents" ON public.incidents;
CREATE POLICY "Admins update incidents"
  ON public.incidents FOR UPDATE TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin','trust_safety','staff']::public.app_role[]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin','trust_safety','staff']::public.app_role[]));
