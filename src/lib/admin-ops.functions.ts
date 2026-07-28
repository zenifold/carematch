import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";

type Audience = Database["public"]["Enums"]["broadcast_audience"];

async function assertAdmin(context: { supabase: any; userId: string }) {
  const { data } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
  if (!data) throw new Error("Forbidden");
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

// ---------- Feature flags ----------

export type FlagRow = {
  key: string;
  description: string | null;
  enabled: boolean;
  rollout_percent: number;
  updated_at: string;
};

export const listFlags = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<FlagRow[]> => {
    const { data, error } = await context.supabase
      .from("feature_flags")
      .select("key, description, enabled, rollout_percent, updated_at")
      .order("key");
    if (error) throw error;
    return data ?? [];
  });

const UpsertFlagInput = z.object({
  key: z
    .string()
    .trim()
    .min(2)
    .max(80)
    .regex(/^[a-z0-9_.-]+$/, "lowercase letters, digits, ._- only"),
  description: z.string().trim().max(500).nullable().optional(),
  enabled: z.boolean(),
  rollout_percent: z.number().int().min(0).max(100).optional().default(100),
});

export const upsertFlag = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => UpsertFlagInput.parse(i))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { error } = await context.supabase.from("feature_flags").upsert({
      key: data.key,
      description: data.description ?? null,
      enabled: data.enabled,
      rollout_percent: data.rollout_percent,
      updated_by: context.userId,
    });
    if (error) throw error;
    await writeAudit(context, { action: "flag.upsert", entity: "feature_flags", entity_id: data.key, payload: data });
    return { ok: true };
  });

export const deleteFlag = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ key: z.string() }).parse(i))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { error } = await context.supabase.from("feature_flags").delete().eq("key", data.key);
    if (error) throw error;
    await writeAudit(context, { action: "flag.delete", entity: "feature_flags", entity_id: data.key });
    return { ok: true };
  });

// ---------- Broadcasts ----------

export type BroadcastRow = {
  id: string;
  title: string;
  body: string;
  audience: Audience;
  starts_at: string;
  ends_at: string | null;
  dismissible: boolean;
  created_at: string;
};

export const listBroadcasts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<BroadcastRow[]> => {
    const { data, error } = await context.supabase
      .from("broadcasts")
      .select("id, title, body, audience, starts_at, ends_at, dismissible, created_at")
      .order("starts_at", { ascending: false })
      .limit(100);
    if (error) throw error;
    return data ?? [];
  });

const CreateBroadcast = z.object({
  title: z.string().trim().min(2).max(200),
  body: z.string().trim().min(2).max(4000),
  audience: z.enum(["all", "senior", "family", "provider", "staff"]).optional().default("all"),
  starts_at: z.string().datetime().optional(),
  ends_at: z.string().datetime().nullable().optional(),
  dismissible: z.boolean().optional().default(true),
});

export const createBroadcast = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => CreateBroadcast.parse(i))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { data: row, error } = await context.supabase
      .from("broadcasts")
      .insert({
        title: data.title,
        body: data.body,
        audience: data.audience,
        starts_at: data.starts_at ?? new Date().toISOString(),
        ends_at: data.ends_at ?? null,
        dismissible: data.dismissible,
        created_by: context.userId,
      })
      .select("id")
      .single();
    if (error) throw error;
    await writeAudit(context, {
      action: "broadcast.create",
      entity: "broadcasts",
      entity_id: row.id,
      payload: { title: data.title, audience: data.audience },
    });
    return { ok: true, id: row.id as string };
  });

export const deleteBroadcast = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { error } = await context.supabase.from("broadcasts").delete().eq("id", data.id);
    if (error) throw error;
    await writeAudit(context, { action: "broadcast.delete", entity: "broadcasts", entity_id: data.id });
    return { ok: true };
  });

// ---------- GDPR export ----------

export const exportUserData = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ user_id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const uid = data.user_id;

    const [prof, roles, senior, family, provider, bookings, msgs, notif, incidents, ledger, verif] = await Promise.all([
      supabaseAdmin.from("profiles").select("*").eq("id", uid).maybeSingle(),
      supabaseAdmin.from("user_roles").select("*").eq("user_id", uid),
      supabaseAdmin.from("senior_preferences").select("*").eq("user_id", uid),
      supabaseAdmin.from("family_links").select("*").or(`family_id.eq.${uid},senior_id.eq.${uid}`),
      supabaseAdmin.from("providers").select("*").eq("id", uid),
      supabaseAdmin.from("bookings").select("*").or(`senior_id.eq.${uid},provider_id.eq.${uid}`),
      supabaseAdmin.from("messages").select("*").eq("sender_id", uid),
      supabaseAdmin.from("notifications").select("*").eq("user_id", uid),
      supabaseAdmin.from("incidents").select("*").eq("reporter_id", uid),
      supabaseAdmin.from("payment_ledger").select("*").or(`senior_id.eq.${uid},provider_id.eq.${uid}`),
      supabaseAdmin.from("provider_credentials").select("*").eq("provider_id", uid),
    ]);


    const bundle = {
      exported_at: new Date().toISOString(),
      user_id: uid,
      profile: prof.data,
      roles: roles.data,
      senior_preferences: senior.data,
      family_links: family.data,
      provider: provider.data,
      bookings: bookings.data,
      messages: msgs.data,
      notifications: notif.data,
      incidents: incidents.data,
      payment_ledger: ledger.data,
      verifications: verif.data,
    };


    await writeAudit(context, {
      action: "gdpr.export",
      target_user_id: uid,
      entity: "profiles",
      entity_id: uid,
    });

    return bundle;
  });
