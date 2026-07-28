// Server-only. Called from checkOutVisit right after a booking flips to
// 'completed' — this is the ONLY place a family is ever charged, matching
// the product's "no surprise charges before you say yes" promise and the
// no-paywall direction: money moves only once real care actually happened,
// never at booking time.
//
// Never throws — a failed/skipped charge must not block check-out. The
// visit is already real regardless of payment outcome; payment_status stays
// 'unpaid' for staff/family to reconcile manually (same fallback markVisitPaid
// already supports) rather than surfacing a payment error mid-checkout to a
// caregiver who just finished a shift.
export type ChargeResult =
  | { charged: true; payment_intent_id: string }
  | { charged: false; reason: string };

export async function chargeCompletedVisit(bookingId: string): Promise<ChargeResult> {
  const { isStripeConfigured, stripe, platformFeeCents } = await import("./client.server");
  if (!isStripeConfigured()) return { charged: false, reason: "stripe_not_configured" };

  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const { data: booking, error: bErr } = await supabaseAdmin
    .from("bookings")
    .select("id, senior_id, provider_id, hourly_rate_cents, duration_minutes, payment_status")
    .eq("id", bookingId)
    .maybeSingle();
  if (bErr || !booking) return { charged: false, reason: "booking_not_found" };
  if (booking.payment_status === "paid") return { charged: false, reason: "already_paid" };

  const [{ data: senior }, { data: provider }] = await Promise.all([
    supabaseAdmin
      .from("profiles")
      .select("stripe_customer_id, stripe_payment_method_id")
      .eq("id", booking.senior_id)
      .maybeSingle(),
    supabaseAdmin
      .from("providers")
      .select("stripe_account_id, stripe_charges_enabled")
      .eq("id", booking.provider_id)
      .maybeSingle(),
  ]);

  if (!senior?.stripe_customer_id || !senior?.stripe_payment_method_id) {
    return { charged: false, reason: "no_payment_method_on_file" };
  }
  if (!provider?.stripe_account_id || !provider.stripe_charges_enabled) {
    return { charged: false, reason: "provider_not_onboarded" };
  }

  const totalCents = Math.round((booking.hourly_rate_cents * booking.duration_minutes) / 60);
  if (totalCents <= 0) return { charged: false, reason: "zero_amount" };
  const feeCents = platformFeeCents(totalCents);

  let intent;
  try {
    intent = await stripe.paymentIntents.create({
      amount: totalCents,
      currency: "usd",
      customer: senior.stripe_customer_id,
      payment_method: senior.stripe_payment_method_id,
      off_session: true,
      confirm: true,
      transfer_data: { destination: provider.stripe_account_id },
      application_fee_amount: feeCents,
      metadata: { booking_id: bookingId },
    });
  } catch (err: any) {
    return { charged: false, reason: `stripe_error: ${err?.message ?? "unknown"}` };
  }

  if (intent.status !== "succeeded") {
    // e.g. requires_action (3DS) — the payment_intent.succeeded webhook
    // will finish reconciling the ledger/booking if it clears later.
    await supabaseAdmin.from("payment_ledger").insert({
      booking_id: bookingId,
      senior_id: booking.senior_id,
      provider_id: booking.provider_id,
      entry_type: "charge",
      amount_cents: totalCents,
      status: "pending",
      memo: `Visit charge (${intent.status})`,
      stripe_payment_intent_id: intent.id,
    });
    return { charged: false, reason: `stripe_status_${intent.status}` };
  }

  const now = new Date().toISOString();
  await supabaseAdmin.from("payment_ledger").insert([
    {
      booking_id: bookingId,
      senior_id: booking.senior_id,
      provider_id: booking.provider_id,
      entry_type: "charge",
      amount_cents: totalCents,
      status: "posted",
      posted_at: now,
      memo: "Visit charge",
      stripe_payment_intent_id: intent.id,
    },
    {
      booking_id: bookingId,
      senior_id: booking.senior_id,
      provider_id: booking.provider_id,
      entry_type: "platform_fee",
      amount_cents: feeCents,
      status: "posted",
      posted_at: now,
      memo: "Platform fee",
      stripe_payment_intent_id: intent.id,
    },
    {
      booking_id: bookingId,
      senior_id: booking.senior_id,
      provider_id: booking.provider_id,
      entry_type: "provider_payout",
      amount_cents: totalCents - feeCents,
      status: "posted",
      posted_at: now,
      memo: "Provider payout (via Stripe Connect destination charge)",
      stripe_payment_intent_id: intent.id,
    },
  ]);

  await supabaseAdmin
    .from("bookings")
    .update({ payment_status: "paid", paid_at: now })
    .eq("id", bookingId);

  return { charged: true, payment_intent_id: intent.id };
}
