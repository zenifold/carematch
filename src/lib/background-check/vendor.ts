// Shared types for background check vendor adapters.
// This file is client-safe (no vendor SDKs, no secrets). Adapter
// implementations live in *.server.ts files.

export type VendorId = "certn" | "checkr" | "yardstik" | "goodhire";

export type PackageTier =
  | "basic"
  | "basic_plus"
  | "enhanced"
  | "enhanced_plus_mvr";

export type NormalizedStatus =
  | "created"
  | "invitation_sent"
  | "pending_candidate_info"
  | "pending_vendor"
  | "clear"
  | "consider"
  | "suspended"
  | "dispute"
  | "canceled"
  | "error";

export type CandidateInput = {
  providerId: string;
  first_name: string;
  middle_name?: string | null;
  last_name: string;
  date_of_birth: string; // YYYY-MM-DD
  ssn: string; // full digits, never persisted after adapter call
  email: string;
  phone: string;
  address: {
    line1: string;
    line2?: string | null;
    city: string;
    state: string;
    postal: string;
    country: string;
  };
  drivers_license?: {
    number: string;
    state: string;
  } | null;
};

export type OrderInput = {
  candidateId: string;
  tier: PackageTier;
  packageCode: string; // vendor-specific
};

export type NormalizedEvent = {
  vendorCandidateId?: string | null;
  vendorReportId?: string | null;
  status?: NormalizedStatus;
  costCents?: number | null;
  vendorEventId: string;
  eventType: string;
};

export type VendorAdapter = {
  vendor: VendorId;
  packageCodeFor(tier: PackageTier): string;
  createCandidate(input: CandidateInput): Promise<{ candidateId: string }>;
  orderCheck(
    input: OrderInput,
  ): Promise<{ reportId?: string | null; invitationUrl: string; expiresAt: string | null }>;
  verifyWebhookSignature(rawBody: string, headers: Headers): boolean;
  normalizeEvent(payload: unknown): NormalizedEvent;
};

export function getActiveVendor(): VendorId {
  const v = (process.env.BACKGROUND_CHECK_VENDOR ?? "certn").toLowerCase();
  if (v === "certn" || v === "checkr" || v === "yardstik" || v === "goodhire") {
    return v;
  }
  return "certn";
}
