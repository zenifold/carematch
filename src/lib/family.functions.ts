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
        "id, service_type, scheduled_at, duration_minutes, hourly_rate_cents, status, notes, provider_id, provider:providers!inner(id, profile:profiles!inner(full_name, avatar_url))",
      )
      .eq("senior_id", data.senior_id)
      .order("scheduled_at", { ascending: false });
    if (error) throw error;
    return (rows ?? []).map((row) => {
      const providerRel = row.provider as
        | { profile: { full_name: string | null; avatar_url: string | null } | null }
        | null;
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
      };

    });
  });

export type FamilyBudget = {
  monthly_budget_cents: number | null;
  month_to_date_cents: number;
  last_month_cents: number;
  by_provider: { provider_id: string; provider_name: string | null; cents: number; hours: number }[];
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
    const monthKey = (d: Date) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const currentMonth = monthKey(now);
    const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonth = monthKey(lastMonthDate);

    const monthTotals = new Map<string, number>();
    const providerTotals = new Map<string, { name: string | null; cents: number; minutes: number }>();

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
