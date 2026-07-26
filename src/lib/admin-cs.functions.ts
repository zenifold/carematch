import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";

type Status = Database["public"]["Enums"]["cs_task_status"];
type Priority = Database["public"]["Enums"]["cs_task_priority"];

const STAFF = ["admin", "success", "support", "staff"] as const;

async function isStaff(context: { supabase: any; userId: string }) {
  const { data } = await context.supabase.rpc("has_any_role", { _user_id: context.userId, _roles: STAFF });
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

export type CsTaskRow = {
  id: string;
  target_user_id: string | null;
  target_name: string | null;
  assignee_id: string | null;
  assignee_name: string | null;
  title: string;
  notes: string | null;
  status: Status;
  priority: Priority;
  due_at: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
};

export const listCsTasks = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<CsTaskRow[]> => {
    if (!(await isStaff(context))) throw new Error("Forbidden");
    const { data, error } = await context.supabase
      .from("cs_tasks")
      .select("id, target_user_id, assignee_id, title, notes, status, priority, due_at, created_by, created_at, updated_at")
      .order("due_at", { ascending: true, nullsFirst: false })
      .limit(200);
    if (error) throw error;
    const ids = new Set<string>();
    for (const r of data ?? []) {
      if (r.target_user_id) ids.add(r.target_user_id);
      if (r.assignee_id) ids.add(r.assignee_id);
    }
    let nameMap = new Map<string, string | null>();
    if (ids.size) {
      const { data: profs } = await context.supabase.from("profiles").select("id, full_name").in("id", Array.from(ids));
      nameMap = new Map((profs ?? []).map((p: any) => [p.id, p.full_name]));
    }
    return (data ?? []).map((r: any) => ({
      ...r,
      target_name: r.target_user_id ? nameMap.get(r.target_user_id) ?? null : null,
      assignee_name: r.assignee_id ? nameMap.get(r.assignee_id) ?? null : null,
    }));
  });

const CreateInput = z.object({
  title: z.string().trim().min(2).max(200),
  notes: z.string().trim().max(4000).optional().nullable(),
  target_user_id: z.string().uuid().optional().nullable(),
  priority: z.enum(["low", "normal", "high"]).optional().default("normal"),
  due_at: z.string().datetime().optional().nullable(),
});

export const createCsTask = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => CreateInput.parse(i))
  .handler(async ({ data, context }) => {
    if (!(await isStaff(context))) throw new Error("Forbidden");
    const { data: row, error } = await context.supabase
      .from("cs_tasks")
      .insert({
        title: data.title,
        notes: data.notes ?? null,
        target_user_id: data.target_user_id ?? null,
        priority: data.priority,
        due_at: data.due_at ?? null,
        created_by: context.userId,
      })
      .select("id")
      .single();
    if (error) throw error;
    await writeAudit(context, { action: "cs.task.create", entity: "cs_tasks", entity_id: row.id });
    return { ok: true, id: row.id as string };
  });

const UpdateInput = z.object({
  id: z.string().uuid(),
  status: z.enum(["open", "in_progress", "done", "snoozed"]).optional(),
  priority: z.enum(["low", "normal", "high"]).optional(),
  assignee_id: z.string().uuid().nullable().optional(),
  notes: z.string().trim().max(4000).nullable().optional(),
  due_at: z.string().datetime().nullable().optional(),
});

export const updateCsTask = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => UpdateInput.parse(i))
  .handler(async ({ data, context }) => {
    if (!(await isStaff(context))) throw new Error("Forbidden");
    const { id, ...patch } = data;
    const { error } = await context.supabase.from("cs_tasks").update(patch).eq("id", id);
    if (error) throw error;
    await writeAudit(context, { action: "cs.task.update", entity: "cs_tasks", entity_id: id, payload: patch });
    return { ok: true };
  });

export const assignCsTaskToMe = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    if (!(await isStaff(context))) throw new Error("Forbidden");
    const { error } = await context.supabase.from("cs_tasks").update({ assignee_id: context.userId }).eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });
