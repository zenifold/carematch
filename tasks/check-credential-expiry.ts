import { defineTask } from "nitro/task";

/**
 * Daily sweep for lapsing provider credentials (see scheduledTasks in
 * vite.config.ts).
 *
 * `verifications.expires_on` was written and read by the credential CRUD paths but
 * nothing ever swept it. A background check could lapse while the provider still
 * read as verified and kept taking bookings, and nobody was told — a hole in the
 * verification the marketing site promises, not just a missing reminder.
 *
 * Notify-only, deliberately. It would be one more line to flip a lapsed row to
 * `expired`, and that is tempting, but the effect is to un-verify a provider and
 * potentially stop them working — a consequential state change that should be made
 * by a person looking at the case, not by a cron job at 07:00. The sweep's job is to
 * make sure a person knows.
 *
 * Daily rather than hourly: expiry moves in days, and an hourly run would either
 * repeat itself 24 times or need state to avoid it.
 */
export default defineTask({
  meta: {
    name: "check-credential-expiry",
    description: "Warn when provider credentials are close to expiry or already lapsed",
  },
  run: async () => {
    const { supabaseAdmin } = await import("../src/integrations/supabase/client.server");
    const {
      buildCredentialExpiryEvent,
      hasAnythingToReport,
      selectAlreadyExpired,
      selectExpiringToday,
    } = await import("../src/lib/credential-expiry");
    const { notifyCredentialExpiry } = await import("../src/lib/support-webhook.server");

    const today = new Date();

    const { data: rows, error } = await supabaseAdmin
      .from("verifications")
      .select("id, provider_id, kind, status, expires_on")
      .not("expires_on", "is", null);
    // Throw rather than treat an error as "nothing expiring" — a silent zero here
    // reads exactly like a healthy day, which is the failure mode this whole task
    // exists to prevent.
    if (error) throw error;

    const all = rows ?? [];
    const expiring = selectExpiringToday(all, today);
    const alreadyExpired = selectAlreadyExpired(all, today);

    if (expiring.length === 0 && alreadyExpired.length === 0) {
      console.log(`[check-credential-expiry] checked=${all.length} expiring=0 expired=0`);
      return { result: { checked: all.length, expiring: 0, expired: 0, notified: false } };
    }

    // Names make the alert actionable — whoever picks it up needs to know who to
    // chase. Only the providers actually mentioned, not every provider.
    const providerIds = Array.from(
      new Set([...expiring, ...alreadyExpired].map((c) => c.provider_id)),
    );
    const { data: profiles } = await supabaseAdmin
      .from("profiles")
      .select("id, full_name")
      .in("id", providerIds);
    const names = new Map<string, string | null>((profiles ?? []).map((p) => [p.id, p.full_name]));

    const event = buildCredentialExpiryEvent({
      // Stable per calendar day, so a receiver deduping on the delivery id drops a
      // second post if the task somehow runs twice.
      runId: `credential-expiry-${today.toISOString().slice(0, 10)}`,
      expiring,
      alreadyExpired,
      nameFor: (id) => names.get(id) ?? null,
      siteOrigin: process.env.SITE_ORIGIN ?? "https://getcompanioncare.com",
    });

    let notified = false;
    if (hasAnythingToReport(event)) {
      const result = await notifyCredentialExpiry(event);
      notified = result.delivered;
      if (!result.delivered && result.reason !== "not_configured") {
        console.error(`[check-credential-expiry] delivery failed: ${result.reason}`);
      }
    }

    // Logged whether or not the webhook is configured, so the finding survives even
    // with no receiver attached — this ran for weeks before one existed.
    console.log(
      `[check-credential-expiry] checked=${all.length} expiring=${expiring.length} ` +
        `expired=${alreadyExpired.length} urgent=${event.urgent} notified=${notified}`,
    );
    if (alreadyExpired.length > 0) {
      console.error(
        `[check-credential-expiry] ${alreadyExpired.length} credential(s) past expiry but still ` +
          `marked passed — providers may be taking bookings while reading as verified`,
      );
    }

    return {
      result: {
        checked: all.length,
        expiring: expiring.length,
        expired: alreadyExpired.length,
        notified,
      },
    };
  },
});
