import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Any admin server function must call this first. `has_role` is a
 * security-definer function that reads user_roles safely, so we
 * authorize before returning any data.
 */
async function assertAdmin(context: { supabase: any; userId: string }) {
  const { data, error } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "admin",
  });
  if (error) throw error;
  if (!data) throw new Error("Forbidden");
}

async function writeAudit(
  context: { supabase: any; userId: string },
  entry: {
    action: string;
    entity?: string | null;
    entity_id?: string | null;
    payload?: Record<string, unknown>;
  },
) {
  await context.supabase.from("admin_audit_log").insert({
    actor_id: context.userId,
    action: entry.action,
    entity: entry.entity ?? null,
    entity_id: entry.entity_id ?? null,
    payload: entry.payload ?? {},
  });
}

export type AdminOverview = {
  queue: {
    requested: number;
    confirmed: number;
    in_progress: number;
  };
  totals: {
    seniors: number;
    providers: number;
    active_providers: number;
    bookings_7d: number;
  };
  trust: {
    verifications_pending: number;
    incidents_open: number;
    tickets_open: number;
  };
  recent_bookings: {
    id: string;
    scheduled_at: string;
    service_type: string;
    status: string;
    senior_name: string | null;
    provider_name: string | null;
  }[];
};

export const getAdminOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AdminOverview> => {
    await assertAdmin(context);
    const sb = context.supabase;

    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const [
      requestedC,
      confirmedC,
      inProgressC,
      seniorsC,
      providersC,
      activeProvidersC,
      bookings7dC,
      recent,
      verifPendingC,
      incidentsOpenC,
      ticketsOpenC,
    ] = await Promise.all([
      sb.from("bookings").select("id", { count: "exact", head: true }).eq("status", "requested"),
      sb.from("bookings").select("id", { count: "exact", head: true }).eq("status", "confirmed"),
      sb.from("bookings").select("id", { count: "exact", head: true }).eq("status", "in_progress"),
      sb.from("user_roles").select("user_id", { count: "exact", head: true }).eq("role", "senior"),
      sb.from("providers").select("id", { count: "exact", head: true }),
      sb.from("providers").select("id", { count: "exact", head: true }).eq("is_active", true),
      sb
        .from("bookings")
        .select("id", { count: "exact", head: true })
        .gte("scheduled_at", weekAgo.toISOString()),
      sb
        .from("bookings")
        .select(
          "id, scheduled_at, service_type, status, senior:profiles!bookings_senior_id_fkey(full_name), provider:providers!inner(profile:profiles!inner(full_name))",
        )
        .order("scheduled_at", { ascending: false })
        .limit(10),
      sb.from("provider_credentials").select("id", { count: "exact", head: true }).eq("status", "pending"),
      sb
        .from("incidents")
        .select("id", { count: "exact", head: true })
        .in("status", ["open", "triaged"]),
      sb
        .from("support_tickets")
        .select("id", { count: "exact", head: true })
        .in("status", ["open", "pending"]),
    ]);

    if (recent.error) throw recent.error;

    return {
      queue: {
        requested: requestedC.count ?? 0,
        confirmed: confirmedC.count ?? 0,
        in_progress: inProgressC.count ?? 0,
      },
      totals: {
        seniors: seniorsC.count ?? 0,
        providers: providersC.count ?? 0,
        active_providers: activeProvidersC.count ?? 0,
        bookings_7d: bookings7dC.count ?? 0,
      },
      trust: {
        verifications_pending: verifPendingC.count ?? 0,
        incidents_open: incidentsOpenC.count ?? 0,
        tickets_open: ticketsOpenC.count ?? 0,
      },
      recent_bookings: (recent.data ?? []).map((r: any) => ({
        id: r.id,
        scheduled_at: r.scheduled_at,
        service_type: r.service_type,
        status: r.status,
        senior_name: r.senior?.full_name ?? null,
        provider_name: r.provider?.profile?.full_name ?? null,
      })),
    };
  });

export type AdminSenior = {
  id: string;
  full_name: string | null;
  city: string | null;
  monthly_budget_cents: number | null;
  linked_family: number;
  last_booking_at: string | null;
};

export const listAdminSeniors = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AdminSenior[]> => {
    await assertAdmin(context);
    const sb = context.supabase;

    const { data: seniorRoles, error: rolesErr } = await sb
      .from("user_roles")
      .select("user_id")
      .eq("role", "senior");
    if (rolesErr) throw rolesErr;
    const ids = (seniorRoles ?? []).map((r: any) => r.user_id);
    if (ids.length === 0) return [];

    const [profilesR, familyR, bookingsR] = await Promise.all([
      sb.from("profiles").select("id, full_name, city, monthly_budget_cents").in("id", ids),
      sb
        .from("family_links")
        .select("senior_id, approved")
        .in("senior_id", ids)
        .eq("approved", true),
      sb
        .from("bookings")
        .select("senior_id, scheduled_at")
        .in("senior_id", ids)
        .order("scheduled_at", { ascending: false }),
    ]);
    if (profilesR.error) throw profilesR.error;

    const linkCount = new Map<string, number>();
    for (const l of familyR.data ?? []) {
      linkCount.set(l.senior_id, (linkCount.get(l.senior_id) ?? 0) + 1);
    }
    const lastBooking = new Map<string, string>();
    for (const b of bookingsR.data ?? []) {
      if (!lastBooking.has(b.senior_id)) lastBooking.set(b.senior_id, b.scheduled_at);
    }

    return (profilesR.data ?? []).map((p: any) => ({
      id: p.id,
      full_name: p.full_name,
      city: p.city,
      monthly_budget_cents: p.monthly_budget_cents,
      linked_family: linkCount.get(p.id) ?? 0,
      last_booking_at: lastBooking.get(p.id) ?? null,
    }));
  });

export type AdminProvider = {
  id: string;
  full_name: string | null;
  headline: string | null;
  tier: string;
  is_active: boolean;
  hourly_rate_cents: number;
  years_experience: number | null;
  service_area: string | null;
  verifications_passed: number;
  verifications_total: number;
};

export const listAdminProviders = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AdminProvider[]> => {
    await assertAdmin(context);
    const sb = context.supabase;

    const { data, error } = await sb
      .from("providers")
      .select(
        "id, headline, tier, is_active, hourly_rate_cents, years_experience, service_area, profile:profiles!inner(full_name)",
      )
      .order("created_at", { ascending: false });
    if (error) throw error;

    const ids = (data ?? []).map((row: any) => row.id);
    // provider_credentials.provider_id references profiles(id), not
    // providers(id), so PostgREST can't auto-embed it under `providers` —
    // fetch separately and group in code instead.
    const { data: credRows, error: credErr } = ids.length
      ? await sb.from("provider_credentials").select("provider_id, status").in("provider_id", ids)
      : { data: [] as { provider_id: string; status: string }[], error: null };
    if (credErr) throw credErr;

    const credsByProvider = new Map<string, { status: string }[]>();
    for (const c of credRows ?? []) {
      const list = credsByProvider.get(c.provider_id) ?? [];
      list.push({ status: c.status });
      credsByProvider.set(c.provider_id, list);
    }

    return (data ?? []).map((row: any) => {
      const creds = credsByProvider.get(row.id) ?? [];
      return {
        id: row.id,
        full_name: row.profile?.full_name ?? null,
        headline: row.headline,
        tier: row.tier,
        is_active: row.is_active,
        hourly_rate_cents: row.hourly_rate_cents,
        years_experience: row.years_experience,
        service_area: row.service_area,
        verifications_passed: creds.filter((c) => c.status === "passed").length,
        verifications_total: creds.length,
      };
    });
  });

const SetProviderActiveInput = z.object({
  provider_id: z.string().uuid(),
  is_active: z.boolean(),
});

/**
 * Admin can deactivate a provider (e.g. trust & safety action) even if the
 * provider themselves hasn't — providers can also toggle their own via the
 * "providers manage own" RLS policy, this is the admin override path.
 */
export const adminSetProviderActive = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => SetProviderActiveInput.parse(input))
  .handler(async ({ data, context }): Promise<{ ok: true }> => {
    await assertAdmin(context);
    const { error } = await context.supabase
      .from("providers")
      .update({ is_active: data.is_active })
      .eq("id", data.provider_id);
    if (error) throw error;
    await writeAudit(context, {
      action: data.is_active ? "provider.activate" : "provider.deactivate",
      entity: "providers",
      entity_id: data.provider_id,
    });
    return { ok: true };
  });

export type AdminBooking = {
  id: string;
  scheduled_at: string;
  duration_minutes: number;
  service_type: string;
  status: string;
  hourly_rate_cents: number;
  senior_id: string;
  senior_name: string | null;
  provider_id: string;
  provider_name: string | null;
};

const StatusFilter = z.object({
  status: z.string().optional().nullable(),
});

export const listAdminBookings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => StatusFilter.parse(input ?? {}))
  .handler(async ({ data, context }): Promise<AdminBooking[]> => {
    await assertAdmin(context);
    let query = context.supabase
      .from("bookings")
      .select(
        "id, scheduled_at, duration_minutes, service_type, status, hourly_rate_cents, senior_id, provider_id, senior:profiles!bookings_senior_id_fkey(full_name), provider:providers!inner(profile:profiles!inner(full_name))",
      )
      .order("scheduled_at", { ascending: false })
      .limit(100);
    if (data.status) query = query.eq("status", data.status as any);
    const { data: rows, error } = await query;
    if (error) throw error;
    return (rows ?? []).map((r: any) => ({
      id: r.id,
      scheduled_at: r.scheduled_at,
      duration_minutes: r.duration_minutes,
      service_type: r.service_type,
      status: r.status,
      hourly_rate_cents: r.hourly_rate_cents,
      senior_id: r.senior_id,
      senior_name: r.senior?.full_name ?? null,
      provider_id: r.provider_id,
      provider_name: r.provider?.profile?.full_name ?? null,
    }));
  });

const ReassignBookingInput = z.object({
  booking_id: z.string().uuid(),
  provider_id: z.string().uuid(),
});

/**
 * Reassigns a stuck booking (provider hasn't responded, or asked out) to a
 * different provider and resets it to 'requested' so the new provider gets
 * a fresh chance to accept. Only sensible for requested/confirmed bookings —
 * completed/cancelled/in_progress visits can't be reassigned.
 */
export const adminReassignBooking = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => ReassignBookingInput.parse(input))
  .handler(async ({ data, context }): Promise<{ ok: true }> => {
    await assertAdmin(context);
    const { data: booking, error: fetchErr } = await context.supabase
      .from("bookings")
      .select("status, provider_id")
      .eq("id", data.booking_id)
      .maybeSingle();
    if (fetchErr) throw fetchErr;
    if (!booking) throw new Error("Booking not found");
    if (!["requested", "confirmed"].includes(booking.status)) {
      throw new Error("Only requested or confirmed bookings can be reassigned");
    }

    const { error } = await context.supabase
      .from("bookings")
      .update({ provider_id: data.provider_id, status: "requested" })
      .eq("id", data.booking_id);
    if (error) throw error;
    await writeAudit(context, {
      action: "booking.reassign",
      entity: "bookings",
      entity_id: data.booking_id,
      payload: { from_provider_id: booking.provider_id, to_provider_id: data.provider_id },
    });
    return { ok: true };
  });

export type AdminAnalytics = {
  supply: {
    providers_total: number;
    providers_active: number;
    tier_bronze: number;
    tier_silver: number;
    tier_gold: number;
  };
  demand: {
    bookings_7d: number;
    bookings_30d: number;
    bookings_ytd: number;
    unique_seniors_30d: number;
  };
  trust: {
    verifications_pending: number;
    verifications_passed: number;
    verifications_failed: number;
    incidents_open: number;
    incidents_7d: number;
  };
  financial: {
    gmv_mtd_cents: number;
    gmv_ytd_cents: number;
    completed_30d: number;
  };
  trend_14d: { date: string; count: number }[];
  service_mix_30d: { service_type: string; count: number }[];
};

export const getAdminAnalytics = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AdminAnalytics> => {
    await assertAdmin(context);
    const sb = context.supabase;

    const now = new Date();
    const d7 = new Date(now);
    d7.setDate(d7.getDate() - 7);
    const d30 = new Date(now);
    d30.setDate(d30.getDate() - 30);
    const yearStart = new Date(now.getFullYear(), 0, 1);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const d14 = new Date(now);
    d14.setDate(d14.getDate() - 14);

    const [
      providersAll,
      providersActive,
      tierB,
      tierS,
      tierG,
      b7,
      b30,
      ytdRows,
      mtdRows,
      uniqueRows,
      vPending,
      vPassed,
      vFailed,
      incOpen,
      inc7,
      trendRows,
      mixRows,
    ] = await Promise.all([
      sb.from("providers").select("id", { count: "exact", head: true }),
      sb.from("providers").select("id", { count: "exact", head: true }).eq("is_active", true),
      sb.from("providers").select("id", { count: "exact", head: true }).eq("tier", "bronze"),
      sb.from("providers").select("id", { count: "exact", head: true }).eq("tier", "silver"),
      sb.from("providers").select("id", { count: "exact", head: true }).eq("tier", "gold"),
      sb
        .from("bookings")
        .select("id", { count: "exact", head: true })
        .gte("scheduled_at", d7.toISOString()),
      sb
        .from("bookings")
        .select("id", { count: "exact", head: true })
        .gte("scheduled_at", d30.toISOString()),
      sb
        .from("bookings")
        .select("hourly_rate_cents, duration_minutes, status, scheduled_at")
        .gte("scheduled_at", yearStart.toISOString()),
      sb
        .from("bookings")
        .select("hourly_rate_cents, duration_minutes, status")
        .gte("scheduled_at", monthStart.toISOString()),
      sb.from("bookings").select("senior_id").gte("scheduled_at", d30.toISOString()),
      sb.from("provider_credentials").select("id", { count: "exact", head: true }).eq("status", "pending"),
      sb.from("provider_credentials").select("id", { count: "exact", head: true }).eq("status", "passed"),
      sb.from("provider_credentials").select("id", { count: "exact", head: true }).eq("status", "failed"),
      sb
        .from("incidents")
        .select("id", { count: "exact", head: true })
        .in("status", ["open", "triaged"]),
      sb
        .from("incidents")
        .select("id", { count: "exact", head: true })
        .gte("created_at", d7.toISOString()),
      sb.from("bookings").select("scheduled_at").gte("scheduled_at", d14.toISOString()),
      sb.from("bookings").select("service_type").gte("scheduled_at", d30.toISOString()),
    ]);

    const gmv = (rows: any[] | null) =>
      (rows ?? [])
        .filter((r) => r.status !== "cancelled")
        .reduce((s, r) => s + Math.round((r.hourly_rate_cents * r.duration_minutes) / 60), 0);
    const completed30 = (mtdRows.data ?? []).filter((r: any) => r.status === "completed").length;
    const uniqueSeniors = new Set((uniqueRows.data ?? []).map((r: any) => r.senior_id)).size;

    // 14-day trend
    const dayBuckets = new Map<string, number>();
    for (let i = 13; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      dayBuckets.set(d.toISOString().slice(0, 10), 0);
    }
    for (const r of trendRows.data ?? []) {
      const key = new Date((r as any).scheduled_at).toISOString().slice(0, 10);
      if (dayBuckets.has(key)) dayBuckets.set(key, (dayBuckets.get(key) ?? 0) + 1);
    }
    const trend_14d = Array.from(dayBuckets.entries()).map(([date, count]) => ({ date, count }));

    // service mix
    const mixMap = new Map<string, number>();
    for (const r of mixRows.data ?? []) {
      const k = (r as any).service_type ?? "other";
      mixMap.set(k, (mixMap.get(k) ?? 0) + 1);
    }
    const service_mix_30d = Array.from(mixMap.entries())
      .map(([service_type, count]) => ({ service_type, count }))
      .sort((a, b) => b.count - a.count);

    return {
      supply: {
        providers_total: providersAll.count ?? 0,
        providers_active: providersActive.count ?? 0,
        tier_bronze: tierB.count ?? 0,
        tier_silver: tierS.count ?? 0,
        tier_gold: tierG.count ?? 0,
      },
      demand: {
        bookings_7d: b7.count ?? 0,
        bookings_30d: b30.count ?? 0,
        bookings_ytd: (ytdRows.data ?? []).length,
        unique_seniors_30d: uniqueSeniors,
      },
      trust: {
        verifications_pending: vPending.count ?? 0,
        verifications_passed: vPassed.count ?? 0,
        verifications_failed: vFailed.count ?? 0,
        incidents_open: incOpen.count ?? 0,
        incidents_7d: inc7.count ?? 0,
      },
      financial: {
        gmv_mtd_cents: gmv(mtdRows.data),
        gmv_ytd_cents: gmv(ytdRows.data),
        completed_30d: completed30,
      },
      trend_14d,
      service_mix_30d,
    };
  });

/**
 * Cheap-and-dirty check that runs in the admin layout `beforeLoad` so a
 * non-admin who guesses the URL is redirected before any admin data is
 * fetched. The individual server functions also assert admin.
 */
export const checkIsAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ isAdmin: boolean }> => {
    const { data, error } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (error) throw error;
    return { isAdmin: !!data };
  });

/**
 * Coarse gate for the whole /admin subtree. Individual pages/server functions
 * (Support, Success, Finance, Credentials, Trust & Safety) each further
 * restrict to their own narrower role set — this only decides whether the
 * console is reachable at all, so any staff-type role should pass.
 */
const ALL_STAFF_ROLES = [
  "admin",
  "staff",
  "support",
  "finance",
  "success",
  "trust_safety",
] as const;

export const getMyStaffRoles = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ roles: string[] }> => {
    const { data, error } = await context.supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId)
      .in("role", ALL_STAFF_ROLES);
    if (error) throw error;
    return { roles: (data ?? []).map((r: { role: string }) => r.role) };
  });
