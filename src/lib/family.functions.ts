import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { VisitRow } from "@/lib/bookings.functions";

export type LinkedSenior = {
  senior_id: string;
  full_name: string | null;
  avatar_url: string | null;
  city: string | null;
  permission: string;
  monthly_budget_cents: number | null;
};

/**
 * Approved family links for the signed-in family user, joined with the
 * linked senior's public profile fields. Pending (unapproved) links are
 * intentionally excluded — the senior must approve first.
 */
export const listMyLinkedSeniors = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<LinkedSenior[]> => {
    const { data, error } = await context.supabase
      .from("family_links")
      .select(
        "senior_id, permission, approved, senior:profiles!family_links_senior_id_fkey(full_name, avatar_url, city, monthly_budget_cents)",
      )
      .eq("family_id", context.userId)
      .eq("approved", true);
    if (error) throw error;
    return (data ?? []).map((row) => {
      const senior = row.senior as {
        full_name: string | null;
        avatar_url: string | null;
        city: string | null;
        monthly_budget_cents: number | null;
      } | null;
      return {
        senior_id: row.senior_id,
        full_name: senior?.full_name ?? null,
        avatar_url: senior?.avatar_url ?? null,
        city: senior?.city ?? null,
        permission: row.permission,
        monthly_budget_cents: senior?.monthly_budget_cents ?? null,
      };
    });
  });

const SeniorIdSchema = z.object({ senior_id: z.string().uuid() });

/**
 * Whether the linked senior has granted this family user permission to make
 * changes on their behalf. Reads senior_preferences.family_can_edit under
 * RLS; missing row => false (opted-out by default).
 */
export const getSeniorEditPermission = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => SeniorIdSchema.parse(input))
  .handler(async ({ data, context }): Promise<{ can_edit: boolean; can_see: boolean }> => {
    const { data: row } = await context.supabase
      .from("senior_preferences")
      .select("family_can_edit, family_can_see")
      .eq("user_id", data.senior_id)
      .maybeSingle();
    return {
      can_edit: row?.family_can_edit ?? false,
      can_see: row?.family_can_see ?? true,
    };
  });

export type SeniorCarePlan = {
  care_medical_notes: string | null;
  care_home_notes: string | null;
  care_no_go_notes: string | null;
  care_notes: string | null;
};

/**
 * Care-plan fields for one linked senior. Requires an approved family_link —
 * checked explicitly here rather than relying only on the broader
 * "profiles select self or related" RLS policy, since these fields are more
 * sensitive than name/city/avatar.
 */
export const getSeniorCarePlan = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => SeniorIdSchema.parse(input))
  .handler(async ({ data, context }): Promise<SeniorCarePlan> => {
    const { data: link } = await context.supabase
      .from("family_links")
      .select("senior_id")
      .eq("senior_id", data.senior_id)
      .eq("family_id", context.userId)
      .eq("approved", true)
      .maybeSingle();
    if (!link) throw new Error("Forbidden");

    const { data: row, error } = await context.supabase
      .from("profiles")
      .select("care_medical_notes, care_home_notes, care_no_go_notes, care_notes")
      .eq("id", data.senior_id)
      .maybeSingle();
    if (error) throw error;
    return {
      care_medical_notes: row?.care_medical_notes ?? null,
      care_home_notes: row?.care_home_notes ?? null,
      care_no_go_notes: row?.care_no_go_notes ?? null,
      care_notes: row?.care_notes ?? null,
    };
  });

/**
 * Bookings for one senior the family user is linked to. RLS enforces that
 * the caller must actually have an approved family_link for the senior;
 * the redundant .eq is a defense-in-depth filter.
 */
export const listVisitsForSenior = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => SeniorIdSchema.parse(input))
  .handler(async ({ data, context }): Promise<VisitRow[]> => {
    const { data: rows, error } = await context.supabase
      .from("bookings")
      .select(
        "id, service_type, scheduled_at, duration_minutes, hourly_rate_cents, status, notes, provider_id, payment_status, paid_at, provider:providers!inner(id, profile:profiles!inner(full_name, avatar_url))",
      )
      .eq("senior_id", data.senior_id)
      .order("scheduled_at", { ascending: false });
    if (error) throw error;
    return (rows ?? []).map((row) => {
      const providerRel = row.provider as {
        profile: { full_name: string | null; avatar_url: string | null } | null;
      } | null;
      const profileRel = providerRel?.profile ?? null;
      return {
        id: row.id,
        service_type: row.service_type,
        scheduled_at: row.scheduled_at,
        duration_minutes: row.duration_minutes,
        hourly_rate_cents: row.hourly_rate_cents,
        status: row.status,
        notes: row.notes,
        provider_id: row.provider_id,
        provider_name: profileRel?.full_name ?? null,
        provider_avatar_url: profileRel?.avatar_url ?? null,
        senior_rating: null,
        payment_status: row.payment_status,
        paid_at: row.paid_at,
      };
    });
  });

export type FamilyBudget = {
  monthly_budget_cents: number | null;
  month_to_date_cents: number;
  last_month_cents: number;
  by_provider: {
    provider_id: string;
    provider_name: string | null;
    cents: number;
    hours: number;
  }[];
  by_month: { month: string; cents: number }[];
};

/**
 * Rolls up completed bookings for a linked senior into month-over-month
 * and per-provider totals. Uses the same RLS gate as listVisitsForSenior.
 */
export const getFamilyBudget = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => SeniorIdSchema.parse(input))
  .handler(async ({ data, context }): Promise<FamilyBudget> => {
    const sinceIso = new Date(Date.now() - 1000 * 60 * 60 * 24 * 220).toISOString();
    const { data: rows, error } = await context.supabase
      .from("bookings")
      .select(
        "scheduled_at, duration_minutes, hourly_rate_cents, status, provider_id, provider:providers!inner(profile:profiles!inner(full_name))",
      )
      .eq("senior_id", data.senior_id)
      .eq("status", "completed")
      .gte("scheduled_at", sinceIso);
    if (error) throw error;

    const { data: seniorRow } = await context.supabase
      .from("profiles")
      .select("monthly_budget_cents")
      .eq("id", data.senior_id)
      .maybeSingle();

    const now = new Date();
    const monthKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const currentMonth = monthKey(now);
    const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonth = monthKey(lastMonthDate);

    const monthTotals = new Map<string, number>();
    const providerTotals = new Map<
      string,
      { name: string | null; cents: number; minutes: number }
    >();

    for (const r of rows ?? []) {
      const at = new Date(r.scheduled_at);
      const cents = Math.round((r.hourly_rate_cents * r.duration_minutes) / 60);
      const k = monthKey(at);
      monthTotals.set(k, (monthTotals.get(k) ?? 0) + cents);

      const providerRel = r.provider as { profile: { full_name: string | null } | null } | null;
      const name = providerRel?.profile?.full_name ?? null;
      const prev = providerTotals.get(r.provider_id) ?? { name, cents: 0, minutes: 0 };
      providerTotals.set(r.provider_id, {
        name: prev.name ?? name,
        cents: prev.cents + cents,
        minutes: prev.minutes + r.duration_minutes,
      });
    }

    // Build the last 6 months in chronological order (may be zeros).
    const by_month: { month: string; cents: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      by_month.push({
        month: d.toLocaleDateString(undefined, { month: "short" }),
        cents: monthTotals.get(monthKey(d)) ?? 0,
      });
    }

    return {
      monthly_budget_cents: seniorRow?.monthly_budget_cents ?? null,
      month_to_date_cents: monthTotals.get(currentMonth) ?? 0,
      last_month_cents: monthTotals.get(lastMonth) ?? 0,
      by_provider: Array.from(providerTotals.entries())
        .map(([provider_id, v]) => ({
          provider_id,
          provider_name: v.name,
          cents: v.cents,
          hours: v.minutes / 60,
        }))
        .sort((a, b) => b.cents - a.cents),
      by_month,
    };
  });

const BookingIdSchema = z.object({ booking_id: z.string().uuid() });

async function assertFamilyOrSelf(context: { supabase: any; userId: string }, seniorId: string) {
  if (context.userId === seniorId) return;
  const { data: link } = await context.supabase
    .from("family_links")
    .select("senior_id")
    .eq("senior_id", seniorId)
    .eq("family_id", context.userId)
    .eq("approved", true)
    .maybeSingle();
  if (!link) throw new Error("Forbidden");
}

/**
 * Record-keeping only — no payment is actually collected here. Marks a
 * completed visit as paid outside the app (check, bank transfer, etc.) so
 * the family statement can show a real balance due.
 */
export const markVisitPaid = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => BookingIdSchema.parse(input))
  .handler(async ({ data, context }): Promise<{ ok: true }> => {
    const { data: booking, error: fetchErr } = await context.supabase
      .from("bookings")
      .select("senior_id, status")
      .eq("id", data.booking_id)
      .maybeSingle();
    if (fetchErr) throw fetchErr;
    if (!booking) throw new Error("Visit not found");
    if (booking.status !== "completed") throw new Error("Only completed visits can be marked paid");
    await assertFamilyOrSelf(context, booking.senior_id);

    const { error } = await context.supabase
      .from("bookings")
      .update({
        payment_status: "paid",
        paid_at: new Date().toISOString(),
        paid_by: context.userId,
      })
      .eq("id", data.booking_id);
    if (error) throw error;
    return { ok: true };
  });

export const markVisitUnpaid = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => BookingIdSchema.parse(input))
  .handler(async ({ data, context }): Promise<{ ok: true }> => {
    const { data: booking, error: fetchErr } = await context.supabase
      .from("bookings")
      .select("senior_id")
      .eq("id", data.booking_id)
      .maybeSingle();
    if (fetchErr) throw fetchErr;
    if (!booking) throw new Error("Visit not found");
    await assertFamilyOrSelf(context, booking.senior_id);

    const { error } = await context.supabase
      .from("bookings")
      .update({ payment_status: "unpaid", paid_at: null, paid_by: null })
      .eq("id", data.booking_id);
    if (error) throw error;
    return { ok: true };
  });

const UpdateBudgetSchema = z.object({
  senior_id: z.string().uuid(),
  monthly_budget_cents: z.number().int().min(0).max(1_000_000_00),
});

/**
 * Direct budget edit for family members the senior has granted "make
 * changes" permission to. Family without that permission still goes
 * through createChangeRequest({ kind: "budget" }) for the senior to approve.
 */
export const updateSeniorBudget = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => UpdateBudgetSchema.parse(input))
  .handler(async ({ data, context }): Promise<{ ok: true }> => {
    const { data: link } = await context.supabase
      .from("family_links")
      .select("senior_id")
      .eq("senior_id", data.senior_id)
      .eq("family_id", context.userId)
      .eq("approved", true)
      .maybeSingle();
    if (!link) throw new Error("Forbidden");

    const { data: prefs } = await context.supabase
      .from("senior_preferences")
      .select("family_can_edit")
      .eq("user_id", data.senior_id)
      .maybeSingle();
    if (!prefs?.family_can_edit) throw new Error("Forbidden");

    const { error } = await context.supabase
      .from("profiles")
      .update({ monthly_budget_cents: data.monthly_budget_cents })
      .eq("id", data.senior_id);
    if (error) throw error;
    return { ok: true };
  });

export type FamilyNotificationPrefs = { sms: boolean; email: boolean; push: boolean };

const NotificationPrefsSchema = z.object({
  sms: z.boolean(),
  email: z.boolean(),
  push: z.boolean(),
});

export const getFamilyNotificationPrefs = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<FamilyNotificationPrefs> => {
    const { data, error } = await context.supabase
      .from("family_notification_prefs")
      .select("sms, email, push")
      .eq("user_id", context.userId)
      .maybeSingle();
    if (error) throw error;
    return data ?? { sms: true, email: true, push: false };
  });

export const updateFamilyNotificationPrefs = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => NotificationPrefsSchema.parse(input))
  .handler(async ({ data, context }): Promise<{ ok: true }> => {
    const { error } = await context.supabase
      .from("family_notification_prefs")
      .upsert({ user_id: context.userId, ...data }, { onConflict: "user_id" });
    if (error) throw error;
    return { ok: true };
  });
