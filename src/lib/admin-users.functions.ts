import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];
const ALL_ROLES: AppRole[] = [
  "senior",
  "family",
  "provider",
  "admin",
  "staff",
  "support",
  "finance",
  "success",
  "trust_safety",
];

async function assertAdmin(context: { supabase: any; userId: string }) {
  const { data, error } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "admin",
  });
  if (error) throw error;
  if (!data) throw new Error("Forbidden");
}

async function writeAudit(
  context: { supabase: any; userId: string },
  entry: {
    action: string;
    target_user_id?: string | null;
    entity?: string | null;
    entity_id?: string | null;
    payload?: Record<string, unknown>;
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

export type AdminUserRow = {
  id: string;
  email: string | null;
  full_name: string | null;
  city: string | null;
  avatar_url: string | null;
  roles: AppRole[];
  created_at: string;
  last_sign_in_at: string | null;
  email_confirmed_at: string | null;
  suspended_at: string | null;
  suspended_reason: string | null;
  deleted_at: string | null;
};

const ListInput = z.object({
  search: z.string().optional().nullable(),
  role: z.string().optional().nullable(),
  status: z.enum(["all", "active", "suspended", "deleted"]).optional().default("all"),
  limit: z.number().int().min(1).max(200).optional().default(100),
});

export const listAdminUsers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => ListInput.parse(input ?? {}))
  .handler(async ({ data, context }): Promise<AdminUserRow[]> => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Status/role/search filtering below happens in-memory over the full
    // user set, so a single page-1 fetch silently hid every account past
    // the first `data.limit` (e.g. searching by name found nothing for
    // anyone registered after account #200). Page through all of them —
    // this is an admin tool, not a hot path, so the extra round trips are fine.
    const allUsers: any[] = [];
    const PAGE_SIZE = 200;
    for (let page = 1; ; page++) {
      const { data: usersPage, error: usersErr } = await supabaseAdmin.auth.admin.listUsers({
        page,
        perPage: PAGE_SIZE,
      });
      if (usersErr) throw usersErr;
      allUsers.push(...usersPage.users);
      if (usersPage.users.length < PAGE_SIZE) break;
    }

    const ids = allUsers.map((u) => u.id);
    if (ids.length === 0) return [];

    const [profilesR, rolesR] = await Promise.all([
      supabaseAdmin
        .from("profiles")
        .select("id, full_name, city, avatar_url, suspended_at, suspended_reason, deleted_at")
        .in("id", ids),
      supabaseAdmin.from("user_roles").select("user_id, role").in("user_id", ids),
    ]);
    if (profilesR.error) throw profilesR.error;
    if (rolesR.error) throw rolesR.error;

    const pMap = new Map((profilesR.data ?? []).map((p: any) => [p.id, p]));
    const rMap = new Map<string, AppRole[]>();
    for (const r of rolesR.data ?? []) {
      const list = rMap.get(r.user_id) ?? [];
      list.push(r.role as AppRole);
      rMap.set(r.user_id, list);
    }

    const rows: AdminUserRow[] = allUsers.map((u: any) => {
      const p = pMap.get(u.id) ?? {};
      return {
        id: u.id,
        email: u.email ?? null,
        full_name: p.full_name ?? null,
        city: p.city ?? null,
        avatar_url: p.avatar_url ?? null,
        roles: rMap.get(u.id) ?? [],
        created_at: u.created_at,
        last_sign_in_at: u.last_sign_in_at ?? null,
        email_confirmed_at: u.email_confirmed_at ?? null,
        suspended_at: p.suspended_at ?? null,
        suspended_reason: p.suspended_reason ?? null,
        deleted_at: p.deleted_at ?? null,
      };
    });

    let filtered = rows;
    if (data.status === "active") {
      filtered = filtered.filter((r) => !r.suspended_at && !r.deleted_at);
    } else if (data.status === "suspended") {
      filtered = filtered.filter((r) => !!r.suspended_at && !r.deleted_at);
    } else if (data.status === "deleted") {
      filtered = filtered.filter((r) => !!r.deleted_at);
    }
    if (data.role && ALL_ROLES.includes(data.role as AppRole)) {
      filtered = filtered.filter((r) => r.roles.includes(data.role as AppRole));
    }
    if (data.search) {
      const needle = data.search.toLowerCase();
      filtered = filtered.filter(
        (r) =>
          (r.email ?? "").toLowerCase().includes(needle) ||
          (r.full_name ?? "").toLowerCase().includes(needle) ||
          (r.city ?? "").toLowerCase().includes(needle),
      );
    }
    return filtered.slice(0, data.limit);
  });

const AddRoleInput = z.object({
  user_id: z.string().uuid(),
  role: z.enum([
    "senior",
    "family",
    "provider",
    "admin",
    "staff",
    "support",
    "finance",
    "success",
    "trust_safety",
  ]),
});

export const addUserRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => AddRoleInput.parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: data.user_id, role: data.role })
      .select()
      .maybeSingle();
    if (error && !`${error.message}`.includes("duplicate")) throw error;
    await writeAudit(context, {
      action: "user.role.add",
      target_user_id: data.user_id,
      entity: "user_roles",
      payload: { role: data.role },
    });
    return { ok: true };
  });

export const removeUserRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => AddRoleInput.parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    if (data.user_id === context.userId && data.role === "admin") {
      throw new Error("You cannot remove your own admin role.");
    }
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("user_roles")
      .delete()
      .eq("user_id", data.user_id)
      .eq("role", data.role);
    if (error) throw error;
    await writeAudit(context, {
      action: "user.role.remove",
      target_user_id: data.user_id,
      entity: "user_roles",
      payload: { role: data.role },
    });
    return { ok: true };
  });

const SuspendInput = z.object({
  user_id: z.string().uuid(),
  reason: z.string().trim().min(1).max(500),
});

export const suspendUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => SuspendInput.parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    if (data.user_id === context.userId) throw new Error("You cannot suspend yourself.");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("profiles")
      .update({ suspended_at: new Date().toISOString(), suspended_reason: data.reason })
      .eq("id", data.user_id);
    if (error) throw error;
    // Also ban the auth user so they can't sign in
    await supabaseAdmin.auth.admin.updateUserById(data.user_id, { ban_duration: "876000h" });
    await writeAudit(context, {
      action: "user.suspend",
      target_user_id: data.user_id,
      entity: "profiles",
      payload: { reason: data.reason },
    });
    return { ok: true };
  });

const UserIdInput = z.object({ user_id: z.string().uuid() });

export const reactivateUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => UserIdInput.parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("profiles")
      .update({ suspended_at: null, suspended_reason: null })
      .eq("id", data.user_id);
    if (error) throw error;
    await supabaseAdmin.auth.admin.updateUserById(data.user_id, { ban_duration: "none" });
    await writeAudit(context, {
      action: "user.reactivate",
      target_user_id: data.user_id,
      entity: "profiles",
      payload: {},
    });
    return { ok: true };
  });

export const sendPasswordReset = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => UserIdInput.parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: u, error: uErr } = await supabaseAdmin.auth.admin.getUserById(data.user_id);
    if (uErr) throw uErr;
    if (!u.user?.email) throw new Error("User has no email on file.");
    const { error } = await supabaseAdmin.auth.admin.generateLink({
      type: "recovery",
      email: u.user.email,
    });
    if (error) throw error;
    await writeAudit(context, {
      action: "user.password_reset",
      target_user_id: data.user_id,
      entity: "auth",
      payload: { email: u.user.email },
    });
    return { ok: true };
  });

const CreateUserInput = z.object({
  email: z.string().email(),
  full_name: z.string().trim().min(1).max(200),
  role: z.enum(["senior", "family", "provider", "admin", "staff", "support", "finance", "success"]),
  send_invite: z.boolean().optional().default(true),
});

export const createAdminUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => CreateUserInput.parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    let created;
    if (data.send_invite) {
      const { data: r, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(data.email, {
        data: { full_name: data.full_name, role: data.role },
      });
      if (error) throw error;
      created = r.user;
    } else {
      const tempPassword = crypto.randomUUID() + "!Aa1";
      const { data: r, error } = await supabaseAdmin.auth.admin.createUser({
        email: data.email,
        password: tempPassword,
        email_confirm: true,
        user_metadata: { full_name: data.full_name, role: data.role },
      });
      if (error) throw error;
      created = r.user;
    }
    // handle_new_user trigger creates profile + default role from user_metadata.role.
    // Ensure the requested role is present even if the trigger fell back.
    if (created && data.role !== "senior") {
      await supabaseAdmin
        .from("user_roles")
        .insert({ user_id: created.id, role: data.role })
        .select();
    }
    await writeAudit(context, {
      action: "user.create",
      target_user_id: created?.id ?? null,
      entity: "auth",
      payload: { email: data.email, role: data.role, invited: data.send_invite },
    });
    return { ok: true, user_id: created?.id ?? null };
  });

type JsonValue = string | number | boolean | null | JsonValue[] | { [k: string]: JsonValue };

export type AuditLogRow = {
  id: string;
  actor_id: string;
  actor_name: string | null;
  target_user_id: string | null;
  target_name: string | null;
  action: string;
  entity: string | null;
  entity_id: string | null;
  payload: JsonValue;
  created_at: string;
};

const AuditListInput = z.object({
  target_user_id: z.string().uuid().optional().nullable(),
  limit: z.number().int().min(1).max(200).optional().default(100),
});

export const listAuditLog = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => AuditListInput.parse(input ?? {}))
  .handler(async ({ data, context }): Promise<AuditLogRow[]> => {
    await assertAdmin(context);
    let q = context.supabase
      .from("admin_audit_log")
      .select("id, actor_id, target_user_id, action, entity, entity_id, payload, created_at")
      .order("created_at", { ascending: false })
      .limit(data.limit);
    if (data.target_user_id) q = q.eq("target_user_id", data.target_user_id);
    const { data: rows, error } = await q;
    if (error) throw error;

    const ids = new Set<string>();
    for (const r of rows ?? []) {
      if (r.actor_id) ids.add(r.actor_id);
      if (r.target_user_id) ids.add(r.target_user_id);
    }
    let nameMap = new Map<string, string>();
    if (ids.size) {
      const { data: profs } = await context.supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", Array.from(ids));
      nameMap = new Map((profs ?? []).map((p: any) => [p.id, p.full_name]));
    }
    return (rows ?? []).map((r: any) => ({
      id: r.id,
      actor_id: r.actor_id,
      actor_name: nameMap.get(r.actor_id) ?? null,
      target_user_id: r.target_user_id,
      target_name: r.target_user_id ? nameMap.get(r.target_user_id) ?? null : null,
      action: r.action,
      entity: r.entity,
      entity_id: r.entity_id,
      payload: r.payload ?? {},
      created_at: r.created_at,
    }));
  });
