import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  LEGAL_DOCUMENTS,
  hashLegalDocument,
  requiredDocumentsFor,
  type LegalDocumentKind,
} from "@/lib/legal";

const KIND_SCHEMA = z.enum([
  "terms_of_service",
  "privacy_policy",
  "independent_contractor_agreement",
]);

export type LegalDocumentSummary = {
  kind: LegalDocumentKind;
  title: string;
  version: string;
  effective_date: string;
};

const RequiredInput = z.object({
  role: z.enum(["senior", "family", "provider"]),
});

/** Which documents + versions a given signup role must accept right now —
 * the signup form asks for exactly these, nothing hardcoded client-side, so
 * bumping a document's version here automatically requires re-acceptance. */
export const getRequiredLegalDocuments = createServerFn({ method: "GET" })
  .inputValidator((i: unknown) => RequiredInput.parse(i))
  .handler(async ({ data }): Promise<LegalDocumentSummary[]> => {
    return requiredDocumentsFor(data.role).map((kind) => ({
      kind,
      title: LEGAL_DOCUMENTS[kind].title,
      version: LEGAL_DOCUMENTS[kind].version,
      effective_date: LEGAL_DOCUMENTS[kind].effective_date,
    }));
  });

const AcceptInput = z.object({
  acceptances: z
    .array(
      z.object({
        kind: KIND_SCHEMA,
        version: z.string(),
      }),
    )
    .min(1),
});

/**
 * Records that the signed-in user accepted specific versions of specific
 * legal documents. Server computes the hash of its own current copy of the
 * document text (never trusts a client-supplied hash) and rejects if the
 * client's claimed version doesn't match what's actually live, so an
 * acceptance can't be recorded against stale or tampered text.
 */
export const acceptLegalDocuments = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => AcceptInput.parse(i))
  .handler(async ({ data, context }): Promise<{ ok: true }> => {
    const { getRequestHeader, getRequestIP } = await import("@tanstack/start-server-core");
    const ip = getRequestIP() ?? null;
    const userAgent = getRequestHeader("user-agent") ?? null;

    for (const a of data.acceptances) {
      const doc = LEGAL_DOCUMENTS[a.kind];
      if (a.version !== doc.version) {
        throw new Error(
          `${doc.title} has been updated since you loaded this page — please refresh and review the current version.`,
        );
      }
      const hash = await hashLegalDocument(a.kind);
      const { error } = await context.supabase.from("user_legal_acceptances").insert({
        user_id: context.userId,
        kind: a.kind,
        document_version: a.version,
        document_hash: hash,
        ip_address: ip,
        user_agent: userAgent,
      });
      // Unique violation = already accepted this exact version — fine, not an error.
      if (error && !String(error.message).toLowerCase().includes("duplicate")) throw error;
    }
    return { ok: true };
  });
