
-- Allow ledger entries with no direct booking/senior (e.g. referral bounties).
ALTER TABLE public.payment_ledger ALTER COLUMN booking_id DROP NOT NULL;
ALTER TABLE public.payment_ledger ALTER COLUMN senior_id DROP NOT NULL;

-- Link ledger entry back to a training referral when applicable.
ALTER TABLE public.payment_ledger
  ADD COLUMN IF NOT EXISTS training_referral_id uuid
  REFERENCES public.training_referrals(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS payment_ledger_training_referral_idx
  ON public.payment_ledger(training_referral_id);
