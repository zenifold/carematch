import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";

type EntryType = Database["public"]["Enums"]["ledger_entry_type"];
type LedgerStatus = Database["public"]["Enums"]["ledger_status"];

const FINANCE = ["admin", "finance", "staff"] as const;

async function isFinance(context: { supabase: any; userId: string }) {
  const { data } = await context.supabase.rpc("has_any_role", { _user_id: context.userId, _roles: FINANCE });
  return !!data;
}

async function writeAudit(context: any, entry: any) {
  await context.supabase.from("admin_audit_log").insert({
    actor_id: context.userId,
    target_user_id: entry.target_user_id ?? null,
    action: entry.action,
    entity: entry.entity ?? null,
    entity_id: entry.entity_id ?? null,
    payload: entry.payload ?? {},
  });
}

export type LedgerRow = {
  id: string;
  booking_id: string | null;
  visit_id: string | null;
  senior_id: string | null;
  provider_id: string | null;
  senior_name: string | null;
  provider_name: string | null;
  entry_type: EntryType;
  amount_cents: number;
  currency: string;
  status: LedgerStatus;
  memo: string | null;
  posted_at: string | null;
  created_at: string;
};

const ListInput = z.object({
  entry_type: z.enum(["charge", "platform_fee", "provider_payout", "refund", "adjustment"]).optional().nullable(),
  status: z.enum(["pending", "posted", "reversed"]).optional().nullable(),
  limit: z.number().int().min(1).max(500).optional().default(200),
});

export const listLedger = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => ListInput.parse(i ?? {}))
  .handler(async ({ data, context }): Promise<LedgerRow[]> => {
    if (!(await isFinance(context))) throw new Error("Forbidden");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    let q = supabaseAdmin
      .from("payment_ledger")
      .select("id, booking_id, visit_id, senior_id, provider_id, entry_type, amount_cents, currency, status, memo, posted_at, created_at")
      .order("created_at", { ascending: false })
      .limit(data.limit);
    if (data.entry_type) q = q.eq("entry_type", data.entry_type);
    if (data.status) q = q.eq("status", data.status);
    const { data: rows, error } = await q;
    if (error) throw error;
    const ids = new Set<string>();
    for (const r of rows ?? []) {
      if (r.senior_id) ids.add(r.senior_id);
      if (r.provider_id) ids.add(r.provider_id);
    }
    const { data: profs } = await supabaseAdmin.from("profiles").select("id, full_name").in("id", Array.from(ids));
    const nameMap = new Map((profs ?? []).map((p: any) => [p.id, p.full_name as string | null]));
    return (rows ?? []).map((r: any) => ({
      ...r,
      senior_name: r.senior_id ? nameMap.get(r.senior_id) ?? null : null,
      provider_name: r.provider_id ? nameMap.get(r.provider_id) ?? null : null,
    }));
  });

const IdInput = z.object({ id: z.string().uuid() });

export const markPayoutPaid = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => IdInput.parse(i))
  .handler(async ({ data, context }) => {
    if (!(await isFinance(context))) throw new Error("Forbidden");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row, error: rErr } = await supabaseAdmin
      .from("payment_ledger")
      .select("entry_type, status")
      .eq("id", data.id)
      .single();
    if (rErr) throw rErr;
    if (row.entry_type !== "provider_payout") throw new Error("Only provider payouts can be marked paid.");
    const { error } = await supabaseAdmin
      .from("payment_ledger")
      .update({ status: "posted", posted_at: new Date().toISOString() })
      .eq("id", data.id);
    if (error) throw error;
    await writeAudit(context, { action: "finance.payout.paid", entity: "payment_ledger", entity_id: data.id });
    return { ok: true };
  });

const RefundInput = z.object({
  charge_id: z.string().uuid(),
  amount_cents: z.number().int().positive(),
  memo: z.string().trim().max(500).optional(),
});

export const createRefund = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => RefundInput.parse(i))
  .handler(async ({ data, context }) => {
    if (!(await isFinance(context))) throw new Error("Forbidden");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: charge, error: cErr } = await supabaseAdmin
      .from("payment_ledger")
      .select("booking_id, visit_id, senior_id, provider_id, entry_type, amount_cents, currency")
      .eq("id", data.charge_id)
      .single();
    if (cErr) throw cErr;
    if (charge.entry_type !== "charge") throw new Error("Refund must target a charge entry.");
    if (data.amount_cents > charge.amount_cents) throw new Error("Refund exceeds charge amount.");

    const { data: refund, error } = await supabaseAdmin
      .from("payment_ledger")
      .insert({
        booking_id: charge.booking_id,
        visit_id: charge.visit_id,
        senior_id: charge.senior_id,
        provider_id: charge.provider_id,
        entry_type: "refund",
        amount_cents: -data.amount_cents,
        currency: charge.currency,
        status: "posted",
        memo: data.memo ?? `Refund of ${data.charge_id}`,
        posted_at: new Date().toISOString(),
      })
      .select("id")
      .single();
    if (error) throw error;
    await writeAudit(context, {
      action: "finance.refund.create",
      target_user_id: charge.senior_id,
      entity: "payment_ledger",
      entity_id: refund.id,
      payload: { charge_id: data.charge_id, amount_cents: data.amount_cents },
    });
    return { ok: true, id: refund.id as string };
  });
