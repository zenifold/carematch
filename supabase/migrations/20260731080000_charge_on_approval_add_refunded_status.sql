-- Charging moved from visit-checkout to booking-approval time, so a
-- cancellation after approval now needs to actually refund the family
-- rather than just never having charged them. 'refunded' is the terminal
-- state for that path — distinct from 'unpaid' (never charged at all).
ALTER TABLE public.bookings
  DROP CONSTRAINT IF EXISTS bookings_payment_status_check;
ALTER TABLE public.bookings
  ADD CONSTRAINT bookings_payment_status_check CHECK (payment_status IN ('unpaid', 'paid', 'refunded'));
