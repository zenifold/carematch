import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type ProviderJob = {
  id: string;
  service_type: string;
  scheduled_at: string;
  duration_minutes: number;
  hourly_rate_cents: number;
  status: string;
  notes: string | null;
  senior_id: string;
  senior_name: string | null;
  senior_avatar_url: string | null;
  senior_city: string | null;
};

/**
 * Bookings assigned to the signed-in provider, joined with senior profile.
 * RLS scopes the caller to their own rows automatically.
 */
export const listProviderJobs = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<ProviderJob[]> => {
    const { data, error } = await context.supabase
      .from("bookings")
      .select(
        "id, service_type, scheduled_at, duration_minutes, hourly_rate_cents, status, notes, senior_id, senior:profiles!bookings_senior_id_fkey(full_name, avatar_url, city)",
      )
      .eq("provider_id", context.userId)
      .order("scheduled_at", { ascending: true });
    if (error) throw error;
    return (data ?? []).map((row) => {
      const senior = row.senior as
        | { full_name: string | null; avatar_url: string | null; city: string | null }
        | null;
      return {
        id: row.id,
        service_type: row.service_type,
        scheduled_at: row.scheduled_at,
        duration_minutes: row.duration_minutes,
        hourly_rate_cents: row.hourly_rate_cents,
        status: row.status,
        notes: row.notes,
        senior_id: row.senior_id,
        senior_name: senior?.full_name ?? null,
        senior_avatar_url: senior?.avatar_url ?? null,
        senior_city: senior?.city ?? null,
      };
    });
  });

export type ProviderVerification = {
  id: string;
  kind: string;
  status: string;
  verified_on: string | null;
  expires_on: string | null;
  vendor: string | null;
};

export const listMyVerifications = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<ProviderVerification[]> => {
    const { data, error } = await context.supabase
      .from("verifications")
      .select("id, kind, status, verified_on, expires_on, vendor")
      .eq("provider_id", context.userId)
      .order("created_at", { ascending: true });
    if (error) throw error;
    return data ?? [];
  });

export type ProviderEarningsPeriod = {
  gross_cents: number;
  bookings: number;
  hours: number;
};

export type ProviderEarnings = {
  this_week: ProviderEarningsPeriod;
  last_week: ProviderEarningsPeriod;
  month_to_date: ProviderEarningsPeriod;
  year_to_date: ProviderEarningsPeriod;
  platform_fee_bps: number; // basis points (1600 = 16%)
  history: {
    week_start: string;
    week_end: string;
    gross_cents: number;
    fee_cents: number;
    net_cents: number;
  }[];
};

function startOfWeek(d: Date): Date {
  const out = new Date(d);
  out.setHours(0, 0, 0, 0);
  const dow = out.getDay(); // 0 Sun … 6 Sat
  const diff = (dow + 6) % 7; // Monday-start
  out.setDate(out.getDate() - diff);
  return out;
}

/**
 * Aggregates completed-booking earnings for the signed-in provider.
 * Platform fee is a flat 16% (Silver tier default) until per-provider tier
 * fees are wired up; the response includes the fee bps so the UI stays
 * accurate when that changes.
 */
export const getProviderEarnings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<ProviderEarnings> => {
    const now = new Date();
    const thisWeekStart = startOfWeek(now);
    const lastWeekStart = new Date(thisWeekStart);
    lastWeekStart.setDate(lastWeekStart.getDate() - 7);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const yearStart = new Date(now.getFullYear(), 0, 1);
    const historyStart = new Date(thisWeekStart);
    historyStart.setDate(historyStart.getDate() - 7 * 8);

    const { data, error } = await context.supabase
      .from("bookings")
      .select("scheduled_at, duration_minutes, hourly_rate_cents, status")
      .eq("provider_id", context.userId)
      .in("status", ["completed", "confirmed", "in_progress"])
      .gte("scheduled_at", historyStart.toISOString())
      .order("scheduled_at", { ascending: false });
    if (error) throw error;

    const empty = (): ProviderEarningsPeriod => ({ gross_cents: 0, bookings: 0, hours: 0 });
    const this_week = empty();
    const last_week = empty();
    const month_to_date = empty();
    const year_to_date = empty();
    const weekBuckets = new Map<string, ProviderEarningsPeriod>();

    for (const row of data ?? []) {
      const at = new Date(row.scheduled_at);
      const hours = row.duration_minutes / 60;
      const gross = Math.round((row.hourly_rate_cents * row.duration_minutes) / 60);
      const push = (p: ProviderEarningsPeriod) => {
        p.gross_cents += gross;
        p.bookings += 1;
        p.hours += hours;
      };
      if (at >= yearStart) push(year_to_date);
      if (at >= monthStart) push(month_to_date);
      if (at >= thisWeekStart) push(this_week);
      else if (at >= lastWeekStart) push(last_week);

      const wkStart = startOfWeek(at);
      const key = wkStart.toISOString();
      if (!weekBuckets.has(key)) weekBuckets.set(key, empty());
      push(weekBuckets.get(key)!);
    }

    const feeBps = 1600;
    const history = Array.from(weekBuckets.entries())
      .map(([key, bucket]) => {
        const start = new Date(key);
        const end = new Date(start);
        end.setDate(end.getDate() + 6);
        const fee = Math.round((bucket.gross_cents * feeBps) / 10000);
        return {
          week_start: start.toISOString(),
          week_end: end.toISOString(),
          gross_cents: bucket.gross_cents,
          fee_cents: fee,
          net_cents: bucket.gross_cents - fee,
        };
      })
      .sort((a, b) => (a.week_start < b.week_start ? 1 : -1));

    return {
      this_week,
      last_week,
      month_to_date,
      year_to_date,
      platform_fee_bps: feeBps,
      history,
    };
  });
