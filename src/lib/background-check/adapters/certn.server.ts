import { createHmac, timingSafeEqual } from "crypto";
import type {
  CandidateInput,
  NormalizedEvent,
  NormalizedStatus,
  OrderInput,
  PackageTier,
  VendorAdapter,
} from "../vendor";

const BASE_URL = "https://api.certn.co/v1";

function apiKey(): string {
  const k = process.env.CERTN_API_KEY;
  if (!k) throw new Error("CERTN_API_KEY is not configured. Ask an admin to add it in Settings → Secrets.");
  return k;
}

function webhookSecret(): string | null {
  return process.env.CERTN_WEBHOOK_SECRET ?? null;
}

const PACKAGE_CODES: Record<PackageTier, string> = {
  basic: "us_basic",
  basic_plus: "us_basic_plus",
  enhanced: "us_enhanced",
  enhanced_plus_mvr: "us_enhanced_mvr",
};

async function certnFetch(path: string, init: RequestInit = {}): Promise<any> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: {
      Authorization: `Token ${apiKey()}`,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Certn ${res.status}: ${body.slice(0, 500)}`);
  }
  return res.json();
}

function mapStatus(raw: string | undefined): NormalizedStatus | undefined {
  if (!raw) return undefined;
  const s = raw.toLowerCase();
  if (s.includes("clear") || s === "complete" || s === "completed") return "clear";
  if (s.includes("consider") || s.includes("review")) return "consider";
  if (s.includes("cancel")) return "canceled";
  if (s.includes("suspend")) return "suspended";
  if (s.includes("dispute")) return "dispute";
  if (s.includes("invit")) return "invitation_sent";
  if (s.includes("pending")) return "pending_vendor";
  if (s.includes("error") || s.includes("fail")) return "error";
  return "pending_vendor";
}

export const certnAdapter: VendorAdapter = {
  vendor: "certn",

  packageCodeFor(tier) {
    return PACKAGE_CODES[tier];
  },

  async createCandidate(input: CandidateInput) {
    const body = {
      email: input.email,
      first_name: input.first_name,
      middle_name: input.middle_name ?? undefined,
      last_name: input.last_name,
      date_of_birth: input.date_of_birth,
      phone_number: input.phone,
      social_security_number: input.ssn,
      addresses: [
        {
          address: input.address.line1,
          address_line_2: input.address.line2 ?? undefined,
          city: input.address.city,
          state: input.address.state,
          postal_code: input.address.postal,
          country: input.address.country,
          current: true,
        },
      ],
      drivers_license: input.drivers_license
        ? {
            number: input.drivers_license.number,
            state: input.drivers_license.state,
          }
        : undefined,
      metadata: { provider_id: input.providerId },
    };
    const json = await certnFetch("/applicants", {
      method: "POST",
      body: JSON.stringify(body),
    });
    return { candidateId: json.id ?? json.applicant_id };
  },

  async orderCheck(input: OrderInput) {
    const json = await certnFetch("/reports", {
      method: "POST",
      body: JSON.stringify({
        applicant_id: input.candidateId,
        package: input.packageCode,
      }),
    });
    return {
      reportId: json.id ?? null,
      invitationUrl: json.invitation_url ?? json.candidate_url ?? "",
      expiresAt: json.invitation_expires_at ?? null,
    };
  },

  verifyWebhookSignature(rawBody, headers) {
    const secret = webhookSecret();
    if (!secret) return false;
    const sig = headers.get("x-certn-signature") ?? headers.get("x-webhook-signature") ?? "";
    if (!sig) return false;
    const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    return a.length === b.length && timingSafeEqual(a, b);
  },

  normalizeEvent(payload) {
    const p = payload as Record<string, any>;
    const report = p.report ?? p.data ?? p;
    return {
      vendorEventId: String(p.id ?? p.event_id ?? `${report.id ?? "unknown"}-${Date.now()}`),
      eventType: String(p.type ?? p.event ?? "report.updated"),
      vendorCandidateId: report.applicant_id ?? null,
      vendorReportId: report.id ?? null,
      status: mapStatus(report.status ?? p.status),
      costCents: typeof report.price_cents === "number" ? report.price_cents : null,
    };
  },
};
