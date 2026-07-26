import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type VisitExtraKind = "errand_stop" | "extra_time" | "reimbursement" | "other";
export type VisitExtraStatus = "pending" | "approved" | "declined" | "auto_approved";

export type VisitExtra = {
  id: string;
  booking_id: string;
  visit_id: string | null;
  kind: VisitExtraKind;
  amount_cents: number;
  note: string | null;
  status: VisitExtraStatus;
  created_by: string;
  created_at: string;
};

const BookingIdInput = z.object({ booking_id: z.string().uuid() });

export const listVisitExtras = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => BookingIdInput.parse(input))
  .handler(async ({ data, context }): Promise<VisitExtra[]> => {
    const { data: rows, error } = await context.supabase
      .from("visit_extras")
      .select("id, booking_id, visit_id, kind, amount_cents, note, status, created_by, created_at")
      .eq("booking_id", data.booking_id)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (rows ?? []) as VisitExtra[];
  });

const AddInput = z.object({
  booking_id: z.string().uuid(),
  kind: z.enum(["errand_stop", "extra_time", "reimbursement", "other"]),
  amount_cents: z.number().int().min(0).max(500_00),
  note: z.string().max(500).optional().nullable(),
});

export const addVisitExtra = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => AddInput.parse(input))
  .handler(async ({ data, context }): Promise<VisitExtra> => {
    // Load booking to find the senior + visit_id
    const { data: booking, error: bErr } = await context.supabase
      .from("bookings")
      .select("id, senior_id, provider_id, visit:visits(id)")
      .eq("id", data.booking_id)
      .maybeSingle();
    if (bErr) throw bErr;
    if (!booking) throw new Error("Booking not found");
    if (booking.provider_id !== context.userId) throw new Error("Only the assigned provider can add extras");

    const visitArr = (booking.visit as { id: string }[] | null) ?? [];
    const visitId = visitArr[0]?.id ?? null;

    // Look up senior's monthly extras budget (default $40)
    const { data: pref } = await context.supabase
      .from("senior_preferences")
      .select("extras_monthly_budget_cents")
      .eq("user_id", booking.senior_id)
      .maybeSingle();
    const budget = pref?.extras_monthly_budget_cents ?? 4000;

    // Sum already-approved extras this calendar month across senior's bookings
    const start = new Date();
    start.setDate(1);
    start.setHours(0, 0, 0, 0);

    const { data: seniorBookings } = await context.supabase
      .from("bookings")
      .select("id")
      .eq("senior_id", booking.senior_id);
    const bookingIds = (seniorBookings ?? []).map((b) => b.id);

    let spent = 0;
    if (bookingIds.length > 0) {
      const { data: existing } = await context.supabase
        .from("visit_extras")
        .select("amount_cents, status, created_at")
        .in("booking_id", bookingIds)
        .in("status", ["approved", "auto_approved"])
        .gte("created_at", start.toISOString());
      spent = (existing ?? []).reduce((sum, r) => sum + (r.amount_cents ?? 0), 0);
    }

    const remaining = Math.max(0, budget - spent);
    const status: VisitExtraStatus = data.amount_cents <= remaining ? "auto_approved" : "pending";

    const { data: row, error } = await context.supabase
      .from("visit_extras")
      .insert({
        booking_id: data.booking_id,
        visit_id: visitId,
        kind: data.kind,
        amount_cents: data.amount_cents,
        note: data.note ?? null,
        status,
        created_by: context.userId,
      })
      .select("id, booking_id, visit_id, kind, amount_cents, note, status, created_by, created_at")
      .single();
    if (error) throw error;
    return row as VisitExtra;
  });

const StatusInput = z.object({
  id: z.string().uuid(),
  status: z.enum(["approved", "declined"]),
});

export const setVisitExtraStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => StatusInput.parse(input))
  .handler(async ({ data, context }): Promise<VisitExtra> => {
    const { data: row, error } = await context.supabase
      .from("visit_extras")
      .update({ status: data.status })
      .eq("id", data.id)
      .select("id, booking_id, visit_id, kind, amount_cents, note, status, created_by, created_at")
      .single();
    if (error) throw error;
    return row as VisitExtra;
  });

const DeleteInput = z.object({ id: z.string().uuid() });

export const deleteVisitExtra = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => DeleteInput.parse(input))
  .handler(async ({ data, context }): Promise<{ ok: true }> => {
    const { error } = await context.supabase.from("visit_extras").delete().eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

const BudgetInput = z.object({ extras_monthly_budget_cents: z.number().int().min(0).max(100_000) });

export const setExtrasBudget = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => BudgetInput.parse(input))
  .handler(async ({ data, context }): Promise<{ extras_monthly_budget_cents: number }> => {
    const { error } = await context.supabase
      .from("senior_preferences")
      .upsert(
        { user_id: context.userId, extras_monthly_budget_cents: data.extras_monthly_budget_cents },
        { onConflict: "user_id" },
      );
    if (error) throw error;
    return { extras_monthly_budget_cents: data.extras_monthly_budget_cents };
  });
