import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type SeniorInvite = {
  id: string;
  code: string;
  senior_email: string | null;
  senior_name: string | null;
  relationship: string | null;
  permission: string;
  expires_at: string;
  redeemed_at: string | null;
  revoked_at: string | null;
  created_at: string;
};

const PermSchema = z.enum(["view", "modify", "financial"]);

function generateCode() {
  const alphabet = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  const pick = () =>
    Array.from(
      { length: 4 },
      () => alphabet[Math.floor(Math.random() * alphabet.length)],
    ).join("");
  return `${pick()}-${pick()}-${pick()}`;
}

const CreateInput = z.object({
  senior_email: z
    .string()
    .email()
    .optional()
    .or(z.literal(""))
    .transform((v) => (v ? v : undefined)),
  senior_name: z.string().trim().max(120).optional().or(z.literal("")).transform((v) => (v ? v : undefined)),
  relationship: z.string().trim().max(60).optional().or(z.literal("")).transform((v) => (v ? v : undefined)),
  permission: PermSchema.default("view"),
});

export const createSeniorInvite = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => CreateInput.parse(input))
  .handler(async ({ data, context }): Promise<SeniorInvite> => {
    for (let i = 0; i < 3; i++) {
      const code = generateCode();
      const { data: row, error } = await context.supabase
        .from("senior_invites")
        .insert({
          family_id: context.userId,
          code,
          senior_email: data.senior_email ?? null,
          senior_name: data.senior_name ?? null,
          relationship: data.relationship ?? null,
          permission: data.permission,
        })
        .select(
          "id, code, senior_email, senior_name, relationship, permission, expires_at, redeemed_at, revoked_at, created_at",
        )
        .single();
      if (!error && row) return row as SeniorInvite;
      if (error && !String(error.message).toLowerCase().includes("unique")) throw error;
    }
    throw new Error("Could not generate a unique invite code, please try again.");
  });

export const listMySeniorInvites = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<SeniorInvite[]> => {
    const { data, error } = await context.supabase
      .from("senior_invites")
      .select(
        "id, code, senior_email, senior_name, relationship, permission, expires_at, redeemed_at, revoked_at, created_at",
      )
      .eq("family_id", context.userId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as SeniorInvite[];
  });

const IdInput = z.object({ id: z.string().uuid() });

export const revokeSeniorInvite = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => IdInput.parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("senior_invites")
      .update({ revoked_at: new Date().toISOString() })
      .eq("id", data.id)
      .eq("family_id", context.userId);
    if (error) throw error;
    return { ok: true };
  });

const CodeInput = z.object({
  code: z
    .string()
    .trim()
    .toUpperCase()
    .transform((v) => v.replace(/\s+/g, "").replace(/[^A-Z0-9-]/g, "")),
});

export type SeniorInvitePreview = {
  family_id: string;
  family_name: string | null;
  family_avatar_url: string | null;
  senior_name: string | null;
  relationship: string | null;
  permission: string;
  expires_at: string;
};

export const lookupSeniorInvite = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => CodeInput.parse(input))
  .handler(async ({ data }): Promise<SeniorInvitePreview> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row, error } = await supabaseAdmin
      .from("senior_invites")
      .select(
        "family_id, senior_name, relationship, permission, expires_at, redeemed_at, revoked_at, family:profiles!senior_invites_family_id_fkey(full_name, avatar_url)",
      )
      .eq("code", data.code)
      .maybeSingle();
    if (error) throw error;
    if (!row) throw new Error("That invite code doesn't match any active invite.");
    if (row.revoked_at) throw new Error("This invite has been revoked.");
    if (row.redeemed_at) throw new Error("This invite has already been used.");
    if (new Date(row.expires_at).getTime() < Date.now())
      throw new Error("This invite has expired. Ask them to send a new one.");
    const family = row.family as { full_name: string | null; avatar_url: string | null } | null;
    return {
      family_id: row.family_id,
      family_name: family?.full_name ?? null,
      family_avatar_url: family?.avatar_url ?? null,
      senior_name: row.senior_name,
      relationship: row.relationship,
      permission: row.permission,
      expires_at: row.expires_at,
    };
  });

export const redeemSeniorInvite = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => CodeInput.parse(input))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row, error } = await supabaseAdmin
      .from("senior_invites")
      .select("id, family_id, permission, expires_at, redeemed_at, revoked_at")
      .eq("code", data.code)
      .maybeSingle();
    if (error) throw error;
    if (!row) throw new Error("That invite code doesn't match any active invite.");
    if (row.revoked_at) throw new Error("This invite has been revoked.");
    if (row.redeemed_at) throw new Error("This invite has already been used.");
    if (new Date(row.expires_at).getTime() < Date.now())
      throw new Error("This invite has expired.");
    if (row.family_id === context.userId)
      throw new Error("You can't redeem your own invite.");

    const { error: linkErr } = await supabaseAdmin
      .from("family_links")
      .upsert(
        {
          senior_id: context.userId,
          family_id: row.family_id,
          permission: row.permission,
          approved: true,
        },
        { onConflict: "senior_id,family_id" },
      );
    if (linkErr) {
      const { data: existing } = await supabaseAdmin
        .from("family_links")
        .select("id")
        .eq("senior_id", context.userId)
        .eq("family_id", row.family_id)
        .maybeSingle();
      if (!existing) {
        const { error: insErr } = await supabaseAdmin.from("family_links").insert({
          senior_id: context.userId,
          family_id: row.family_id,
          permission: row.permission,
          approved: true,
        });
        if (insErr) throw insErr;
      } else {
        await supabaseAdmin
          .from("family_links")
          .update({ permission: row.permission, approved: true })
          .eq("id", existing.id);
      }
    }

    const { error: redErr } = await supabaseAdmin
      .from("senior_invites")
      .update({
        redeemed_at: new Date().toISOString(),
        redeemed_by: context.userId,
      })
      .eq("id", row.id);
    if (redErr) throw redErr;

    return { ok: true, family_id: row.family_id };
  });
