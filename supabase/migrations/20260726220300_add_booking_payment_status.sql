-- Family budget page had zero billing plumbing (pure read-only spend report).
-- Per product decision: invoicing only, no real payment processing — this
-- just lets family/senior record which completed visits have been paid
-- outside the app (check, bank transfer, etc.), so a running balance-due
-- statement is meaningful.
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS payment_status text NOT NULL DEFAULT 'unpaid',
  ADD COLUMN IF NOT EXISTS paid_at timestamptz,
  ADD COLUMN IF NOT EXISTS paid_by uuid REFERENCES auth.users(id);

ALTER TABLE public.bookings
  DROP CONSTRAINT IF EXISTS bookings_payment_status_check;
ALTER TABLE public.bookings
  ADD CONSTRAINT bookings_payment_status_check CHECK (payment_status IN ('unpaid', 'paid'));
