// Shared types for identity verification vendor adapters (client-safe).

export type IdvVendorId = "stripe_identity" | "persona" | "veriff" | "manual";

export type IdvStatus =
  "not_started" | "processing" | "requires_input" | "verified" | "canceled" | "failed";

export type IdvNormalizedEvent = {
  vendorSessionId: string;
  status: IdvStatus;
  vendorReportId?: string | null;
  errorMessage?: string | null;
};

export type IdvCreateSessionInput = {
  providerId: string;
  email: string;
  fullName: string;
  returnUrl: string;
};

export type IdvCreateSessionResult = {
  vendorSessionId: string;
  clientSecret?: string | null;
  hostedUrl: string;
};

export type IdvAdapter = {
  vendor: IdvVendorId;
  createSession(input: IdvCreateSessionInput): Promise<IdvCreateSessionResult>;
  verifyWebhookSignature(rawBody: string, headers: Headers): boolean;
  parseEvent(rawBody: string): IdvNormalizedEvent | null;
};

export function getActiveIdvVendor(): IdvVendorId {
  const v = (process.env.IDV_VENDOR ?? "manual").toLowerCase();
  if (v === "stripe_identity" || v === "persona" || v === "veriff" || v === "manual") return v;
  // No vendor configured (or an unrecognized value) — fall back to manual
  // review rather than crashing on a vendor call with no API key.
  return "manual";
}
