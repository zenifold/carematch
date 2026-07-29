import { TERMS_OF_SERVICE } from "./terms-of-service";
import { PRIVACY_POLICY } from "./privacy-policy";
import { INDEPENDENT_CONTRACTOR_AGREEMENT } from "./independent-contractor-agreement";

export { TERMS_OF_SERVICE, PRIVACY_POLICY, INDEPENDENT_CONTRACTOR_AGREEMENT };

export type LegalDocumentKind =
  | "terms_of_service"
  | "privacy_policy"
  | "independent_contractor_agreement";

export type LegalDocument = {
  version: string;
  effective_date: string;
  title: string;
  body: string;
};

export const LEGAL_DOCUMENTS: Record<LegalDocumentKind, LegalDocument> = {
  terms_of_service: TERMS_OF_SERVICE,
  privacy_policy: PRIVACY_POLICY,
  independent_contractor_agreement: INDEPENDENT_CONTRACTOR_AGREEMENT,
};

/** Documents every account type must accept at signup. */
export const REQUIRED_FOR_ALL: LegalDocumentKind[] = ["terms_of_service", "privacy_policy"];

/** Additional documents required for provider accounts specifically. */
export const REQUIRED_FOR_PROVIDER: LegalDocumentKind[] = ["independent_contractor_agreement"];

export function requiredDocumentsFor(role: string): LegalDocumentKind[] {
  return role === "provider"
    ? [...REQUIRED_FOR_ALL, ...REQUIRED_FOR_PROVIDER]
    : REQUIRED_FOR_ALL;
}

/** SHA-256 hex of a document's exact text at its current version — stored
 * alongside each acceptance so a later edit to the same version number would
 * be detectable, and so a real audit trail exists of what was actually shown. */
export async function hashLegalDocument(kind: LegalDocumentKind): Promise<string> {
  const doc = LEGAL_DOCUMENTS[kind];
  const enc = new TextEncoder().encode(doc.body);
  const digest = await crypto.subtle.digest("SHA-256", enc);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
