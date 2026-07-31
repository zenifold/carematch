// Server-only. Charging now happens on booking APPROVAL (acceptBooking),
// not at visit completion — a deliberate change from the original
// "charge on checkout" design, made because CareMatch isn't a bank and
// can't hold funds indefinitely without a real reason to; charging once a
// caregiver has committed to the visit is the more standard marketplace
// pattern, and it's what the cancellation policy already published on the
// pricing page assumes (a 24-hour window implies money has already moved).
//
// This means the charge and the provider's payout are no longer the same
// Stripe call: chargeApprovedBooking is a plain PaymentIntent (funds land in
// CareMatch's own Stripe balance, not yet split), payOutCompletedVisit later
// transfers the provider's cut via a separate Connect transfer once the
// visit is actually checked out (never before — a caregiver who never shows
// up is never paid, even though the family was already charged). If the
// booking gets cancelled before that happens, refundCancelledBooking applies
// the same 24-hour policy from /pricing: full refund outside 24 hours,
// 50%-charged (split evenly between provider and CareMatch) inside it.
//
// None of these throw — a failed/skipped charge, payout, or refund must
// never block the booking-status change that triggered it. payment_status
// stays whatever it was for staff/family to reconcile manually (same
// fallback markVisitPaid already supports).

import type { Database } from "@/integrations/supabase/types";

type PaymentLedgerInsert = Database["public"]["Tables"]["payment_ledger"]["Insert"];

export type ChargeResult =
  | { charged: true; payment_intent_id: string }
  | { charged: false; reason: string };

export type PayoutResult =
  | { paid_out: true; transfer_id: string }
  | { paid_out: false; reason: string };

export type RefundResult =
  | { refunded: true; refund_id: string; refunded_cents: number }
  | { refunded: false; reason: string };

const LATE_CANCEL_WINDOW_MS = 24 * 60 * 60 * 1000;

function totalCentsFor(booking: { hourly_rate_cents: number; duration_minutes: number }): number {
  return Math.round((booking.hourly_rate_cents * booking.duration_minutes) / 60);
}

/** Called from acceptBooking — the moment a caregiver commits to a visit. */
export async function chargeApprovedBooking(bookingId: string): Promise<ChargeResult> {
  const { isStripeConfigured, stripe } = await import("./client.server");
  if (!isStripeConfigured()) return { charged: false, reason: "stripe_not_configured" };

  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const { data: booking, error: bErr } = await supabaseAdmin
    .from("bookings")
    .select("id, senior_id, provider_id, hourly_rate_cents, duration_minutes, payment_status")
    .eq("id", bookingId)
    .maybeSingle();
  if (bErr || !booking) return { charged: false, reason: "booking_not_found" };
  if (booking.payment_status === "paid") return { charged: false, reason: "already_paid" };

  const { data: senior } = await supabaseAdmin
    .from("profiles")
    .select("stripe_customer_id, stripe_payment_method_id")
    .eq("id", booking.senior_id)
    .maybeSingle();
  if (!senior?.stripe_customer_id || !senior?.stripe_payment_method_id) {
    return { charged: false, reason: "no_payment_method_on_file" };
  }

  const totalCents = totalCentsFor(booking);
  if (totalCents <= 0) return { charged: false, reason: "zero_amount" };

  let intent;
  try {
    intent = await stripe.paymentIntents.create({
      amount: totalCents,
      currency: "usd",
      customer: senior.stripe_customer_id,
      payment_method: senior.stripe_payment_method_id,
      off_session: true,
      confirm: true,
      // No transfer_data/application_fee_amount here — funds stay in
      // CareMatch's own balance until the visit is actually checked out.
      metadata: { booking_id: bookingId },
    });
  } catch (err: any) {
    return { charged: false, reason: `stripe_error: ${err?.message ?? "unknown"}` };
  }

  if (intent.status !== "succeeded") {
    await supabaseAdmin.from("payment_ledger").insert({
      booking_id: bookingId,
      senior_id: booking.senior_id,
      provider_id: booking.provider_id,
      entry_type: "charge",
      amount_cents: totalCents,
      status: "pending",
      memo: `Visit charge on approval (${intent.status})`,
      stripe_payment_intent_id: intent.id,
    });
    return { charged: false, reason: `stripe_status_${intent.status}` };
  }

  const now = new Date().toISOString();
  await supabaseAdmin.from("payment_ledger").insert({
    booking_id: bookingId,
    senior_id: booking.senior_id,
    provider_id: booking.provider_id,
    entry_type: "charge",
    amount_cents: totalCents,
    status: "posted",
    posted_at: now,
    memo: "Visit charge on booking approval",
    stripe_payment_intent_id: intent.id,
  });
  await supabaseAdmin
    .from("bookings")
    .update({ payment_status: "paid", paid_at: now })
    .eq("id", bookingId);

  return { charged: true, payment_intent_id: intent.id };
}

/** Called from checkOutVisit — pays the provider their cut, only once the
 * visit they were already charged for has actually happened. */
export async function payOutCompletedVisit(bookingId: string): Promise<PayoutResult> {
  const { isStripeConfigured, stripe, platformFeeCents } = await import("./client.server");
  if (!isStripeConfigured()) return { paid_out: false, reason: "stripe_not_configured" };

  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const { data: booking, error: bErr } = await supabaseAdmin
    .from("bookings")
    .select("id, senior_id, provider_id, hourly_rate_cents, duration_minutes, payment_status")
    .eq("id", bookingId)
    .maybeSingle();
  if (bErr || !booking) return { paid_out: false, reason: "booking_not_found" };
  if (booking.payment_status !== "paid") return { paid_out: false, reason: "not_charged" };

  const { data: existingPayout } = await supabaseAdmin
    .from("payment_ledger")
    .select("id")
    .eq("booking_id", bookingId)
    .eq("entry_type", "provider_payout")
    .maybeSingle();
  if (existingPayout) return { paid_out: false, reason: "already_paid_out" };

  const { data: provider } = await supabaseAdmin
    .from("providers")
    .select("stripe_account_id, stripe_charges_enabled")
    .eq("id", booking.provider_id)
    .maybeSingle();
  if (!provider?.stripe_account_id || !provider.stripe_charges_enabled) {
    return { paid_out: false, reason: "provider_not_onboarded" };
  }

  const totalCents = totalCentsFor(booking);
  const feeCents = platformFeeCents(totalCents);
  const payoutCents = totalCents - feeCents;

  let transfer;
  try {
    transfer = await stripe.transfers.create({
      amount: payoutCents,
      currency: "usd",
      destination: provider.stripe_account_id,
      transfer_group: bookingId,
      metadata: { booking_id: bookingId },
    });
  } catch (err: any) {
    return { paid_out: false, reason: `stripe_error: ${err?.message ?? "unknown"}` };
  }

  const now = new Date().toISOString();
  await supabaseAdmin.from("payment_ledger").insert([
    {
      booking_id: bookingId,
      senior_id: booking.senior_id,
      provider_id: booking.provider_id,
      entry_type: "platform_fee",
      amount_cents: feeCents,
      status: "posted",
      posted_at: now,
      memo: "Platform fee",
      stripe_transfer_id: transfer.id,
    },
    {
      booking_id: bookingId,
      senior_id: booking.senior_id,
      provider_id: booking.provider_id,
      entry_type: "provider_payout",
      amount_cents: payoutCents,
      status: "posted",
      posted_at: now,
      memo: "Provider payout (Stripe Connect transfer, on visit checkout)",
      stripe_transfer_id: transfer.id,
    },
  ]);

  return { paid_out: true, transfer_id: transfer.id };
}

/**
 * Called from cancelBooking/declineBooking when the booking was already
 * charged. Applies the cancellation policy published on /pricing: full
 * refund outside 24 hours of the scheduled start, 50%-charged (split evenly
 * between provider and CareMatch) inside it. Never runs if the provider has
 * already been paid out (that's a post-completion cancellation, a
 * different, rarer case this doesn't attempt to claw back).
 */
export async function refundCancelledBooking(bookingId: string): Promise<RefundResult> {
  const { isStripeConfigured, stripe, platformFeeCents } = await import("./client.server");
  if (!isStripeConfigured()) return { refunded: false, reason: "stripe_not_configured" };

  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const { data: booking, error: bErr } = await supabaseAdmin
    .from("bookings")
    .select("id, senior_id, provider_id, hourly_rate_cents, duration_minutes, payment_status, scheduled_at")
    .eq("id", bookingId)
    .maybeSingle();
  if (bErr || !booking) return { refunded: false, reason: "booking_not_found" };
  if (booking.payment_status !== "paid") return { refunded: false, reason: "not_charged" };

  const { data: existingPayout } = await supabaseAdmin
    .from("payment_ledger")
    .select("id")
    .eq("booking_id", bookingId)
    .eq("entry_type", "provider_payout")
    .maybeSingle();
  if (existingPayout) return { refunded: false, reason: "already_paid_out" };

  const { data: chargeRow } = await supabaseAdmin
    .from("payment_ledger")
    .select("stripe_payment_intent_id, amount_cents")
    .eq("booking_id", bookingId)
    .eq("entry_type", "charge")
    .eq("status", "posted")
    .maybeSingle();
  if (!chargeRow?.stripe_payment_intent_id) return { refunded: false, reason: "no_charge_on_record" };

  const totalCents = chargeRow.amount_cents;
  const msUntilVisit = new Date(booking.scheduled_at).getTime() - Date.now();
  const isLateCancel = msUntilVisit < LATE_CANCEL_WINDOW_MS;

  // Outside 24 hours: full refund. Inside 24 hours: half the visit cost is
  // charged (kept), split evenly between provider and CareMatch; the other
  // half is refunded to the family.
  const refundCents = isLateCancel ? Math.round(totalCents / 2) : totalCents;
  const keptCents = totalCents - refundCents;
  const providerCents = Math.round(keptCents / 2);
  const platformCents = keptCents - providerCents;

  let refund;
  try {
    refund = await stripe.refunds.create({
      payment_intent: chargeRow.stripe_payment_intent_id,
      amount: refundCents,
      metadata: { booking_id: bookingId },
    });
  } catch (err: any) {
    return { refunded: false, reason: `stripe_error: ${err?.message ?? "unknown"}` };
  }

  const now = new Date().toISOString();
  const ledgerRows: PaymentLedgerInsert[] = [
    {
      booking_id: bookingId,
      senior_id: booking.senior_id,
      provider_id: booking.provider_id,
      entry_type: "refund",
      amount_cents: refundCents,
      status: "posted",
      posted_at: now,
      memo: isLateCancel ? "Late cancellation — 50% refund" : "Cancellation — full refund",
      stripe_refund_id: refund.id,
    },
  ];

  if (keptCents > 0) {
    const { data: provider } = await supabaseAdmin
      .from("providers")
      .select("stripe_account_id, stripe_charges_enabled")
      .eq("id", booking.provider_id)
      .maybeSingle();

    let transferId: string | null = null;
    if (provider?.stripe_account_id && provider.stripe_charges_enabled && providerCents > 0) {
      try {
        const transfer = await stripe.transfers.create({
          amount: providerCents,
          currency: "usd",
          destination: provider.stripe_account_id,
          transfer_group: bookingId,
          metadata: { booking_id: bookingId, reason: "late_cancellation_compensation" },
        });
        transferId = transfer.id;
      } catch {
        // Provider not payable right now — the compensation simply stays
        // unpaid in CareMatch's balance rather than blocking the refund.
      }
    }

    ledgerRows.push({
      booking_id: bookingId,
      senior_id: booking.senior_id,
      provider_id: booking.provider_id,
      entry_type: "provider_payout",
      amount_cents: providerCents,
      status: transferId ? "posted" : "pending",
      posted_at: transferId ? now : null,
      memo: "Late-cancellation compensation for reserved time",
      stripe_transfer_id: transferId,
    });
    ledgerRows.push({
      booking_id: bookingId,
      senior_id: booking.senior_id,
      provider_id: booking.provider_id,
      entry_type: "platform_fee",
      amount_cents: platformCents,
      status: "posted",
      posted_at: now,
      memo: "Late-cancellation fee retained by CareMatch",
    });
  }

  await supabaseAdmin.from("payment_ledger").insert(ledgerRows);
  await supabaseAdmin
    .from("bookings")
    .update({ payment_status: "refunded" })
    .eq("id", bookingId);

  return { refunded: true, refund_id: refund.id, refunded_cents: refundCents };
}
