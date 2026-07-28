-- Payments foundation. Charging happens on visit completion (checkOutVisit),
-- never at booking time — matches the existing "no surprise charges before
-- you say yes" copy and the no-paywall product direction. Uses Stripe
-- Connect destination charges: one PaymentIntent per completed visit,
-- application_fee_amount is CareMatch's cut, the remainder auto-transfers to
-- the provider's connected account — Stripe handles the split atomically,
-- no separate transfer call or partial-failure window between charge and payout.

-- Provider payout destination (Stripe Connect Express account).
ALTER TABLE public.providers
  ADD COLUMN stripe_account_id text,
  ADD COLUMN stripe_charges_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN stripe_payouts_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN stripe_details_submitted boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_providers_stripe_account ON public.providers(stripe_account_id);

-- Payer's saved payment method. Lives on profiles (not a new table) since
-- any signed-in user could in principle hold one, but in practice it's the
-- senior's own profile that gets one set — bookings.senior_id is who a
-- visit is charged against, regardless of which family member (with
-- 'financial' permission) walked them through adding the card.
ALTER TABLE public.profiles
  ADD COLUMN stripe_customer_id text,
  ADD COLUMN stripe_payment_method_id text,
  ADD COLUMN stripe_pm_brand text,
  ADD COLUMN stripe_pm_last4 text;

CREATE INDEX IF NOT EXISTS idx_profiles_stripe_customer ON public.profiles(stripe_customer_id);

-- Reference IDs so webhook events can reconcile back to the right ledger rows.
ALTER TABLE public.payment_ledger
  ADD COLUMN stripe_payment_intent_id text,
  ADD COLUMN stripe_transfer_id text,
  ADD COLUMN stripe_refund_id text;

CREATE INDEX IF NOT EXISTS idx_payment_ledger_pi ON public.payment_ledger(stripe_payment_intent_id);

-- Idempotency ledger for the Stripe webhook itself (Stripe retries on
-- anything but a fast 2xx, so the handler must tolerate redelivery).
CREATE TABLE public.stripe_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_event_id text NOT NULL UNIQUE,
  event_type text NOT NULL,
  payload jsonb NOT NULL,
  processed_at timestamptz,
  error text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.stripe_events TO authenticated;
GRANT ALL ON public.stripe_events TO service_role;

ALTER TABLE public.stripe_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff read stripe events"
  ON public.stripe_events FOR SELECT TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin','finance','staff']::public.app_role[]));
