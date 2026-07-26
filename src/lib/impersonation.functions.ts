import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const STAFF_ROLES = ["admin", "support", "staff", "success"] as const;

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
  entry: { action: string; target_user_id?: string; entity?: string; entity_id?: string; payload?: any },
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

const StartInput = z.object({
  user_id: z.string().uuid(),
  reason: z.string().trim().min(3).max(500),
  minutes: z.number().int().min(5).max(120).optional().default(30),
});

async function sha256(input: string): Promise<string> {
  const bytes = new TextEncoder().encode(input);
  const buf = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export type ImpersonationStart = {
  session_id: string;
  expires_at: string;
  target_user_id: string;
  target_name: string | null;
  target_email: string | null;
  magic_link: string | null;
};

export const startImpersonation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => StartInput.parse(input))
  .handler(async ({ data, context }): Promise<ImpersonationStart> => {
    if (!(await isStaff(context))) throw new Error("Forbidden");
    if (data.user_id === context.userId) throw new Error("You cannot impersonate yourself.");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Block impersonating other staff/admins as a safety guard.
    const { data: targetRoles } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", data.user_id);
    const staffLike = new Set(["admin", "staff", "support", "finance", "success"]);
    if ((targetRoles ?? []).some((r: any) => staffLike.has(r.role))) {
      throw new Error("Cannot impersonate staff or admin accounts.");
    }

    const token = crypto.randomUUID() + crypto.randomUUID();
    const token_hash = await sha256(token);
    const expires_at = new Date(Date.now() + data.minutes * 60_000).toISOString();

    const { data: session, error } = await context.supabase
      .from("staff_impersonation_sessions")
      .insert({
        staff_id: context.userId,
        target_user_id: data.user_id,
        reason: data.reason,
        token_hash,
        expires_at,
      })
      .select("id")
      .single();
    if (error) throw error;

    // Fetch target details + generate a magic link the staff member can use.
    const { data: userR } = await supabaseAdmin.auth.admin.getUserById(data.user_id);
    const { data: prof } = await supabaseAdmin
      .from("profiles")
      .select("full_name")
      .eq("id", data.user_id)
      .maybeSingle();

    let magic_link: string | null = null;
    if (userR.user?.email) {
      const { data: link } = await supabaseAdmin.auth.admin.generateLink({
        type: "magiclink",
        email: userR.user.email,
      });
      magic_link = (link as any)?.properties?.action_link ?? null;
    }

    await writeAudit(context, {
      action: "impersonation.start",
      target_user_id: data.user_id,
      entity: "staff_impersonation_sessions",
      entity_id: session.id,
      payload: { reason: data.reason, minutes: data.minutes },
    });

    return {
      session_id: session.id,
      expires_at,
      target_user_id: data.user_id,
      target_name: (prof as any)?.full_name ?? null,
      target_email: userR.user?.email ?? null,
      magic_link,
    };
  });

const SessionIdInput = z.object({ session_id: z.string().uuid() });

export const endImpersonation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => SessionIdInput.parse(input))
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("staff_impersonation_sessions")
      .update({ ended_at: new Date().toISOString() })
      .eq("id", data.session_id)
      .eq("staff_id", context.userId)
      .is("ended_at", null)
      .select("target_user_id")
      .maybeSingle();
    if (error) throw error;
    await writeAudit(context, {
      action: "impersonation.end",
      target_user_id: row?.target_user_id ?? undefined,
      entity: "staff_impersonation_sessions",
      entity_id: data.session_id,
    });
    return { ok: true };
  });

export type ImpersonationRow = {
  id: string;
  staff_id: string;
  staff_name: string | null;
  target_user_id: string;
  target_name: string | null;
  reason: string;
  expires_at: string;
  ended_at: string | null;
  created_at: string;
};

export const listImpersonationSessions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<ImpersonationRow[]> => {
    if (!(await isStaff(context))) throw new Error("Forbidden");
    const { data: rows, error } = await context.supabase
      .from("staff_impersonation_sessions")
      .select("id, staff_id, target_user_id, reason, expires_at, ended_at, created_at")
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) throw error;
    const ids = new Set<string>();
    for (const r of rows ?? []) {
      ids.add(r.staff_id);
      ids.add(r.target_user_id);
    }
    const { data: profs } = await context.supabase
      .from("profiles")
      .select("id, full_name")
      .in("id", Array.from(ids));
    const nameMap = new Map((profs ?? []).map((p: any) => [p.id, p.full_name as string | null]));
    return (rows ?? []).map((r: any) => ({
      ...r,
      staff_name: nameMap.get(r.staff_id) ?? null,
      target_name: nameMap.get(r.target_user_id) ?? null,
    }));
  });
