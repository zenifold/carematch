import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";

type Status = Database["public"]["Enums"]["support_status"];
type Priority = Database["public"]["Enums"]["support_priority"];
type Portal = Database["public"]["Enums"]["support_portal"];

const STAFF_ROLES = ["admin", "support", "staff"] as const;

async function isStaff(context: { supabase: any; userId: string }) {
  const { data, error } = await context.supabase.rpc("has_any_role", {
    _user_id: context.userId,
    _roles: STAFF_ROLES,
  });
  if (error) throw error;
  return !!data;
}

async function writeAudit(
  context: { supabase: any; userId: string },
  entry: {
    action: string;
    target_user_id?: string | null;
    entity?: string;
    entity_id?: string;
    payload?: any;
  },
) {
  await context.supabase.from("admin_audit_log").insert({
    actor_id: context.userId,
    target_user_id: entry.target_user_id ?? null,
    action: entry.action,
    entity: entry.entity ?? null,
    entity_id: entry.entity_id ?? null,
    payload: entry.payload ?? {},
  });
}

export type SupportTicketRow = {
  id: string;
  requester_id: string;
  requester_name: string | null;
  requester_email: string | null;
  assignee_id: string | null;
  assignee_name: string | null;
  subject: string;
  body: string;
  status: Status;
  priority: Priority;
  category: string | null;
  portal: Portal;
  last_activity_at: string;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
  message_count?: number;
};

const CreateTicketInput = z.object({
  subject: z.string().trim().min(3).max(200),
  body: z.string().trim().min(3).max(5000),
  category: z.string().trim().max(80).optional().nullable(),
  portal: z.enum(["senior", "family", "provider", "other"]).optional().default("other"),
  priority: z.enum(["low", "normal", "high", "urgent"]).optional().default("normal"),
});

export const createSupportTicket = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => CreateTicketInput.parse(input))
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("support_tickets")
      .insert({
        requester_id: context.userId,
        subject: data.subject,
        body: data.body,
        category: data.category ?? null,
        portal: data.portal,
        priority: data.priority,
      })
      .select("id")
      .single();
    if (error) throw error;
    // seed the initial message so threads always start with the requester's body
    await context.supabase.from("support_messages").insert({
      ticket_id: row.id,
      author_id: context.userId,
      body: data.body,
      internal: false,
    });

    // Best-effort confirmation email — never let a delivery failure fail
    // the ticket itself; sendTemplateEmail already no-ops quietly if no
    // provider is configured.
    try {
      const email = context.claims.email as string | undefined;
      if (email) {
        const { data: profile } = await context.supabase
          .from("profiles")
          .select("full_name")
          .eq("id", context.userId)
          .maybeSingle();
        const { sendTemplateEmail } = await import("./email-templates/send-email");
        await sendTemplateEmail("support-ticket-confirmation", email, {
          templateData: {
            first_name: profile?.full_name?.split(" ")[0] ?? "there",
            ticket_subject: data.subject,
          },
          idempotencyKey: `support-ticket-confirm-${row.id}`,
        });
      }
    } catch {
      // swallow — confirmation email is best-effort
    }

    return { ok: true, id: row.id as string };
  });

export const listMyTickets = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<SupportTicketRow[]> => {
    const { data, error } = await context.supabase
      .from("support_tickets")
      .select(
        "id, requester_id, assignee_id, subject, body, status, priority, category, portal, last_activity_at, resolved_at, created_at, updated_at",
      )
      .eq("requester_id", context.userId)
      .order("last_activity_at", { ascending: false })
      .limit(100);
    if (error) throw error;
    return (data ?? []).map((r: any) => ({
      ...r,
      requester_name: null,
      requester_email: null,
      assignee_name: null,
    }));
  });

const ListInboxInput = z.object({
  status: z.enum(["all", "open", "pending", "resolved", "closed"]).optional().default("all"),
  assignee: z.enum(["all", "me", "unassigned"]).optional().default("all"),
  limit: z.number().int().min(1).max(200).optional().default(100),
});

export const listSupportInbox = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => ListInboxInput.parse(input ?? {}))
  .handler(async ({ data, context }): Promise<SupportTicketRow[]> => {
    if (!(await isStaff(context))) throw new Error("Forbidden");

    let q = context.supabase
      .from("support_tickets")
      .select(
        "id, requester_id, assignee_id, subject, body, status, priority, category, portal, last_activity_at, resolved_at, created_at, updated_at",
      )
      .order("last_activity_at", { ascending: false })
      .limit(data.limit);
    if (data.status !== "all") q = q.eq("status", data.status);
    if (data.assignee === "me") q = q.eq("assignee_id", context.userId);
    else if (data.assignee === "unassigned") q = q.is("assignee_id", null);

    const { data: rows, error } = await q;
    if (error) throw error;

    const ids = new Set<string>();
    for (const r of rows ?? []) {
      if (r.requester_id) ids.add(r.requester_id);
      if (r.assignee_id) ids.add(r.assignee_id);
    }
    const nameMap = new Map<string, { name: string | null; email: string | null }>();
    if (ids.size) {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      // Looking up each id directly (rather than one listUsers page filtered
      // client-side) means requesters/assignees outside the first 200
      // registered accounts still resolve correctly as the user base grows.
      const [profR, users] = await Promise.all([
        supabaseAdmin.from("profiles").select("id, full_name").in("id", Array.from(ids)),
        Promise.all(Array.from(ids).map((id) => supabaseAdmin.auth.admin.getUserById(id))),
      ]);
      const emailMap = new Map(
        users
          .filter((u) => u.data?.user)
          .map((u) => [u.data.user!.id, u.data.user!.email as string | null]),
      );
      for (const p of profR.data ?? []) {
        nameMap.set(p.id, {
          name: (p as any).full_name ?? null,
          email: emailMap.get(p.id) ?? null,
        });
      }
    }
    return (rows ?? []).map((r: any) => ({
      ...r,
      requester_name: nameMap.get(r.requester_id)?.name ?? null,
      requester_email: nameMap.get(r.requester_id)?.email ?? null,
      assignee_name: r.assignee_id ? (nameMap.get(r.assignee_id)?.name ?? null) : null,
    }));
  });

export type SupportMessageRow = {
  id: string;
  ticket_id: string;
  author_id: string;
  author_name: string | null;
  body: string;
  internal: boolean;
  created_at: string;
};

const TicketIdInput = z.object({ ticket_id: z.string().uuid() });

export const getTicket = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => TicketIdInput.parse(input))
  .handler(
    async ({
      data,
      context,
    }): Promise<{ ticket: SupportTicketRow; messages: SupportMessageRow[] }> => {
      const { data: t, error } = await context.supabase
        .from("support_tickets")
        .select(
          "id, requester_id, assignee_id, subject, body, status, priority, category, portal, last_activity_at, resolved_at, created_at, updated_at",
        )
        .eq("id", data.ticket_id)
        .single();
      if (error) throw error;

      const { data: msgs, error: mErr } = await context.supabase
        .from("support_messages")
        .select("id, ticket_id, author_id, body, internal, created_at")
        .eq("ticket_id", data.ticket_id)
        .order("created_at", { ascending: true });
      if (mErr) throw mErr;

      const ids = new Set<string>();
      if (t.requester_id) ids.add(t.requester_id);
      if (t.assignee_id) ids.add(t.assignee_id);
      for (const m of msgs ?? []) ids.add(m.author_id);

      const { data: profs } = await context.supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", Array.from(ids));
      const nameMap = new Map((profs ?? []).map((p: any) => [p.id, p.full_name as string | null]));

      return {
        ticket: {
          ...(t as any),
          requester_name: nameMap.get(t.requester_id) ?? null,
          requester_email: null,
          assignee_name: t.assignee_id ? (nameMap.get(t.assignee_id) ?? null) : null,
        },
        messages: (msgs ?? []).map((m: any) => ({
          ...m,
          author_name: nameMap.get(m.author_id) ?? null,
        })),
      };
    },
  );

const PostMessageInput = z.object({
  ticket_id: z.string().uuid(),
  body: z.string().trim().min(1).max(5000),
  internal: z.boolean().optional().default(false),
});

export const postTicketMessage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => PostMessageInput.parse(input))
  .handler(async ({ data, context }) => {
    if (data.internal && !(await isStaff(context)))
      throw new Error("Only staff can post internal notes");
    const { error } = await context.supabase.from("support_messages").insert({
      ticket_id: data.ticket_id,
      author_id: context.userId,
      body: data.body,
      internal: data.internal,
    });
    if (error) throw error;
    // bump ticket activity
    await context.supabase
      .from("support_tickets")
      .update({ last_activity_at: new Date().toISOString() })
      .eq("id", data.ticket_id);
    return { ok: true };
  });

const UpdateTicketInput = z.object({
  ticket_id: z.string().uuid(),
  status: z.enum(["open", "pending", "resolved", "closed"]).optional(),
  priority: z.enum(["low", "normal", "high", "urgent"]).optional(),
  assignee_id: z.string().uuid().nullable().optional(),
});

export const updateTicket = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => UpdateTicketInput.parse(input))
  .handler(async ({ data, context }) => {
    if (!(await isStaff(context))) throw new Error("Forbidden");
    const patch: {
      last_activity_at: string;
      status?: Status;
      priority?: Priority;
      assignee_id?: string | null;
      resolved_at?: string | null;
    } = { last_activity_at: new Date().toISOString() };
    if (data.status !== undefined) {
      patch.status = data.status;
      if (data.status === "resolved" || data.status === "closed") {
        patch.resolved_at = new Date().toISOString();
      } else {
        patch.resolved_at = null;
      }
    }
    if (data.priority !== undefined) patch.priority = data.priority;
    if (data.assignee_id !== undefined) patch.assignee_id = data.assignee_id;

    const { error } = await context.supabase
      .from("support_tickets")
      .update(patch)
      .eq("id", data.ticket_id);

    if (error) throw error;
    await writeAudit(context, {
      action: "support.ticket.update",
      entity: "support_tickets",
      entity_id: data.ticket_id,
      payload: patch,
    });
    return { ok: true };
  });

export const assignTicketToMe = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => TicketIdInput.parse(input))
  .handler(async ({ data, context }) => {
    if (!(await isStaff(context))) throw new Error("Forbidden");
    const { error } = await context.supabase
      .from("support_tickets")
      .update({ assignee_id: context.userId, last_activity_at: new Date().toISOString() })
      .eq("id", data.ticket_id);
    if (error) throw error;
    await writeAudit(context, {
      action: "support.ticket.assign_self",
      entity: "support_tickets",
      entity_id: data.ticket_id,
    });
    return { ok: true };
  });
