import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";

type CredentialKind = Database["public"]["Enums"]["credential_kind"];
type VerificationStatus = Database["public"]["Enums"]["verification_status"];

const STAFF = ["admin", "trust_safety", "staff"] as const;

async function isStaff(context: { supabase: any; userId: string }) {
  const { data } = await context.supabase.rpc("has_any_role", {
    _user_id: context.userId,
    _roles: STAFF,
  });
  return !!data;
}

export type PendingCredential = {
  id: string;
  provider_id: string;
  provider_name: string | null;
  kind: CredentialKind;
  status: VerificationStatus;
  issued_on: string | null;
  expires_on: string | null;
  issuing_state: string | null;
  document_path: string | null;
  notes: string | null;
  created_at: string;
};

const ListInput = z
  .object({
    status: z.enum(["pending", "passed", "failed", "expired"]).optional().nullable(),
    limit: z.number().int().min(1).max(500).optional().default(200),
  })
  .optional();

export const listCredentialQueue = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => ListInput.parse(i ?? {}))
  .handler(async ({ data, context }): Promise<PendingCredential[]> => {
    if (!(await isStaff(context))) throw new Error("Forbidden");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const status = data?.status ?? "pending";
    const limit = data?.limit ?? 200;
    const { data: rows, error } = await supabaseAdmin
      .from("provider_credentials")
      .select(
        "id, provider_id, kind, status, issued_on, expires_on, issuing_state, document_path, notes, created_at",
      )
      .eq("status", status)
      .order("created_at", { ascending: true })
      .limit(limit);
    if (error) throw error;
    const ids = Array.from(new Set((rows ?? []).map((r) => r.provider_id)));
    const { data: profs } = ids.length
      ? await supabaseAdmin.from("profiles").select("id, full_name").in("id", ids)
      : { data: [] as { id: string; full_name: string | null }[] };
    const nameMap = new Map((profs ?? []).map((p) => [p.id, p.full_name]));
    return (rows ?? []).map((r) => ({
      ...r,
      provider_name: nameMap.get(r.provider_id) ?? null,
    })) as PendingCredential[];
  });

const DecisionInput = z.object({
  id: z.string().uuid(),
  decision: z.enum(["passed", "failed"]),
  note: z.string().max(1000).optional().nullable(),
});

export const decideCredential = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => DecisionInput.parse(i))
  .handler(async ({ data, context }) => {
    if (!(await isStaff(context))) throw new Error("Forbidden");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const now = new Date().toISOString();
    const { data: row, error: rErr } = await supabaseAdmin
      .from("provider_credentials")
      .update({
        status: data.decision,
        verified_at: now,
        verified_by: context.userId,
        notes: data.note ?? null,
      } as never)
      .eq("id", data.id)
      .select("id, provider_id, kind")
      .maybeSingle();
    if (rErr) throw rErr;
    if (!row) throw new Error("Credential not found");

    // Approving an id_verification credential manually is the only signal
    // that unlocks the background-check gate, since that gate reads
    // provider_identity_verifications.status, not provider_credentials —
    // these live in separate tables with no automated link in this direction.
    if (row.kind === "id_verification" && data.decision === "passed") {
      await supabaseAdmin.from("provider_identity_verifications" as any).upsert(
        {
          provider_id: row.provider_id,
          vendor: "manual",
          status: "verified",
          verified_at: now,
        } as any,
        { onConflict: "provider_id,vendor" },
      );
    }

    await supabaseAdmin.from("admin_audit_log").insert({
      actor_id: context.userId,
      target_user_id: row.provider_id,
      action: `credential_${data.decision}`,
      entity: "provider_credentials",
      entity_id: row.id,
      payload: { kind: row.kind, note: data.note ?? null },
    } as never);
    return { ok: true };
  });

/**
 * Signed URL to view an uploaded credential document.
 * Staff-only. Bucket `verification-docs` is private.
 */
const SignInput = z.object({ path: z.string().min(1) });

export const signCredentialDocument = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => SignInput.parse(i))
  .handler(async ({ data, context }): Promise<{ url: string }> => {
    if (!(await isStaff(context))) throw new Error("Forbidden");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: signed, error } = await supabaseAdmin.storage
      .from("verification-docs")
      .createSignedUrl(data.path, 60 * 10);
    if (error) throw error;
    return { url: signed.signedUrl };
  });

/**
 * All uploaded ID/selfie photos for a provider, for manually comparing the
 * government ID photo against the liveness selfie during id_verification
 * review — a single document_path isn't enough to actually compare the two.
 */
const ListDocsInput = z.object({ providerId: z.string().uuid() });

export const listIdentityDocuments = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => ListDocsInput.parse(i))
  .handler(async ({ data, context }) => {
    if (!(await isStaff(context))) throw new Error("Forbidden");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows, error } = await supabaseAdmin
      .from("provider_documents")
      .select("kind, storage_path, status, uploaded_at")
      .eq("provider_id", data.providerId)
      .order("uploaded_at", { ascending: false });
    if (error) throw error;
    return (rows ?? []) as Array<{
      kind: string;
      storage_path: string;
      status: string;
      uploaded_at: string;
    }>;
  });
