import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const CreateBookingSchema = z.object({
  provider_id: z.string().uuid(),
  service_type: z.string().min(1),
  scheduled_at: z.string().datetime(),
  duration_minutes: z
    .number()
    .int()
    .min(30)
    .max(24 * 60),
  hourly_rate_cents: z.number().int().min(0),
  notes: z.string().max(2000).optional().nullable(),
});

export type VisitRow = {
  id: string;
  service_type: string;
  scheduled_at: string;
  duration_minutes: number;
  hourly_rate_cents: number;
  status: string;
  notes: string | null;
  provider_id: string;
  provider_name: string | null;
  provider_avatar_url: string | null;
  senior_rating: string | null;
  payment_status: string;
  paid_at: string | null;
};

export const createBooking = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => CreateBookingSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("bookings")
      .insert({
        senior_id: context.userId,
        provider_id: data.provider_id,
        service_type: data.service_type,
        scheduled_at: data.scheduled_at,
        duration_minutes: data.duration_minutes,
        hourly_rate_cents: data.hourly_rate_cents,
        notes: data.notes ?? null,
      })
      .select("id")
      .single();
    if (error) throw error;
    return { id: row.id };
  });

export const listMyBookings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("bookings")
      .select("*")
      .eq("senior_id", context.userId)
      .order("scheduled_at", { ascending: true });
    if (error) throw error;
    return data;
  });

/**
 * Bookings for the signed-in senior, joined with the provider's profile
 * so the visit list can render a name + avatar without extra client fetches.
 */
export const listMyVisits = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<VisitRow[]> => {
    const { data, error } = await context.supabase
      .from("bookings")
      .select(
        "id, service_type, scheduled_at, duration_minutes, hourly_rate_cents, status, notes, provider_id, payment_status, paid_at, provider:providers!inner(id, profile:profiles!inner(full_name, avatar_url)), visit:visits(senior_rating)",
      )
      .eq("senior_id", context.userId)
      .order("scheduled_at", { ascending: false });
    if (error) throw error;
    return (data ?? []).map((row) => {
      const providerRel = row.provider as {
        profile: { full_name: string | null; avatar_url: string | null } | null;
      } | null;
      const profileRel = providerRel?.profile ?? null;
      const visitRel = row.visit as
        { senior_rating: string | null } | { senior_rating: string | null }[] | null;
      const visit = Array.isArray(visitRel) ? (visitRel[0] ?? null) : visitRel;
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
        senior_rating: visit?.senior_rating ?? null,
        payment_status: row.payment_status,
        paid_at: row.paid_at,
      };
    });
  });

export const getVisit = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }): Promise<VisitRow | null> => {
    const { data: row, error } = await context.supabase
      .from("bookings")
      .select(
        "id, service_type, scheduled_at, duration_minutes, hourly_rate_cents, status, notes, provider_id, senior_id, payment_status, paid_at, provider:providers!inner(id, profile:profiles!inner(full_name, avatar_url))",
      )
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw error;
    if (!row) return null;
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

export type MatchedProvider = {
  id: string;
  name: string;
  avatar_url: string | null;
  headline: string | null;
  bio: string | null;
  hourly_rate_cents: number;
  years_experience: number | null;
  specialties: string[];
  languages: string[];
  service_area: string | null;
  tier: string;
  rating_avg: number | null;
  rating_count: number;
  verification_state: string;
};

/**
 * Active marketplace providers, joined with their profile for name/avatar.
 * Client-side filtering by specialty can happen after the fetch — the
 * result set is bounded and small in early metros.
 */
const MatchInput = z
  .object({
    min_tier: z.number().int().min(0).max(3).optional(),
    capability_code: z.string().max(60).optional().nullable(),
  })
  .optional();

export const matchProviders = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => MatchInput.parse(i ?? {}))
  .handler(async ({ data, context }): Promise<MatchedProvider[]> => {
    const minTier = data?.min_tier ?? 0;
    const capability = data?.capability_code ?? null;

    // If a capability is required, first resolve providers who opted in.
    let capOptIn: Set<string> | null = null;
    let capRequiredTier = 0;
    if (capability) {
      const { data: cap } = await context.supabase
        .from("service_capabilities")
        .select("required_tier")
        .eq("code", capability)
        .maybeSingle();
      capRequiredTier = cap?.required_tier ?? 0;
      const { data: opted } = await context.supabase
        .from("provider_capabilities")
        .select("provider_id")
        .eq("capability_code", capability)
        .eq("opted_in", true);
      capOptIn = new Set((opted ?? []).map((r: any) => r.provider_id as string));
      if (capOptIn.size === 0) return [];
    }

    const requiredTier = Math.max(minTier, capRequiredTier);

    let q = context.supabase
      .from("providers")
      .select(
        "id, headline, bio, hourly_rate_cents, years_experience, specialties, languages, service_area, tier, service_tier, is_active, rating_avg, rating_count, verification_state, profile:profiles!inner(full_name, avatar_url)",
      )
      .eq("is_active", true)
      .gte("service_tier", requiredTier)
      // "Best match" means proven quality first, not just cheapest: higher
      // tier (a real proxy for verification depth), then higher rating for
      // providers who have one — nullsFirst:false keeps unrated providers
      // from being buried behind a single lucky 5-star, but doesn't let them
      // outrank someone with a real track record either — price only breaks
      // ties among otherwise-similar options.
      .order("tier", { ascending: false })
      .order("rating_avg", { ascending: false, nullsFirst: false })
      .order("hourly_rate_cents", { ascending: true })
      .limit(50);
    if (capOptIn) q = q.in("id", Array.from(capOptIn));

    const { data: rows, error } = await q;
    if (error) throw error;
    return (rows ?? []).map((row: any) => {
      const profile = row.profile as {
        full_name: string | null;
        avatar_url: string | null;
      } | null;
      return {
        id: row.id,
        name: profile?.full_name ?? "Provider",
        avatar_url: profile?.avatar_url ?? null,
        headline: row.headline,
        bio: row.bio,
        hourly_rate_cents: row.hourly_rate_cents,
        years_experience: row.years_experience,
        specialties: row.specialties ?? [],
        languages: row.languages ?? [],
        service_area: row.service_area,
        tier: row.tier,
        rating_avg: row.rating_avg,
        rating_count: row.rating_count ?? 0,
        verification_state: row.verification_state,
      };
    });
  });

// ============================================================
// Notify-me: senior asks concierge to reach out when a matching
// provider becomes available. Creates a CS task via admin client.
// ============================================================

const NotifyInput = z.object({
  service_type: z.string().min(1).max(120),
  min_tier: z.number().int().min(0).max(3).default(0),
  days: z.array(z.string().max(8)).max(7).default([]),
  slot: z.string().max(20).nullable().optional(),
  budget_monthly: z.number().int().min(0).max(100000).nullable().optional(),
  free_text: z.string().max(500).nullable().optional(),
});

export const requestProviderNotification = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => NotifyInput.parse(i))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Look up senior name for the task title.
    const { data: profile } = await context.supabase
      .from("profiles")
      .select("full_name")
      .eq("id", context.userId)
      .maybeSingle();
    const seniorName = (profile as { full_name: string | null } | null)?.full_name ?? "A senior";

    const noteLines = [
      `Senior: ${seniorName} (${context.userId})`,
      `Service: ${data.service_type}`,
      `Min tier required: ${data.min_tier}`,
      data.days.length ? `Days: ${data.days.join(", ")}` : null,
      data.slot ? `Time of day: ${data.slot}` : null,
      data.budget_monthly ? `Budget: $${data.budget_monthly}/mo` : null,
      data.free_text ? `Notes: ${data.free_text}` : null,
    ].filter(Boolean);

    const { error } = await supabaseAdmin.from("cs_tasks").insert({
      title: `Provider wait-list: ${data.service_type}`,
      notes: noteLines.join("\n"),
      status: "open",
      priority: "normal",
      target_user_id: context.userId,
      created_by: context.userId,
    });
    if (error) throw error;
    return { ok: true };
  });

// ============================================================
// Booking lifecycle: accept / decline / cancel / reschedule
// check-in / check-out / rate
// ============================================================

const IdInput = z.object({ id: z.string().uuid() });

/**
 * Provider accepts a requested booking. Also creates a visits row so both
 * sides can check in/out later. RLS scopes update to participants only.
 */
export const acceptBooking = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => IdInput.parse(input))
  .handler(async ({ data, context }) => {
    // Gate: provider must have passed Companion Basics before accepting any job.
    const { data: basics } = await context.supabase
      .from("provider_module_completions")
      .select("passed")
      .eq("provider_id", context.userId)
      .eq("module_code", "companion_basics_v1")
      .maybeSingle();
    if (!basics?.passed) {
      throw new Error("Finish the Companion Basics course before accepting your first job.");
    }

    const { error: updErr } = await context.supabase
      .from("bookings")
      .update({ status: "confirmed" })
      .eq("id", data.id)
      .eq("provider_id", context.userId);
    if (updErr) throw updErr;
    const { data: existing } = await context.supabase
      .from("visits")
      .select("id")
      .eq("booking_id", data.id)
      .maybeSingle();
    if (!existing) {
      const { error: visitErr } = await context.supabase
        .from("visits")
        .insert({ booking_id: data.id });
      if (visitErr) throw visitErr;
    }
    return { ok: true };
  });

export const declineBooking = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => IdInput.parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("bookings")
      .update({ status: "cancelled" })
      .eq("id", data.id)
      .eq("provider_id", context.userId);
    if (error) throw error;
    return { ok: true };
  });

export const cancelBooking = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => IdInput.parse(input))
  .handler(async ({ data, context }) => {
    // Either senior or provider can cancel — RLS enforces participation.
    const { error } = await context.supabase
      .from("bookings")
      .update({ status: "cancelled" })
      .eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

export const rescheduleBooking = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        scheduled_at: z.string().datetime(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("bookings")
      .update({ scheduled_at: data.scheduled_at, status: "requested" })
      .eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

/**
 * Provider marks arrival. Optionally records geolocation from the device.
 * Advances booking → in_progress and stamps visit.
 */
export const checkInVisit = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        lat: z.number().min(-90).max(90).optional().nullable(),
        lng: z.number().min(-180).max(180).optional().nullable(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { data: existing } = await context.supabase
      .from("visits")
      .select("id")
      .eq("booking_id", data.id)
      .maybeSingle();
    const now = new Date().toISOString();
    const patch = {
      checked_in_at: now,
      checkin_lat: data.lat ?? null,
      checkin_lng: data.lng ?? null,
    };
    if (existing) {
      const { error } = await context.supabase
        .from("visits")
        .update(patch)
        .eq("booking_id", data.id);
      if (error) throw error;
    } else {
      const { error } = await context.supabase
        .from("visits")
        .insert({ booking_id: data.id, ...patch });
      if (error) throw error;
    }
    const { error: bErr } = await context.supabase
      .from("bookings")
      .update({ status: "in_progress" })
      .eq("id", data.id)
      .eq("provider_id", context.userId);
    if (bErr) throw bErr;
    return { ok: true };
  });

export const checkOutVisit = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        provider_notes: z.string().max(4000).optional().nullable(),
        checkout_summary_text: z.string().max(4000).optional().nullable(),
        checkout_voice_url: z.string().max(1000).optional().nullable(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const now = new Date().toISOString();
    const { error: vErr } = await context.supabase
      .from("visits")
      .update({
        checked_out_at: now,
        provider_notes: data.provider_notes ?? null,
        checkout_summary_text: data.checkout_summary_text ?? null,
        checkout_voice_url: data.checkout_voice_url ?? null,
      })
      .eq("booking_id", data.id);
    if (vErr) throw vErr;
    const { error: bErr } = await context.supabase
      .from("bookings")
      .update({ status: "completed" })
      .eq("id", data.id)
      .eq("provider_id", context.userId);
    if (bErr) throw bErr;

    // Award consistency bonus for repeat visits with same senior.
    await awardConsistencyBonusIfDue(data.id, context.userId);
    return { ok: true };
  });

/** Provider or senior/family sets a short shift-plan checklist for a booking's visit. */
export const setVisitPlan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        booking_id: z.string().uuid(),
        items: z
          .array(
            z.object({
              label: z.string().min(1).max(200),
              done: z.boolean().optional(),
            }),
          )
          .max(10),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const items = data.items.map((i) => ({ label: i.label, done: !!i.done }));
    const { data: existing } = await context.supabase
      .from("visits")
      .select("id")
      .eq("booking_id", data.booking_id)
      .maybeSingle();
    if (existing) {
      const { error } = await context.supabase
        .from("visits")
        .update({ plan_items: items })
        .eq("booking_id", data.booking_id);
      if (error) throw error;
    } else {
      const { error } = await context.supabase
        .from("visits")
        .insert({ booking_id: data.booking_id, plan_items: items });
      if (error) throw error;
    }
    return { ok: true };
  });

/**
 * Senior (or family) rates a completed visit — legacy 3-tier + numeric 1-5.
 */
export const rateVisit = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        booking_id: z.string().uuid(),
        rating: z.enum(["great", "okay", "bad"]).optional().nullable(),
        rating_num: z.number().int().min(1).max(5).optional().nullable(),
        comment: z.string().max(2000).optional().nullable(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    // Map 3-tier → numeric when only tier provided.
    const num =
      data.rating_num ??
      (data.rating === "great" ? 5 : data.rating === "okay" ? 3 : data.rating === "bad" ? 1 : null);
    const patch = {
      senior_rating: data.rating ?? null,
      senior_rating_num: num,
      senior_comment: data.comment ?? null,
      rated_at: new Date().toISOString(),
    };
    const { data: existing } = await context.supabase
      .from("visits")
      .select("id")
      .eq("booking_id", data.booking_id)
      .maybeSingle();
    if (existing) {
      const { error } = await context.supabase
        .from("visits")
        .update(patch)
        .eq("booking_id", data.booking_id);
      if (error) throw error;
    } else {
      const { error } = await context.supabase
        .from("visits")
        .insert({ booking_id: data.booking_id, ...patch });
      if (error) throw error;
    }
    return { ok: true };
  });

/** Provider rates the senior/visit (kept on the booking row). */
export const rateVisitByProvider = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        booking_id: z.string().uuid(),
        rating: z.number().int().min(1).max(5),
        comment: z.string().max(2000).optional().nullable(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("bookings")
      .update({ provider_rating: data.rating, provider_comment: data.comment ?? null })
      .eq("id", data.booking_id)
      .eq("provider_id", context.userId);
    if (error) throw error;
    return { ok: true };
  });

/**
 * On check-out, count completed visits between this provider and senior.
 * At the 4th completed visit → $25 credit; at the 12th → $75. Idempotent via visit_bonuses unique key.
 */
async function awardConsistencyBonusIfDue(bookingId: string, providerId: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: booking } = await supabaseAdmin
    .from("bookings")
    .select("senior_id, provider_id")
    .eq("id", bookingId)
    .maybeSingle();
  if (!booking || booking.provider_id !== providerId) return;

  const { count } = await supabaseAdmin
    .from("bookings")
    .select("id", { count: "exact", head: true })
    .eq("provider_id", providerId)
    .eq("senior_id", booking.senior_id)
    .eq("status", "completed");
  const completed = count ?? 0;

  const milestones: { n: number; cents: number; memo: string }[] = [
    { n: 4, cents: 2500, memo: "Consistency bonus — 4th visit with the same senior" },
    { n: 12, cents: 7500, memo: "Consistency bonus — 12th visit with the same senior" },
  ];
  for (const m of milestones) {
    if (completed < m.n) continue;
    // Skip if already awarded
    const { data: exists } = await supabaseAdmin
      .from("visit_bonuses")
      .select("id")
      .eq("provider_id", providerId)
      .eq("senior_id", booking.senior_id)
      .eq("milestone", m.n)
      .maybeSingle();
    if (exists) continue;

    const { data: ledger, error: lErr } = await supabaseAdmin
      .from("payment_ledger")
      .insert({
        provider_id: providerId,
        senior_id: booking.senior_id,
        booking_id: bookingId,
        entry_type: "adjustment",
        amount_cents: m.cents,
        currency: "USD",
        status: "pending",
        memo: m.memo,
      })
      .select("id")
      .single();
    if (lErr) continue;
    await supabaseAdmin.from("visit_bonuses").insert({
      provider_id: providerId,
      senior_id: booking.senior_id,
      milestone: m.n,
      ledger_id: ledger.id,
      amount_cents: m.cents,
    });
    await supabaseAdmin.from("notifications").insert({
      user_id: providerId,
      kind: "payout_posted",
      title: `You earned a $${(m.cents / 100).toFixed(0)} bonus!`,
      body: m.memo + ".",
      link: "/provider/earnings",
    });
  }
}

export type VisitPlanItem = { label: string; done: boolean };

export type VisitDetail = VisitRow & {
  senior_id: string;
  visit_id: string | null;
  checked_in_at: string | null;
  checked_out_at: string | null;
  provider_notes: string | null;
  senior_rating: string | null;
  senior_rating_num: number | null;
  senior_comment: string | null;
  provider_rating: number | null;
  provider_comment: string | null;
  plan_items: VisitPlanItem[];
  checkin_lat: number | null;
  checkin_lng: number | null;
  checkout_summary_text: string | null;
  checkout_voice_url: string | null;
};

/**
 * Detailed view for a single booking + its visit row (if any).
 * Works for either the senior or the provider — RLS enforces access.
 */
export const getVisitDetail = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => IdInput.parse(input))
  .handler(async ({ data, context }): Promise<VisitDetail | null> => {
    const { data: row, error } = await context.supabase
      .from("bookings")
      .select(
        "id, service_type, scheduled_at, duration_minutes, hourly_rate_cents, status, notes, provider_id, senior_id, payment_status, paid_at, provider_rating, provider_comment, provider:providers!inner(id, profile:profiles!inner(full_name, avatar_url)), visit:visits(id, checked_in_at, checked_out_at, provider_notes, senior_rating, senior_rating_num, senior_comment, plan_items, checkin_lat, checkin_lng, checkout_summary_text, checkout_voice_url)",
      )
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw error;
    if (!row) return null;
    const providerRel = row.provider as {
      profile: { full_name: string | null; avatar_url: string | null } | null;
    } | null;
    const profileRel = providerRel?.profile ?? null;
    const visitArr = (row.visit as any[] | null) ?? [];
    const v = visitArr[0] ?? null;
    const planRaw = (v?.plan_items ?? []) as unknown;
    const plan_items: VisitPlanItem[] = Array.isArray(planRaw)
      ? planRaw
          .map((p: any) => ({ label: String(p?.label ?? ""), done: !!p?.done }))
          .filter((p) => p.label)
      : [];
    return {
      id: row.id,
      service_type: row.service_type,
      scheduled_at: row.scheduled_at,
      duration_minutes: row.duration_minutes,
      hourly_rate_cents: row.hourly_rate_cents,
      status: row.status,
      notes: row.notes,
      provider_id: row.provider_id,
      senior_id: row.senior_id,
      provider_name: profileRel?.full_name ?? null,
      provider_avatar_url: profileRel?.avatar_url ?? null,
      payment_status: row.payment_status,
      paid_at: row.paid_at,
      visit_id: v?.id ?? null,
      checked_in_at: v?.checked_in_at ?? null,
      checked_out_at: v?.checked_out_at ?? null,
      provider_notes: v?.provider_notes ?? null,
      senior_rating: v?.senior_rating ?? null,
      senior_rating_num: v?.senior_rating_num ?? null,
      senior_comment: v?.senior_comment ?? null,
      provider_rating: (row as any).provider_rating ?? null,
      provider_comment: (row as any).provider_comment ?? null,
      plan_items,
      checkin_lat: v?.checkin_lat ?? null,
      checkin_lng: v?.checkin_lng ?? null,
      checkout_summary_text: v?.checkout_summary_text ?? null,
      checkout_voice_url: v?.checkout_voice_url ?? null,
    };
  });

/** Number of `requested` bookings waiting on the current provider. */
export const getPendingJobCount = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<number> => {
    const { count, error } = await context.supabase
      .from("bookings")
      .select("id", { count: "exact", head: true })
      .eq("provider_id", context.userId)
      .eq("status", "requested");
    if (error) throw error;
    return count ?? 0;
  });

/**
 * Count of "actionable" items for the current senior/family:
 * visits that are confirmed and upcoming within the next 24h and not yet checked in.
 * Cheap heuristic — no separate notifications table needed.
 */
export const getUpcomingVisitCount = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<number> => {
    const soon = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    const now = new Date().toISOString();
    const { count, error } = await context.supabase
      .from("bookings")
      .select("id", { count: "exact", head: true })
      .eq("senior_id", context.userId)
      .eq("status", "confirmed")
      .gte("scheduled_at", now)
      .lte("scheduled_at", soon);
    if (error) throw error;
    return count ?? 0;
  });
