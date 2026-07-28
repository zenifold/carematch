-- The only SELECT policy on bookings restricted rows to the senior, the
-- assigned provider, or an approved family link — staff had no way to read
-- ANY booking. Every admin console view that queries bookings directly
-- (Queue, Bookings, reassignment) silently returned zero rows for staff,
-- with no error, since the underlying RLS just filtered everything out.
CREATE POLICY "bookings visible to staff"
  ON public.bookings FOR SELECT TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin','staff','support','success']::public.app_role[]));
