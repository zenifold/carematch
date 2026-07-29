import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { LEGAL_DOCUMENTS, hashLegalDocument, requiredDocumentsFor } from "@/lib/legal";

const Input = z.object({
  role: z.enum(["senior", "family", "provider"]),
});

/**
 * Google OAuth signup can't carry the role the user picked on the form the
 * way email/password signup does (there's no client-supplied metadata step
 * in the OAuth redirect round-trip), so `handle_new_user()` always defaults
 * fresh OAuth accounts to `role: 'senior'`, and the signup form's legal
 * consent acceptance never gets recorded for that path either. Call this
 * once the user lands back on /auth with an active session to correct both,
 * gated to accounts that haven't finished onboarding yet so an existing,
 * active account's role can never be silently reassigned by a stale
 * `?role=` query param.
 */
export const finishOAuthSignup = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => Input.parse(i))
  .handler(async ({ data, context }): Promise<{ reconciled: boolean }> => {
    const { data: profile, error: profileErr } = await context.supabase
      .from("profiles")
      .select("role, onboarded_at")
      .eq("id", context.userId)
      .maybeSingle();
    if (profileErr) throw profileErr;
    if (!profile || profile.onboarded_at) {
      return { reconciled: false };
    }

    if (profile.role !== data.role) {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { error: updateErr } = await supabaseAdmin
        .from("profiles")
        .update({ role: data.role })
        .eq("id", context.userId);
      if (updateErr) throw updateErr;

      // user_roles is unique on (user_id, role), not user_id alone — drop the
      // stale consumer role before adding the correct one so both don't sit
      // side by side. Only ever touches senior/family/provider, never a
      // separately-held staff role.
      await supabaseAdmin
        .from("user_roles")
        .delete()
        .eq("user_id", context.userId)
        .in("role", ["senior", "family", "provider"])
        .neq("role", data.role);
      const { error: roleErr } = await supabaseAdmin
        .from("user_roles")
        .upsert({ user_id: context.userId, role: data.role }, { onConflict: "user_id,role" });
      if (roleErr) throw roleErr;
    }

    const { getRequestHeader, getRequestIP } = await import("@tanstack/start-server-core");
    const ip = getRequestIP() ?? null;
    const userAgent = getRequestHeader("user-agent") ?? null;

    for (const kind of requiredDocumentsFor(data.role)) {
      const doc = LEGAL_DOCUMENTS[kind];
      const hash = await hashLegalDocument(kind);
      const { error } = await context.supabase.from("user_legal_acceptances").insert({
        user_id: context.userId,
        kind,
        document_version: doc.version,
        document_hash: hash,
        ip_address: ip,
        user_agent: userAgent,
      });
      if (error && !String(error.message).toLowerCase().includes("duplicate")) throw error;
    }

    return { reconciled: true };
  });
