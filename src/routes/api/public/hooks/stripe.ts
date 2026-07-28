import { createFileRoute } from "@tanstack/react-router";
import type Stripe from "stripe";

export const Route = createFileRoute("/api/public/hooks/stripe")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { stripe } = await import("@/lib/stripe/client.server");
        const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
        if (!webhookSecret) {
          return new Response("Webhook not configured", { status: 500 });
        }

        const rawBody = await request.text();
        const signature = request.headers.get("stripe-signature");
        if (!signature) return new Response("Missing signature", { status: 400 });

        let event: Stripe.Event;
        try {
          event = await stripe.webhooks.constructEventAsync(rawBody, signature, webhookSecret);
        } catch (err: any) {
          return new Response(`Invalid signature: ${err?.message ?? "unknown"}`, { status: 400 });
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        // Idempotent event ledger — Stripe retries on anything but a fast 2xx.
        const { error: insErr } = await supabaseAdmin.from("stripe_events").insert({
          stripe_event_id: event.id,
          event_type: event.type,
          payload: event as any,
        });
        if (insErr) {
          // Duplicate id = already processed this event; ack without redoing work.
          if (String(insErr.message).toLowerCase().includes("duplicate")) {
            return new Response("ok (duplicate)", { status: 200 });
          }
          return new Response(`DB error: ${insErr.message}`, { status: 500 });
        }

        try {
          switch (event.type) {
            case "account.updated": {
              const account = event.data.object as Stripe.Account;
              await supabaseAdmin
                .from("providers")
                .update({
                  stripe_charges_enabled: !!account.charges_enabled,
                  stripe_payouts_enabled: !!account.payouts_enabled,
                  stripe_details_submitted: !!account.details_submitted,
                })
                .eq("stripe_account_id", account.id);
              break;
            }

            case "checkout.session.completed": {
              const session = event.data.object as Stripe.Checkout.Session;
              if (session.mode === "setup" && session.customer && session.setup_intent) {
                const setupIntent = await stripe.setupIntents.retrieve(
                  session.setup_intent as string,
                );
                const pmId = setupIntent.payment_method as string | null;
                if (pmId) {
                  const pm = await stripe.paymentMethods.retrieve(pmId);
                  await stripe.customers.update(session.customer as string, {
                    invoice_settings: { default_payment_method: pmId },
                  });
                  await supabaseAdmin
                    .from("profiles")
                    .update({
                      stripe_payment_method_id: pmId,
                      stripe_pm_brand: pm.card?.brand ?? null,
                      stripe_pm_last4: pm.card?.last4 ?? null,
                    })
                    .eq("stripe_customer_id", session.customer as string);
                }
              }
              break;
            }

            case "payment_intent.succeeded":
            case "payment_intent.payment_failed": {
              const pi = event.data.object as Stripe.PaymentIntent;
              // checkOutVisit already writes the ledger rows synchronously on
              // the happy path — this handler exists for the async/delayed
              // outcomes (e.g. a card that required additional
              // authentication) so the ledger still ends up correct even
              // when the visit-completion call didn't get a final answer
              // immediately.
              await supabaseAdmin
                .from("payment_ledger")
                .update({
                  status: event.type === "payment_intent.succeeded" ? "posted" : "reversed",
                  posted_at: new Date().toISOString(),
                })
                .eq("stripe_payment_intent_id", pi.id)
                .eq("status", "pending");
              if (event.type === "payment_intent.succeeded") {
                const bookingId = pi.metadata?.booking_id;
                if (bookingId) {
                  await supabaseAdmin
                    .from("bookings")
                    .update({ payment_status: "paid", paid_at: new Date().toISOString() })
                    .eq("id", bookingId);
                }
              }
              break;
            }

            default:
              break;
          }
        } catch (err: any) {
          await supabaseAdmin
            .from("stripe_events")
            .update({ error: err?.message ?? "unknown error" })
            .eq("stripe_event_id", event.id);
          return new Response(`Handler error: ${err?.message ?? "unknown"}`, { status: 500 });
        }

        await supabaseAdmin
          .from("stripe_events")
          .update({ processed_at: new Date().toISOString() })
          .eq("stripe_event_id", event.id);
        return new Response("ok", { status: 200 });
      },
    },
  },
});
