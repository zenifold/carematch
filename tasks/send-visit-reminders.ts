import { defineTask } from "nitro/task";

// Runs hourly (see scheduledTasks in vite.config.ts). Looks 2 hours ahead
// so a visit is caught by at least one run before it starts — this means
// the actual lead time a senior sees is somewhere between ~1-2 hours, not
// a fixed offset. Good enough for an MVP "heads up" reminder; tightening
// it to an exact lead time would need per-booking scheduling instead of a
// fixed-interval sweep.
export default defineTask({
  meta: {
    name: "send-visit-reminders",
    description: "Email seniors who opted in when a visit is starting soon",
  },
  run: async () => {
    const { supabaseAdmin } = await import("../src/integrations/supabase/client.server");
    const { sendTemplateEmail } = await import("../src/lib/email-templates/send-email");

    const now = new Date();
    const windowEnd = new Date(now.getTime() + 2 * 60 * 60 * 1000);

    const { data: bookings, error } = await supabaseAdmin
      .from("bookings")
      .select(
        "id, senior_id, scheduled_at, service_type, provider:providers(profile:profiles(full_name))",
      )
      .in("status", ["requested", "confirmed"])
      .gte("scheduled_at", now.toISOString())
      .lte("scheduled_at", windowEnd.toISOString())
      .is("reminder_sent_at", null);
    if (error) throw error;
    if (!bookings || bookings.length === 0) return { result: { sent: 0, checked: 0 } };

    const seniorIds = Array.from(new Set(bookings.map((b: any) => b.senior_id)));

    const [{ data: prefs }, { data: profiles }, users] = await Promise.all([
      supabaseAdmin
        .from("senior_preferences")
        .select("user_id, notify_before_visit")
        .in("user_id", seniorIds),
      supabaseAdmin.from("profiles").select("id, full_name").in("id", seniorIds),
      // Fetching one page of listUsers and filtering client-side silently
      // dropped anyone outside the first 200 accounts as the user base grew.
      // seniorIds is bounded to "seniors with a visit in the next 2 hours",
      // so looking each one up directly scales regardless of total users.
      Promise.all(seniorIds.map((id) => supabaseAdmin.auth.admin.getUserById(id))),
    ]);

    const prefMap = new Map((prefs ?? []).map((p: any) => [p.user_id, !!p.notify_before_visit]));
    const nameMap = new Map((profiles ?? []).map((p: any) => [p.id, p.full_name as string | null]));
    const emailMap = new Map(
      users
        .filter((u) => u.data?.user)
        .map((u) => [u.data.user!.id, u.data.user!.email as string | null]),
    );

    let sent = 0;
    for (const booking of bookings as any[]) {
      // Opted out (or no row = defaults to off) — mark handled without emailing.
      if (!prefMap.get(booking.senior_id)) {
        await supabaseAdmin
          .from("bookings")
          .update({ reminder_sent_at: new Date().toISOString() })
          .eq("id", booking.id);
        continue;
      }

      const email = emailMap.get(booking.senior_id);
      if (!email) continue;

      const when = new Date(booking.scheduled_at).toLocaleString(undefined, {
        weekday: "long",
        hour: "numeric",
        minute: "2-digit",
      });

      const result = await sendTemplateEmail("visit-reminder", email, {
        templateData: {
          first_name: nameMap.get(booking.senior_id)?.split(" ")[0] ?? "there",
          provider_name: booking.provider?.profile?.full_name ?? "your caregiver",
          service_type: booking.service_type,
          when,
        },
        idempotencyKey: `visit-reminder-${booking.id}`,
      });

      // Only mark as sent if it actually went out (or there's genuinely no
      // provider configured yet) — a transient Resend error should let the
      // next hourly run retry instead of marking it handled forever.
      if (result.sent || result.reason === "no_provider_configured") {
        await supabaseAdmin
          .from("bookings")
          .update({ reminder_sent_at: new Date().toISOString() })
          .eq("id", booking.id);
        if (result.sent) sent += 1;
      }
    }

    return { result: { sent, checked: bookings.length } };
  },
});
