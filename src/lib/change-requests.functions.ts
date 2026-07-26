import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const CHANGE_REQUEST_KINDS = [
  "budget",
  "permission",
  "cancel_visit",
  "care_note",
] as const;
export type ChangeRequestKind = (typeof CHANGE_REQUEST_KINDS)[number];

export const CHANGE_REQUEST_STATUSES = [
  "pending",
  "approved",
  "declined",
  "expired",
  "cancelled",
] as const;
export type ChangeRequestStatus = (typeof CHANGE_REQUEST_STATUSES)[number];

export type ChangeRequestPayload = {
  monthly_budget_cents?: number;
  permission?: "view" | "modify" | "financial";
  note?: string;
};

export type ChangeRequestRow = {
  id: string;
  senior_id: string;
  requester_id: string;
  kind: ChangeRequestKind;
  payload: ChangeRequestPayload;
  reason: string;
  status: ChangeRequestStatus;
  decline_reason: string | null;
  target_id: string | null;
  expires_at: string;
  resolved_at: string | null;
  created_at: string;
  requester_name: string | null;
  senior_name: string | null;
};

// ---------- Validators ----------

const BudgetPayload = z.object({ monthly_budget_cents: z.number().int().min(0).max(1_000_000_00) });
const PermissionPayload = z.object({ permission: z.enum(["view", "modify", "financial"]) });
const CancelVisitPayload = z.object({});
const CareNotePayload = z.object({ note: z.string().trim().min(1).max(1000) });

const CreateSchema = z.discriminatedUnion("kind", [
  z.object({
    senior_id: z.string().uuid(),
    reason: z.string().trim().min(1).max(500),
    kind: z.literal("budget"),
    payload: BudgetPayload,
    target_id: z.string().uuid().nullable().optional(),
  }),
  z.object({
    senior_id: z.string().uuid(),
    reason: z.string().trim().min(1).max(500),
    kind: z.literal("permission"),
    payload: PermissionPayload,
    target_id: z.string().uuid().nullable().optional(),
  }),
  z.object({
    senior_id: z.string().uuid(),
    reason: z.string().trim().min(1).max(500),
    kind: z.literal("cancel_visit"),
    payload: CancelVisitPayload,
    target_id: z.string().uuid(),
  }),
  z.object({
    senior_id: z.string().uuid(),
    reason: z.string().trim().min(1).max(500),
    kind: z.literal("care_note"),
    payload: CareNotePayload,
    target_id: z.string().uuid().nullable().optional(),
  }),
]);

// ---------- Create ----------

export const createChangeRequest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => CreateSchema.parse(input))
  .handler(async ({ data, context }): Promise<{ id: string }> => {
    const { data: row, error } = await context.supabase
      .from("change_requests")
      .insert({
        senior_id: data.senior_id,
        requester_id: context.userId,
        kind: data.kind,
        payload: data.payload as ChangeRequestPayload,
        reason: data.reason,
        target_id: data.target_id ?? null,
      })
      .select("id")
      .single();
    if (error) throw error;
    return { id: row.id };
  });

// ---------- Helpers ----------

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function sweepExpired(supabase: any) {
  await supabase
    .from("change_requests")
    .update({ status: "expired", resolved_at: new Date().toISOString() })
    .eq("status", "pending")
    .lt("expires_at", new Date().toISOString());
}

// ---------- Read (senior side) ----------

export const listMyIncomingRequests = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<ChangeRequestRow[]> => {
    await sweepExpired(context.supabase);
    const { data, error } = await context.supabase
      .from("change_requests")
      .select(
        "id, senior_id, requester_id, kind, payload, reason, status, decline_reason, target_id, expires_at, resolved_at, created_at, requester:profiles!change_requests_requester_id_fkey(full_name)",
      )
      .eq("senior_id", context.userId)
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) throw error;
    return (data ?? []).map((r): ChangeRequestRow => {
      const requester = r.requester as { full_name: string | null } | null;
      return {
        id: r.id,
        senior_id: r.senior_id,
        requester_id: r.requester_id,
        kind: r.kind as ChangeRequestKind,
        payload: (r.payload ?? {}) as ChangeRequestPayload,
        reason: r.reason,
        status: r.status as ChangeRequestStatus,
        decline_reason: r.decline_reason,
        target_id: r.target_id,
        expires_at: r.expires_at,
        resolved_at: r.resolved_at,
        created_at: r.created_at,
        requester_name: requester?.full_name ?? null,
        senior_name: null,
      };
    });
  });

// ---------- Read (family side) ----------

const SeniorIdSchema = z.object({ senior_id: z.string().uuid() });

export const listMyOutgoingRequests = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => SeniorIdSchema.parse(input))
  .handler(async ({ data, context }): Promise<ChangeRequestRow[]> => {
    await sweepExpired(context.supabase);
    const { data: rows, error } = await context.supabase
      .from("change_requests")
      .select(
        "id, senior_id, requester_id, kind, payload, reason, status, decline_reason, target_id, expires_at, resolved_at, created_at, senior:profiles!change_requests_senior_id_fkey(full_name)",
      )
      .eq("requester_id", context.userId)
      .eq("senior_id", data.senior_id)
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) throw error;
    return (rows ?? []).map((r): ChangeRequestRow => {
      const senior = r.senior as { full_name: string | null } | null;
      return {
        id: r.id,
        senior_id: r.senior_id,
        requester_id: r.requester_id,
        kind: r.kind as ChangeRequestKind,
        payload: (r.payload ?? {}) as ChangeRequestPayload,
        reason: r.reason,
        status: r.status as ChangeRequestStatus,
        decline_reason: r.decline_reason,
        target_id: r.target_id,
        expires_at: r.expires_at,
        resolved_at: r.resolved_at,
        created_at: r.created_at,
        senior_name: senior?.full_name ?? null,
        requester_name: null,
      };
    });
  });

// ---------- Approve / Decline / Cancel ----------

const IdSchema = z.object({ id: z.string().uuid() });
const DeclineSchema = z.object({
  id: z.string().uuid(),
  reason: z.string().trim().max(500).optional(),
});

export const approveChangeRequest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => IdSchema.parse(input))
  .handler(async ({ data, context }): Promise<{ ok: true }> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.rpc("apply_change_request", {
      _request_id: data.id,
      _actor_id: context.userId,
    });
    if (error) throw error;
    return { ok: true };
  });

export const declineChangeRequest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => DeclineSchema.parse(input))
  .handler(async ({ data, context }): Promise<{ ok: true }> => {
    const { error } = await context.supabase
      .from("change_requests")
      .update({
        status: "declined",
        decline_reason: data.reason ?? null,
        resolved_at: new Date().toISOString(),
      })
      .eq("id", data.id)
      .eq("senior_id", context.userId)
      .eq("status", "pending");
    if (error) throw error;
    return { ok: true };
  });

export const cancelChangeRequest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => IdSchema.parse(input))
  .handler(async ({ data, context }): Promise<{ ok: true }> => {
    const { error } = await context.supabase
      .from("change_requests")
      .update({ status: "cancelled", resolved_at: new Date().toISOString() })
      .eq("id", data.id)
      .eq("requester_id", context.userId)
      .eq("status", "pending");
    if (error) throw error;
    return { ok: true };
  });
