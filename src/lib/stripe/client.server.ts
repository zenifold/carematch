// Server-only Stripe client. Load inside server handlers via:
//   const { stripe } = await import("@/lib/stripe/client.server");
// Top-level import is safe only in other .server.ts modules — route files
// and *.functions.ts ship to the client bundle (same rule as
// integrations/supabase/client.server.ts).
import Stripe from "stripe";

function createStripeClient(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error(
      "STRIPE_SECRET_KEY is not configured. Payments features are unavailable until it's set.",
    );
  }
  return new Stripe(key);
}

let _stripe: Stripe | undefined;

export const stripe = new Proxy({} as Stripe, {
  get(_, prop, receiver) {
    if (!_stripe) _stripe = createStripeClient();
    return Reflect.get(_stripe, prop, receiver);
  },
});

/** Basis points (1500 = 15%), configurable via env rather than hardcoded. */
export function platformFeeBps(): number {
  const raw = process.env.PLATFORM_FEE_BPS;
  const parsed = raw ? Number.parseInt(raw, 10) : NaN;
  return Number.isFinite(parsed) && parsed >= 0 && parsed <= 10000 ? parsed : 1500;
}

export function platformFeeCents(totalCents: number): number {
  return Math.round((totalCents * platformFeeBps()) / 10000);
}

export function isStripeConfigured(): boolean {
  return !!process.env.STRIPE_SECRET_KEY;
}
