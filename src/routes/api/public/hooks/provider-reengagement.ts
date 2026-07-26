import { createFileRoute } from "@tanstack/react-router";
import { sendTemplateEmail } from "@/lib/email-templates/send-email";

/**
 * Provider re-engagement drip runner.
 *
 * Scheduled by pg_cron hourly. Scans providers who started onboarding but
 * haven't finished, advances them through 5 drip stages based on how long
 * they've been idle, logs a `reengagement_sent` event for each stage, and
 * (once an email domain is set up) sends the matching template.
 *
 * Auth: caller must present the Supabase publishable/anon key in the
 * `apikey` header. Public-route prefix `/api/public/*` bypasses app auth,
 * so the handler enforces the key check itself.
 */

// Stage → (min idle hours since last activity, template code, subject)
const STAGES: {
  stage: number;
  min_idle_hours: number;
  template: string;
  subject: string;
}[] = [
  { stage: 1, min_idle_hours: 24, template: "provider-drip-day1", subject: "You're almost there — finish in 3 minutes" },
  { stage: 2, min_idle_hours: 24 * 3, template: "provider-drip-day3", subject: "Meet Dolores." },
  { stage: 3, min_idle_hours: 24 * 7, template: "provider-drip-day7", subject: "Your first shift could be this weekend" },
  { stage: 4, min_idle_hours: 24 * 14, template: "provider-drip-day14", subject: "Still interested? Here's $25 to finish." },
  { stage: 5, min_idle_hours: 24 * 30, template: "provider-drip-day30", subject: "One more thing before we say goodbye" },
];

const MAX_BATCH = 200;

async function trySendEmail(
  templateCode: string,
  to: string,
  templateData: Record<string, unknown>,
  idempotencyKey: string,
): Promise<{ sent: boolean; reason?: string }> {
  try {
    const result = await sendTemplateEmail(templateCode, to, { templateData, idempotencyKey });
    return { sent: !!result?.sent, reason: result?.reason };
  } catch (err) {
    console.error(`[provider-reengagement] send failed for ${templateCode}:`, err);
    return { sent: false, reason: "send_error" };
  }
}

export const Route = createFileRoute("/api/public/hooks/provider-reengagement")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        // Auth via anon key (pg_cron uses `apikey` header).
        const anonKey = process.env.SUPABASE_PUBLISHABLE_KEY;
        const provided = request.headers.get("apikey") ?? request.headers.get("x-supabase-apikey");
        if (!anonKey || !provided || provided !== anonKey) {
          return new Response("Unauthorized", { status: 401 });
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        // Pick the next stage per provider, oldest activity first.
        const results: Record<string, number> = {
          scanned: 0,
          skipped_paused: 0,
          skipped_complete: 0,
          would_send: 0,
          sent: 0,
          suppressed: 0,
          failed: 0,
        };

        // Iterate stages from highest to lowest so a provider gets the latest matching stage in one pass.
        const nowISO = new Date().toISOString();

        for (const s of [...STAGES].reverse()) {
          const cutoff = new Date(Date.now() - s.min_idle_hours * 3600 * 1000).toISOString();

          const { data: rows, error } = await supabaseAdmin
            .from("providers")
            .select("id, reengagement_stage, reengagement_paused_at, onboarding_step, last_onboarding_activity_at")
            .lt("onboarding_step", 6)
            .lt("reengagement_stage", s.stage)
            .is("reengagement_paused_at", null)
            .lte("last_onboarding_activity_at", cutoff)
            .order("last_onboarding_activity_at", { ascending: true })
            .limit(MAX_BATCH);

          if (error) {
            console.error("[provider-reengagement] query error:", error);
            return new Response(JSON.stringify({ error: error.message }), {
              status: 500,
              headers: { "Content-Type": "application/json" },
            });
          }

          for (const row of rows ?? []) {
            results.scanned += 1;

            // Look up the caregiver's email (profiles doesn't hold email; use auth.users via admin).
            const { data: userData } = await supabaseAdmin.auth.admin.getUserById(row.id);
            const email = userData?.user?.email;
            const fullName =
              (userData?.user?.user_metadata as { full_name?: string } | null)?.full_name ?? null;

            let sendOutcome: { sent: boolean; reason?: string } = {
              sent: false,
              reason: "no_provider_configured",
            };
            if (email) {
              sendOutcome = await trySendEmail(
                s.template,
                email,
                { first_name: fullName?.split(" ")[0] ?? "there", subject: s.subject },
                `${row.id}:${s.template}`,
              );
            }

            if (sendOutcome.sent) results.sent += 1;
            else if (sendOutcome.reason === "recipient_suppressed") results.suppressed += 1;
            else if (sendOutcome.reason === "no_provider_configured") results.would_send += 1;
            else results.failed += 1;

            // Advance the stage regardless of send outcome so we don't loop.
            await supabaseAdmin
              .from("providers")
              .update({ reengagement_stage: s.stage, last_onboarding_activity_at: row.last_onboarding_activity_at })
              .eq("id", row.id);

            await supabaseAdmin.from("provider_onboarding_events").insert({
              provider_id: row.id,
              event_type: sendOutcome.sent ? "reengagement_sent" : "reengagement_queued",
              step: `drip_${s.stage}`,
              metadata: {
                template: s.template,
                outcome: sendOutcome,
                at: nowISO,
              } as any,
            });
          }
        }

        return new Response(JSON.stringify({ ok: true, ...results }), {
          headers: { "Content-Type": "application/json" },
        });
      },
    },
  },
});
