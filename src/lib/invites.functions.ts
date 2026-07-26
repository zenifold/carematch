import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type FamilyInvite = {
  id: string;
  code: string;
  email: string | null;
  permission: string;
  expires_at: string;
  redeemed_at: string | null;
  revoked_at: string | null;
  created_at: string;
};

const PermSchema = z.enum(["view", "modify", "financial"]);

function generateCode() {
  // Human-friendly code: 3 groups of 4, no confusable chars
  const alphabet = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  const pick = () =>
    Array.from({ length: 4 }, () =>
      alphabet[Math.floor(Math.random() * alphabet.length)],
    ).join("");
  return `${pick()}-${pick()}-${pick()}`;
}

const CreateInput = z.object({
  email: z.string().email().optional().or(z.literal("")).transform((v) => (v ? v : undefined)),
  permission: PermSchema.default("view"),
});

export const createFamilyInvite = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => CreateInput.parse(input))
  .handler(async ({ data, context }): Promise<FamilyInvite> => {
    // Attempt up to 3 times in case of a code collision (extremely unlikely).
    for (let i = 0; i < 3; i++) {
      const code = generateCode();
      const { data: row, error } = await context.supabase
        .from("family_invites")
        .insert({
          senior_id: context.userId,
          code,
          email: data.email ?? null,
          permission: data.permission,
        })
        .select("id, code, email, permission, expires_at, redeemed_at, revoked_at, created_at")
        .single();
      if (!error && row) return row as FamilyInvite;
      if (error && !String(error.message).toLowerCase().includes("unique")) throw error;
    }
    throw new Error("Could not generate a unique invite code, please try again.");
  });

export const listMyFamilyInvites = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<FamilyInvite[]> => {
    const { data, error } = await context.supabase
      .from("family_invites")
      .select("id, code, email, permission, expires_at, redeemed_at, revoked_at, created_at")
      .eq("senior_id", context.userId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as FamilyInvite[];
  });

const IdInput = z.object({ id: z.string().uuid() });

export const revokeFamilyInvite = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => IdInput.parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("family_invites")
      .update({ revoked_at: new Date().toISOString() })
      .eq("id", data.id)
      .eq("senior_id", context.userId);
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

export type InvitePreview = {
  senior_id: string;
  senior_name: string | null;
  senior_avatar_url: string | null;
  permission: string;
  expires_at: string;
};

export const lookupFamilyInvite = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => CodeInput.parse(input))
  .handler(async ({ data }): Promise<InvitePreview> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row, error } = await supabaseAdmin
      .from("family_invites")
      .select(
        "senior_id, permission, expires_at, redeemed_at, revoked_at, senior:profiles!family_invites_senior_id_fkey(full_name, avatar_url)",
      )
      .eq("code", data.code)
      .maybeSingle();
    if (error) throw error;
    if (!row) throw new Error("That invite code doesn't match any active invite.");
    if (row.revoked_at) throw new Error("This invite has been revoked.");
    if (row.redeemed_at) throw new Error("This invite has already been used.");
    if (new Date(row.expires_at).getTime() < Date.now())
      throw new Error("This invite has expired. Ask them to send a new one.");
    const senior = row.senior as { full_name: string | null; avatar_url: string | null } | null;
    return {
      senior_id: row.senior_id,
      senior_name: senior?.full_name ?? null,
      senior_avatar_url: senior?.avatar_url ?? null,
      permission: row.permission,
      expires_at: row.expires_at,
    };
  });

export const redeemFamilyInvite = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => CodeInput.parse(input))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row, error } = await supabaseAdmin
      .from("family_invites")
      .select("id, senior_id, permission, expires_at, redeemed_at, revoked_at")
      .eq("code", data.code)
      .maybeSingle();
    if (error) throw error;
    if (!row) throw new Error("That invite code doesn't match any active invite.");
    if (row.revoked_at) throw new Error("This invite has been revoked.");
    if (row.redeemed_at) throw new Error("This invite has already been used.");
    if (new Date(row.expires_at).getTime() < Date.now())
      throw new Error("This invite has expired.");
    if (row.senior_id === context.userId)
      throw new Error("You can't redeem your own invite.");

    // Create the family_link (approved because the senior issued the invite).
    const { error: linkErr } = await supabaseAdmin
      .from("family_links")
      .upsert(
        {
          senior_id: row.senior_id,
          family_id: context.userId,
          permission: row.permission,
          approved: true,
        },
        { onConflict: "senior_id,family_id" },
      );
    if (linkErr) {
      // If we don't have that unique constraint, fall back to insert-if-missing.
      const { data: existing } = await supabaseAdmin
        .from("family_links")
        .select("id")
        .eq("senior_id", row.senior_id)
        .eq("family_id", context.userId)
        .maybeSingle();
      if (!existing) {
        const { error: insErr } = await supabaseAdmin.from("family_links").insert({
          senior_id: row.senior_id,
          family_id: context.userId,
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
      .from("family_invites")
      .update({
        redeemed_at: new Date().toISOString(),
        redeemed_by: context.userId,
      })
      .eq("id", row.id);
    if (redErr) throw redErr;

    return { ok: true, senior_id: row.senior_id };
  });
