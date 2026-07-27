import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { tierEstimateCents, tierLabel } from "./background-check/packages.server";
import { getActiveVendor, type PackageTier } from "./background-check/vendor";

export type BgCheckRow = {
  id: string;
  provider_id: string;
  vendor: string;
  status: string;
  adjudication: string;
  package_tier: PackageTier;
  package_code: string;
  invitation_url: string | null;
  invitation_expires_at: string | null;
  ordered_at: string;
  completed_at: string | null;
  cost_cents: number | null;
  error_message: string | null;
  created_at: string;
};

// ============ Provider reads ============

export const getMyBackgroundCheck = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("provider_background_checks" as any)
      .select("*")
      .eq("provider_id", context.userId)
      .order("ordered_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw error;

    // Also compute readiness so UI can show/hide the "start" tile.
    const [{ data: id }, { data: docs }, { data: idv }] = await Promise.all([
      context.supabase
        .from("provider_identity")
        .select("identity_completed_at")
        .eq("provider_id", context.userId)
        .maybeSingle(),
      context.supabase
        .from("provider_documents")
        .select("kind, status")
        .eq("provider_id", context.userId)
        .in("status", ["uploaded", "accepted"]),
      context.supabase
        .from("provider_identity_verifications" as any)
        .select("status")
        .eq("provider_id", context.userId)
        .maybeSingle(),
    ]);
    const docKinds = new Set((docs ?? []).map((d: any) => d.kind));
    const idv_verified = (idv as any)?.status === "verified";
    const identity_ready =
      !!id?.identity_completed_at &&
      idv_verified &&
      docKinds.has("id_front") &&
      (docKinds.has("id_back") || docKinds.has("passport")) &&
      docKinds.has("selfie_liveness");

    // Get capability info for tier preview.
    const [{ data: provider }, { data: caps }] = await Promise.all([
      context.supabase
        .from("providers")
        .select("service_tier")
        .eq("id", context.userId)
        .maybeSingle(),
      context.supabase
        .from("provider_capabilities")
        .select("capability_code")
        .eq("provider_id", context.userId),
    ]);
    const { pickPackageTier } = await import("./background-check/packages.server");
    const tier = pickPackageTier({
      service_tier: (provider as any)?.service_tier ?? 0,
      capabilities: (caps ?? []).map((c: any) => c.capability_code),
    });

    const activeVendor = getActiveVendor();

    return {
      row: (data ?? null) as BgCheckRow | null,
      identity_ready,
      idv_verified,
      tier,
      tier_label: tierLabel(tier),
      estimated_cost_cents: activeVendor === "manual" ? 0 : tierEstimateCents(tier),
      active_vendor: activeVendor,
    };
  });

// ============ Start a check ============

const StartInput = z.object({
  ssn: z.string().regex(/^\d{3}-?\d{2}-?\d{4}$/, "SSN must be 9 digits"),
});

export const startBackgroundCheck = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => StartInput.parse(i))
  .handler(async ({ data, context }) => {
    const uid = context.userId;

    // Load identity + capabilities under RLS.
    const [{ data: id }, { data: provider }, { data: caps }, { data: existing }, { data: idv }] =
      await Promise.all([
        context.supabase.from("provider_identity").select("*").eq("provider_id", uid).maybeSingle(),
        context.supabase.from("providers").select("service_tier").eq("id", uid).maybeSingle(),
        context.supabase
          .from("provider_capabilities")
          .select("capability_code")
          .eq("provider_id", uid),
        context.supabase
          .from("provider_background_checks" as any)
          .select("id, status")
          .eq("provider_id", uid)
          .in("status", ["created", "invitation_sent", "pending_candidate_info", "pending_vendor"])
          .maybeSingle(),
        context.supabase
          .from("provider_identity_verifications" as any)
          .select("status")
          .eq("provider_id", uid)
          .maybeSingle(),
      ]);

    if ((idv as any)?.status !== "verified") {
      throw new Error("Complete digital identity verification before starting a background check.");
    }
    if (!id?.identity_completed_at) {
      throw new Error("Complete identity verification before starting a background check.");
    }
    if (existing) {
      throw new Error("A background check is already in progress.");
    }
    if (
      !id.legal_first_name ||
      !id.legal_last_name ||
      !id.date_of_birth ||
      !id.current_address ||
      !id.phone ||
      !id.email
    ) {
      throw new Error("Missing identity fields — please review your identity submission.");
    }

    const { pickPackageTier } = await import("./background-check/packages.server");

    const tier = pickPackageTier({
      service_tier: (provider as any)?.service_tier ?? 0,
      capabilities: (caps ?? []).map((c: any) => c.capability_code),
    });
    const vendorId = getActiveVendor();

    if (vendorId === "manual") {
      // No vendor configured — queue for manual admin review instead of
      // calling out to a vendor API that doesn't exist yet.
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { data: row, error: insErr } = await supabaseAdmin
        .from("provider_background_checks" as any)
        .insert({
          provider_id: uid,
          vendor: "manual",
          package_code: `manual-${tier}`,
          package_tier: tier,
          status: "pending_vendor",
        })
        .select("id")
        .single();
      if (insErr) throw insErr;
      return { id: (row as any).id as string, invitation_url: "" };
    }

    const { getAdapter } = await import("./background-check/adapters/index.server");
    const adapter = getAdapter(vendorId);
    const packageCode = adapter.packageCodeFor(tier);
    const addr = id.current_address as any;

    const ssnDigits = data.ssn.replace(/-/g, "");

    let candidateId: string;
    let orderResult: Awaited<ReturnType<typeof adapter.orderCheck>>;
    try {
      const created = await adapter.createCandidate({
        providerId: uid,
        first_name: id.legal_first_name,
        middle_name: id.legal_middle_name,
        last_name: id.legal_last_name,
        date_of_birth: id.date_of_birth,
        ssn: ssnDigits,
        email: id.email,
        phone: id.phone,
        address: {
          line1: addr.line1,
          line2: addr.line2 ?? null,
          city: addr.city,
          state: addr.state,
          postal: addr.postal,
          country: addr.country ?? "US",
        },
        drivers_license:
          id.drivers_license_number && id.drivers_license_state
            ? { number: id.drivers_license_number, state: id.drivers_license_state }
            : null,
      });
      candidateId = created.candidateId;
      orderResult = await adapter.orderCheck({
        candidateId,
        tier,
        packageCode,
      });
    } catch (err: any) {
      // Log an error row so admin can see the attempt failed.
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      await supabaseAdmin.from("provider_background_checks" as any).insert({
        provider_id: uid,
        vendor: vendorId,
        package_code: packageCode,
        package_tier: tier,
        status: "error",
        error_message: String(err?.message ?? err).slice(0, 500),
      });
      throw new Error(`Could not start background check: ${err?.message ?? "unknown error"}`);
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row, error: insErr } = await supabaseAdmin
      .from("provider_background_checks" as any)
      .insert({
        provider_id: uid,
        vendor: vendorId,
        vendor_candidate_id: candidateId,
        vendor_report_id: orderResult.reportId ?? null,
        package_code: packageCode,
        package_tier: tier,
        status: "invitation_sent",
        invitation_url: orderResult.invitationUrl,
        invitation_expires_at: orderResult.expiresAt,
      })
      .select("id, invitation_url")
      .single();
    if (insErr) throw insErr;

    return { id: (row as any).id as string, invitation_url: (row as any).invitation_url as string };
  });

// ============ Admin ============

async function requireStaff(context: any) {
  const { data } = await context.supabase.rpc("has_any_role", {
    _user_id: context.userId,
    _roles: ["admin", "staff", "support", "success"],
  });
  if (!data) throw new Error("Forbidden");
}

const ListFilters = z
  .object({
    status: z.string().optional(),
    vendor: z.string().optional(),
  })
  .partial();

export const adminListBackgroundChecks = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => ListFilters.parse(i ?? {}))
  .handler(async ({ data, context }) => {
    await requireStaff(context);
    let q = context.supabase
      .from("provider_background_checks" as any)
      .select(
        "id, provider_id, vendor, status, adjudication, package_tier, package_code, invitation_url, ordered_at, completed_at, cost_cents, error_message, created_at",
      )
      .order("created_at", { ascending: false })
      .limit(200);
    if (data.status) q = q.eq("status", data.status);
    if (data.vendor) q = q.eq("vendor", data.vendor);
    const { data: rows, error } = await q;
    if (error) throw error;
    return (rows ?? []) as unknown as BgCheckRow[];
  });

const AdjudicateInput = z.object({
  id: z.string().uuid(),
  decision: z.enum(["cleared", "engaged", "pre_adverse_action", "adverse_action", "pending"]),
  note: z.string().max(1000).optional().nullable(),
});

export const adminAdjudicate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => AdjudicateInput.parse(i))
  .handler(async ({ data, context }) => {
    await requireStaff(context);
    // "cleared" must also promote status to "clear" — the credential
    // writeback trigger only fires on the (status='clear', adjudication=
    // 'cleared') combination, so without this a "Clear" click silently
    // never unlocked the provider.
    const patch: Record<string, unknown> = {
      adjudication: data.decision,
      error_message: data.note ?? null,
    };
    if (data.decision === "cleared") {
      patch.status = "clear";
      patch.completed_at = new Date().toISOString();
    }
    const { error } = await context.supabase
      .from("provider_background_checks" as any)
      .update(patch)
      .eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

const CancelInput = z.object({ id: z.string().uuid(), reason: z.string().max(500).optional() });

export const cancelBackgroundCheck = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => CancelInput.parse(i))
  .handler(async ({ data, context }) => {
    await requireStaff(context);
    const { error } = await context.supabase
      .from("provider_background_checks" as any)
      .update({ status: "canceled", error_message: data.reason ?? null })
      .eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

export const listMyBackgroundCheckEvents = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    // Provider can't read events (RLS), so proxy through: fetch their latest
    // check id, then read events via admin client only when the caller owns
    // the check. Safer than a broad grant.
    const { data: check } = await context.supabase
      .from("provider_background_checks" as any)
      .select("id")
      .eq("provider_id", context.userId)
      .order("ordered_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!check) return [] as Array<{ event_type: string; received_at: string }>;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: events } = await supabaseAdmin
      .from("background_check_events" as any)
      .select("event_type, received_at")
      .eq("background_check_id", (check as any).id)
      .order("received_at", { ascending: false })
      .limit(50);
    return (events ?? []) as unknown as Array<{ event_type: string; received_at: string }>;
  });
