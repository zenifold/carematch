import { createFileRoute } from "@tanstack/react-router";
import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Partner postback endpoint for training program funnel events.
 *
 * Request body (JSON):
 *   { referral_id: uuid, event: "applied"|"enrolled"|"completed",
 *     payout_cents?: number, memo?: string }
 *
 * Auth: header `x-carematch-signature` = hex(HMAC-SHA256(TRAINING_POSTBACK_SECRET, raw body))
 *
 * Behavior:
 *   - Stamp the matching lifecycle timestamp on training_referrals.
 *   - On "completed" with payout_cents > 0, insert an `adjustment` row on
 *     payment_ledger (status=pending) so it lands on the Finance dashboard
 *     for staff to post/reverse. training_referral_id links back for audit.
 */
export const Route = createFileRoute("/api/public/training-postback")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env.TRAINING_POSTBACK_SECRET;
        if (!secret) {
          return new Response("Not configured", { status: 503 });
        }

        const raw = await request.text();
        const sig = request.headers.get("x-carematch-signature") ?? "";
        const expected = createHmac("sha256", secret).update(raw).digest("hex");

        let ok = false;
        try {
          const a = Buffer.from(sig, "hex");
          const b = Buffer.from(expected, "hex");
          ok = a.length === b.length && timingSafeEqual(a, b);
        } catch {
          ok = false;
        }
        if (!ok) return new Response("Invalid signature", { status: 401 });

        let payload: {
          referral_id?: string;
          event?: "applied" | "enrolled" | "completed";
          payout_cents?: number;
          memo?: string | null;
        };
        try {
          payload = JSON.parse(raw);
        } catch {
          return new Response("Invalid JSON", { status: 400 });
        }
        const { referral_id, event, payout_cents, memo } = payload;
        if (!referral_id || typeof referral_id !== "string") {
          return new Response("Missing referral_id", { status: 400 });
        }
        if (!event || !["applied", "enrolled", "completed"].includes(event)) {
          return new Response("Invalid event", { status: 400 });
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        const { data: ref, error: refErr } = await supabaseAdmin
          .from("training_referrals")
          .select("id, provider_id, program_id, payout_status")
          .eq("id", referral_id)
          .maybeSingle();
        if (refErr) return new Response(refErr.message, { status: 500 });
        if (!ref) return new Response("Unknown referral", { status: 404 });

        const patch: Record<string, unknown> = {};
        const now = new Date().toISOString();
        if (event === "applied") patch.applied_at = now;
        if (event === "enrolled") patch.enrolled_at = now;
        if (event === "completed") {
          patch.completed_at = now;
          if (typeof payout_cents === "number" && payout_cents > 0) {
            patch.payout_cents = payout_cents;
            patch.payout_status = "pending";
          }
        }
        const { error: updErr } = await supabaseAdmin
          .from("training_referrals")
          .update(patch as never)
          .eq("id", referral_id);
        if (updErr) return new Response(updErr.message, { status: 500 });

        // On completion with a payout, mirror to Finance as a pending adjustment.
        if (event === "completed" && typeof payout_cents === "number" && payout_cents > 0) {
          const { error: ledErr } = await supabaseAdmin.from("payment_ledger").insert({
            entry_type: "adjustment",
            status: "pending",
            amount_cents: payout_cents,
            currency: "USD",
            provider_id: ref.provider_id,
            training_referral_id: ref.id,
            memo: memo ?? `Training referral bounty · ${ref.program_id}`,
          } as never);
          if (ledErr) return new Response(ledErr.message, { status: 500 });
        }

        return new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: { "content-type": "application/json" },
        });
      },
    },
  },
});
