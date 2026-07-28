-- The permissive "profiles readable by authenticated" policy was replaced
-- by a stricter "self or related" policy (self, approved family link, or a
-- shared booking) with no staff carve-out. Staff querying through the
-- RLS-scoped client (not the service-role client) got zero rows for any
-- profile that wasn't their own — silently breaking every admin view that
-- embeds profiles (bookings list, senior/provider directories, the Queue
-- dashboard's senior count) with no error, just empty results.
CREATE POLICY "profiles readable by staff"
  ON public.profiles FOR SELECT TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin','staff','support','success','finance','trust_safety']::public.app_role[]));
