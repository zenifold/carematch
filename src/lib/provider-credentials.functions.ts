import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";

type CredentialKind = Database["public"]["Enums"]["credential_kind"];
type VerificationStatus = Database["public"]["Enums"]["verification_status"];

const CREDENTIAL_KINDS = [
  "background_check", "id_verification", "tb_test", "cpr", "first_aid",
  "pca", "hha", "cna", "med_tech", "phlebotomy", "lpn", "rn",
  "driver_license", "auto_insurance",
] as const;

// ============ Reads ============

export type ProviderCredential = {
  id: string;
  kind: CredentialKind;
  status: VerificationStatus;
  issued_on: string | null;
  expires_on: string | null;
  issuing_state: string | null;
  document_path: string | null;
  verified_at: string | null;
  notes: string | null;
};

export type ProviderCapability = {
  code: string;
  label: string;
  category: string;
  required_tier: number;
  required_credential: CredentialKind | null;
  description: string | null;
  opted_in: boolean;
  unlocked: boolean;
};

export type ProviderProfileFull = {
  provider: {
    id: string;
    headline: string | null;
    bio: string | null;
    hourly_rate_cents: number;
    years_experience: number | null;
    service_area: string | null;
    languages: string[];
    specialties: string[];
    tier: string;
    service_tier: number;
    onboarding_step: number;
    is_active: boolean;
  };
  profile: {
    full_name: string | null;
    phone: string | null;
    city: string | null;
    avatar_url: string | null;
  };
  credentials: ProviderCredential[];
  capabilities: ProviderCapability[];
};

export const getMyProviderProfile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<ProviderProfileFull> => {
    const uid = context.userId;
    // Ensure provider row exists
    await context.supabase.from("providers").upsert({ id: uid }, { onConflict: "id" });

    const [{ data: provider }, { data: profile }, { data: creds }, { data: caps }, { data: opted }] = await Promise.all([
      context.supabase.from("providers").select("*").eq("id", uid).maybeSingle(),
      context.supabase.from("profiles").select("full_name, phone, city, avatar_url").eq("id", uid).maybeSingle(),
      context.supabase.from("provider_credentials")
        .select("id, kind, status, issued_on, expires_on, issuing_state, document_path, verified_at, notes")
        .eq("provider_id", uid)
        .order("kind"),
      context.supabase.from("service_capabilities")
        .select("code, label, category, required_tier, required_credential, description")
        .eq("active", true)
        .order("sort_order"),
      context.supabase.from("provider_capabilities")
        .select("capability_code, opted_in")
        .eq("provider_id", uid),
    ]);

    const tier = provider?.service_tier ?? 0;
    const optedSet = new Map((opted ?? []).map((r: any) => [r.capability_code, r.opted_in as boolean]));

    return {
      provider: {
        id: uid,
        headline: provider?.headline ?? null,
        bio: provider?.bio ?? null,
        hourly_rate_cents: provider?.hourly_rate_cents ?? 2800,
        years_experience: provider?.years_experience ?? null,
        service_area: provider?.service_area ?? null,
        languages: provider?.languages ?? [],
        specialties: provider?.specialties ?? [],
        tier: (provider?.tier ?? "bronze") as string,
        service_tier: tier,
        onboarding_step: provider?.onboarding_step ?? 0,
        is_active: provider?.is_active ?? false,
      },
      profile: {
        full_name: profile?.full_name ?? null,
        phone: profile?.phone ?? null,
        city: profile?.city ?? null,
        avatar_url: profile?.avatar_url ?? null,
      },
      credentials: (creds ?? []) as ProviderCredential[],
      capabilities: (caps ?? []).map((c: any) => ({
        code: c.code,
        label: c.label,
        category: c.category,
        required_tier: c.required_tier,
        required_credential: c.required_credential,
        description: c.description,
        opted_in: optedSet.get(c.code) ?? false,
        unlocked: c.required_tier <= tier,
      })),
    };
  });

// ============ Writes ============

const BasicsInput = z.object({
  full_name: z.string().trim().max(120).optional().nullable(),
  phone: z.string().trim().max(40).optional().nullable(),
  city: z.string().trim().max(120).optional().nullable(),
  service_area: z.string().trim().max(200).optional().nullable(),
  languages: z.array(z.string().max(40)).max(20).optional(),
  motivation: z.enum(["extra_cash", "between_jobs", "love_seniors", "toward_cna", "other"]).optional().nullable(),
});

export const saveProviderBasics = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => BasicsInput.parse(i))
  .handler(async ({ data, context }) => {
    const uid = context.userId;
    const profilePatch: Record<string, unknown> = {};
    if (data.full_name !== undefined) profilePatch.full_name = data.full_name;
    if (data.phone !== undefined) profilePatch.phone = data.phone;
    if (data.city !== undefined) profilePatch.city = data.city;
    if (Object.keys(profilePatch).length) {
      const { error } = await context.supabase.from("profiles").update(profilePatch as any).eq("id", uid);
      if (error) throw error;
    }
    const provPatch: Record<string, unknown> = { last_onboarding_activity_at: new Date().toISOString() };
    if (data.service_area !== undefined) provPatch.service_area = data.service_area;
    if (data.languages !== undefined) provPatch.languages = data.languages;
    if (data.motivation !== undefined) provPatch.motivation = data.motivation;
    const { error } = await context.supabase.from("providers").update(provPatch as any).eq("id", uid);
    if (error) throw error;
    return { ok: true };
  });

// Log any onboarding event and touch activity timestamp; used for drop-off analytics + drip pausing.
const OnboardingEventInput = z.object({
  event_type: z.string().min(1).max(80),
  step: z.string().max(40).optional().nullable(),
  metadata: z.record(z.unknown()).optional().nullable(),
});

export const logProviderOnboardingEvent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => OnboardingEventInput.parse(i))
  .handler(async ({ data, context }) => {
    const uid = context.userId;
    await context.supabase.from("provider_onboarding_events").insert({
      provider_id: uid,
      event_type: data.event_type,
      step: data.step ?? null,
      metadata: (data.metadata ?? {}) as any,
    });
    // Pause any active re-engagement drip when the provider comes back and does something.
    await context.supabase
      .from("providers")
      .update({
        last_onboarding_activity_at: new Date().toISOString(),
        reengagement_paused_at: new Date().toISOString(),
      } as any)
      .eq("id", uid);
    return { ok: true };
  });

// Acknowledge the "this is serious" tone-shift interstitial before Trust & Safety.
export const acknowledgeSeriousTone = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const now = new Date().toISOString();
    const { error } = await context.supabase
      .from("providers")
      .update({ acknowledged_serious_at: now, last_onboarding_activity_at: now } as any)
      .eq("id", context.userId);
    if (error) throw error;
    await context.supabase.from("provider_onboarding_events").insert({
      provider_id: context.userId,
      event_type: "serious_ack",
      step: "tone_shift",
    });
    return { ok: true };
  });

const ListingInput = z.object({
  headline: z.string().trim().min(3).max(200),
  bio: z.string().trim().max(4000).optional().nullable(),
  hourly_rate_cents: z.number().int().min(0).max(50000),
  years_experience: z.number().int().min(0).max(80).optional(),
  specialties: z.array(z.string().max(60)).max(30).optional(),
});

export const saveProviderListing = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => ListingInput.parse(i))
  .handler(async ({ data, context }) => {
    const patch: Record<string, unknown> = {
      headline: data.headline,
      bio: data.bio ?? null,
      hourly_rate_cents: data.hourly_rate_cents,
    };
    if (data.years_experience !== undefined) patch.years_experience = data.years_experience;
    if (data.specialties !== undefined) patch.specialties = data.specialties;
    const { error } = await context.supabase.from("providers").update(patch as any).eq("id", context.userId);
    if (error) throw error;
    return { ok: true };
  });

const CapabilitiesInput = z.object({
  codes: z.array(z.string().max(60)).max(100),
});

export const saveProviderCapabilities = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => CapabilitiesInput.parse(i))
  .handler(async ({ data, context }) => {
    const uid = context.userId;

    // Load provider tier and capability tiers, reject any that exceed tier.
    const [{ data: prov }, { data: caps }] = await Promise.all([
      context.supabase.from("providers").select("service_tier").eq("id", uid).maybeSingle(),
      context.supabase.from("service_capabilities").select("code, required_tier").in("code", data.codes.length ? data.codes : ["__none__"]),
    ]);
    const tier = prov?.service_tier ?? 0;
    const allowed = (caps ?? []).filter((c: any) => c.required_tier <= tier).map((c: any) => c.code as string);

    // Wipe then insert only allowed codes (idempotent).
    const { error: delErr } = await context.supabase
      .from("provider_capabilities")
      .delete()
      .eq("provider_id", uid);
    if (delErr) throw delErr;
    if (allowed.length) {
      const rows = allowed.map((code) => ({ provider_id: uid, capability_code: code, opted_in: true }));
      const { error } = await context.supabase.from("provider_capabilities").insert(rows);
      if (error) throw error;
    }
    return { ok: true, saved: allowed.length, rejected: data.codes.length - allowed.length };
  });

const OnboardingStepInput = z.object({ step: z.number().int().min(0).max(6) });

export const setOnboardingStep = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => OnboardingStepInput.parse(i))
  .handler(async ({ data, context }) => {
    const now = new Date().toISOString();
    const patch: Record<string, unknown> = {
      onboarding_step: data.step,
      last_onboarding_activity_at: now,
      reengagement_paused_at: now,
    };
    if (data.step >= 5) {
      // Trust & Safety complete → mark active, stamp onboarded_at.
      patch.is_active = true;
      await context.supabase
        .from("profiles")
        .update({ onboarded_at: now })
        .eq("id", context.userId);
    }
    const { error } = await context.supabase.from("providers").update(patch as any).eq("id", context.userId);
    if (error) throw error;
    await context.supabase.from("provider_onboarding_events").insert({
      provider_id: context.userId,
      event_type: "step_reached",
      step: String(data.step),
    });
    return { ok: true };
  });

const SubmitCredentialInput = z.object({
  kind: z.enum(CREDENTIAL_KINDS),
  issued_on: z.string().optional().nullable(),
  expires_on: z.string().optional().nullable(),
  issuing_state: z.string().max(60).optional().nullable(),
  document_path: z.string().max(500).optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
});

export const submitCredential = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => SubmitCredentialInput.parse(i))
  .handler(async ({ data, context }) => {
    const uid = context.userId;
    const { data: existing } = await context.supabase
      .from("provider_credentials")
      .select("id, status")
      .eq("provider_id", uid)
      .eq("kind", data.kind)
      .maybeSingle();

    const editable = {
      issued_on: data.issued_on ?? null,
      expires_on: data.expires_on ?? null,
      issuing_state: data.issuing_state ?? null,
      document_path: data.document_path ?? null,
      notes: data.notes ?? null,
    };

    if (existing) {
      // Update non-verification fields only — RLS trigger blocks status changes.
      const { error } = await context.supabase
        .from("provider_credentials")
        .update(editable)
        .eq("id", existing.id);
      if (error) throw error;
    } else {
      const { error } = await context.supabase
        .from("provider_credentials")
        .insert({ provider_id: uid, kind: data.kind, status: "pending", ...editable });
      if (error) throw error;
    }
    return { ok: true };
  });

// ============ Training programs & referrals ============

export type TrainingProgram = {
  id: string;
  name: string;
  provider_org: string;
  credential_kind: CredentialKind;
  state: string | null;
  city: string | null;
  format: string | null;
  cost_cents: number | null;
  duration_weeks: number | null;
  url: string;
  our_referral_id: string;
  description: string | null;
};

const ProgramsFilter = z.object({
  state: z.string().max(4).optional().nullable(),
  credential_kind: z.enum(CREDENTIAL_KINDS).optional().nullable(),
}).optional();

export const listTrainingPrograms = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => ProgramsFilter.parse(i ?? {}))
  .handler(async ({ data, context }): Promise<TrainingProgram[]> => {
    let q = context.supabase
      .from("training_programs")
      .select("id, name, provider_org, credential_kind, state, city, format, cost_cents, duration_weeks, url, our_referral_id, description")
      .eq("active", true)
      .order("bounty_cents", { ascending: false });
    if (data?.state) q = q.or(`state.is.null,state.eq.${data.state}`);
    if (data?.credential_kind) q = q.eq("credential_kind", data.credential_kind);
    const { data: rows, error } = await q;
    if (error) throw error;
    return rows ?? [];
  });

const StartReferralInput = z.object({ program_id: z.string().uuid() });

export const startTrainingReferral = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => StartReferralInput.parse(i))
  .handler(async ({ data, context }): Promise<{ referral_id: string; url: string }> => {
    const { data: prog, error: pErr } = await context.supabase
      .from("training_programs")
      .select("url, our_referral_id, active")
      .eq("id", data.program_id)
      .maybeSingle();
    if (pErr) throw pErr;
    if (!prog || !prog.active) throw new Error("Program is not available.");

    const { data: ref, error } = await context.supabase
      .from("training_referrals")
      .insert({
        provider_id: context.userId,
        program_id: data.program_id,
        clicked_at: new Date().toISOString(),
      })
      .select("id")
      .single();
    if (error) throw error;

    const sep = prog.url.includes("?") ? "&" : "?";
    const url = `${prog.url}${sep}ref=carematch-${prog.our_referral_id}&sub=${ref.id}`;
    return { referral_id: ref.id, url };
  });

// ============ Market rate band (mock, tier-based) ============

export type RateBand = { tier: number; label: string; low: number; median: number; high: number };

export const getMarketRateBands = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async (): Promise<RateBand[]> => {
    // Placeholder data — replace with real regional data later.
    return [
      { tier: 0, label: "Companion & household", low: 20, median: 25, high: 32 },
      { tier: 1, label: "PCA / HHA",              low: 26, median: 32, high: 40 },
      { tier: 2, label: "CNA",                    low: 32, median: 40, high: 52 },
      { tier: 3, label: "Skilled / clinical",     low: 42, median: 55, high: 75 },
    ];
  });
