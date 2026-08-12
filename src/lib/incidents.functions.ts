import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const TRUST_SAFETY_STAFF = ["admin", "trust_safety", "staff"] as const;

async function isTrustSafetyStaff(context: { supabase: any; userId: string }) {
  const { data, error } = await context.supabase.rpc("has_any_role", {
    _user_id: context.userId,
    _roles: TRUST_SAFETY_STAFF,
  });
  if (error) throw error;
  return !!data;
}

export type IncidentCategory =
  "no_show" | "safety" | "abuse" | "theft" | "quality" | "billing" | "other";
export type IncidentStatus = "open" | "triaged" | "resolved" | "dismissed";

export type IncidentRow = {
  id: string;
  reporter_id: string;
  reporter_name: string | null;
  booking_id: string | null;
  subject_user_id: string | null;
  subject_name: string | null;
  category: IncidentCategory;
  status: IncidentStatus;
  severity: number;
  summary: string;
  resolution_notes: string | null;
  created_at: string;
  resolved_at: string | null;
};

const CATEGORIES: IncidentCategory[] = [
  "no_show",
  "safety",
  "abuse",
  "theft",
  "quality",
  "billing",
  "other",
];

const ReportSchema = z.object({
  category: z.enum(CATEGORIES as [IncidentCategory, ...IncidentCategory[]]),
  summary: z.string().trim().min(4).max(4000),
  severity: z.number().int().min(1).max(4).optional(),
  booking_id: z.string().uuid().nullish(),
  subject_user_id: z.string().uuid().nullish(),
});

const UpdateSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(["open", "triaged", "resolved", "dismissed"]).optional(),
  severity: z.number().int().min(1).max(4).optional(),
  resolution_notes: z.string().max(4000).nullish(),
});

/** Any signed-in user can file an incident about themselves or a booking they're part of. */
export const reportIncident = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => ReportSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("incidents")
      .insert({
        reporter_id: context.userId,
        category: data.category,
        summary: data.summary,
        severity: data.severity ?? 2,
        booking_id: data.booking_id ?? null,
        subject_user_id: data.subject_user_id ?? null,
      })
      .select("id")
      .single();
    if (error) throw error;

    // Best-effort push to the support channel, same contract as the support-ticket
    // hook: an incident report must never fail because a chat integration is down.
    // Reports of harm are the last thing that should be silently dropped, so a
    // failed delivery is logged rather than swallowed. No-ops unless
    // SUPPORT_WEBHOOK_URL and SUPPORT_WEBHOOK_SECRET are both set.
    try {
      const { notifyNewIncident } = await import("./support-webhook.server");
      const result = await notifyNewIncident({
        id: row.id as string,
        category: data.category,
        severity: data.severity ?? 2,
        summary: data.summary,
        reporterId: context.userId,
        subjectUserId: data.subject_user_id ?? null,
        bookingId: data.booking_id ?? null,
        createdAt: new Date().toISOString(),
      });
      if (!result.delivered && result.reason !== "not_configured") {
        console.error(`[support-webhook] incident ${row.id} not delivered: ${result.reason}`);
      }
    } catch (err) {
      console.error("[support-webhook] unexpected error notifying incident", err);
    }

    return { id: row.id };
  });

/** Reports filed by the current user. */
export const listMyIncidents = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<IncidentRow[]> => {
    const { data, error } = await context.supabase
      .from("incidents")
      .select(
        "id, reporter_id, booking_id, subject_user_id, category, status, severity, summary, resolution_notes, resolved_at, created_at",
      )
      .eq("reporter_id", context.userId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []).map((r) => ({
      ...(r as Omit<IncidentRow, "reporter_name" | "subject_name">),
      reporter_name: null,
      subject_name: null,
    }));
  });

/** Admin queue: all incidents with reporter + subject names. */
export const listAllIncidents = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<IncidentRow[]> => {
    if (!(await isTrustSafetyStaff(context))) throw new Error("Forbidden");

    const { data, error } = await context.supabase
      .from("incidents")
      .select(
        "id, reporter_id, booking_id, subject_user_id, category, status, severity, summary, resolution_notes, resolved_at, created_at",
      )
      .order("created_at", { ascending: false });
    if (error) throw error;
    const rows = data ?? [];
    const ids = Array.from(
      new Set(
        rows.flatMap((r) => [r.reporter_id, r.subject_user_id].filter((v): v is string => !!v)),
      ),
    );
    let byId = new Map<string, string | null>();
    if (ids.length > 0) {
      const { data: profs } = await context.supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", ids);
      byId = new Map((profs ?? []).map((p) => [p.id, p.full_name]));
    }
    return rows.map((r) => ({
      id: r.id,
      reporter_id: r.reporter_id,
      reporter_name: byId.get(r.reporter_id) ?? null,
      booking_id: r.booking_id,
      subject_user_id: r.subject_user_id,
      subject_name: r.subject_user_id ? (byId.get(r.subject_user_id) ?? null) : null,
      category: r.category as IncidentCategory,
      status: r.status as IncidentStatus,
      severity: r.severity,
      summary: r.summary,
      resolution_notes: r.resolution_notes,
      resolved_at: r.resolved_at,
      created_at: r.created_at,
    }));
  });

/** Admin action: triage/resolve/dismiss an incident. */
export const updateIncident = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => UpdateSchema.parse(input))
  .handler(async ({ data, context }) => {
    if (!(await isTrustSafetyStaff(context))) throw new Error("Forbidden");

    const patch: {
      status?: IncidentStatus;
      severity?: number;
      resolution_notes?: string | null;
      resolved_at?: string | null;
      resolved_by?: string | null;
    } = {};
    if (data.status !== undefined) {
      patch.status = data.status;
      if (data.status === "resolved" || data.status === "dismissed") {
        patch.resolved_at = new Date().toISOString();
        patch.resolved_by = context.userId;
      } else {
        patch.resolved_at = null;
        patch.resolved_by = null;
      }
    }
    if (data.severity !== undefined) patch.severity = data.severity;
    if (data.resolution_notes !== undefined) patch.resolution_notes = data.resolution_notes ?? null;

    const { error } = await context.supabase.from("incidents").update(patch).eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });
