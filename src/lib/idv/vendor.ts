// Shared types for identity verification vendor adapters (client-safe).

export type IdvVendorId = "stripe_identity" | "persona" | "veriff";

export type IdvStatus =
  | "not_started"
  | "processing"
  | "requires_input"
  | "verified"
  | "canceled"
  | "failed";

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
  const v = (process.env.IDV_VENDOR ?? "stripe_identity").toLowerCase();
  if (v === "stripe_identity" || v === "persona" || v === "veriff") return v;
  return "stripe_identity";
}
