import { createHmac, timingSafeEqual } from "crypto";
import type {
  IdvAdapter,
  IdvCreateSessionInput,
  IdvCreateSessionResult,
  IdvNormalizedEvent,
  IdvStatus,
} from "../vendor";

const API = "https://api.stripe.com/v1";

function apiKey(): string {
  const k = process.env.STRIPE_SECRET_KEY;
  if (!k) throw new Error("STRIPE_SECRET_KEY is not configured. Ask an admin to add it in Settings → Secrets.");
  return k;
}

function webhookSecret(): string {
  const s = process.env.STRIPE_IDENTITY_WEBHOOK_SECRET;
  if (!s) throw new Error("STRIPE_IDENTITY_WEBHOOK_SECRET is not configured.");
  return s;
}

function formEncode(obj: Record<string, any>, prefix = ""): string {
  const parts: string[] = [];
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined || v === null) continue;
    const key = prefix ? `${prefix}[${k}]` : k;
    if (typeof v === "object" && !Array.isArray(v)) {
      parts.push(formEncode(v, key));
    } else {
      parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(v))}`);
    }
  }
  return parts.filter(Boolean).join("&");
}

async function stripeFetch(path: string, body: Record<string, any>): Promise<any> {
  const res = await fetch(`${API}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey()}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: formEncode(body),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Stripe ${res.status}: ${text.slice(0, 400)}`);
  }
  return res.json();
}

function mapStatus(raw: string | undefined): IdvStatus {
  switch (raw) {
    case "verified": return "verified";
    case "processing": return "processing";
    case "requires_input": return "requires_input";
    case "canceled": return "canceled";
    default: return "processing";
  }
}

// Verify Stripe signature (t=...,v1=...) per Stripe webhook docs.
function verifyStripeSig(rawBody: string, sigHeader: string, secret: string, toleranceSec = 300): boolean {
  const parts = Object.fromEntries(
    sigHeader.split(",").map((kv) => {
      const i = kv.indexOf("=");
      return [kv.slice(0, i).trim(), kv.slice(i + 1).trim()];
    }),
  );
  const t = parts.t;
  const v1 = parts.v1;
  if (!t || !v1) return false;
  const signedPayload = `${t}.${rawBody}`;
  const expected = createHmac("sha256", secret).update(signedPayload).digest("hex");
  const a = Buffer.from(v1);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return false;
  const age = Math.abs(Math.floor(Date.now() / 1000) - Number(t));
  return age <= toleranceSec;
}

export const stripeIdentityAdapter: IdvAdapter = {
  vendor: "stripe_identity",

  async createSession(input: IdvCreateSessionInput): Promise<IdvCreateSessionResult> {
    const body: Record<string, any> = {
      type: "document",
      "provided_details[email]": input.email,
      "metadata[provider_id]": input.providerId,
      "options[document][require_matching_selfie]": "true",
      "options[document][require_live_capture]": "true",
      "options[document][require_id_number]": "false",
      return_url: input.returnUrl,
    };
    // Send as x-www-form-urlencoded manually (already encoded keys with brackets).
    const res = await fetch(`${API}/identity/verification_sessions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey()}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: Object.entries(body)
        .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
        .join("&"),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`Stripe ${res.status}: ${text.slice(0, 400)}`);
    }
    const json = await res.json();
    return {
      vendorSessionId: json.id,
      clientSecret: json.client_secret ?? null,
      hostedUrl: json.url,
    };
  },

  verifyWebhookSignature(rawBody, headers) {
    const sig = headers.get("stripe-signature") ?? "";
    if (!sig) return false;
    try {
      return verifyStripeSig(rawBody, sig, webhookSecret());
    } catch {
      return false;
    }
  },

  parseEvent(rawBody): IdvNormalizedEvent | null {
    let evt: any;
    try {
      evt = JSON.parse(rawBody);
    } catch {
      return null;
    }
    const type = evt.type as string | undefined;
    if (!type || !type.startsWith("identity.verification_session.")) return null;
    const obj = evt.data?.object ?? {};
    const sessionId = obj.id;
    if (!sessionId) return null;

    let status: IdvStatus = mapStatus(obj.status);
    if (type.endsWith(".verified")) status = "verified";
    if (type.endsWith(".canceled")) status = "canceled";
    if (type.endsWith(".requires_input")) status = "requires_input";
    if (type.endsWith(".processing")) status = "processing";

    let errorMessage: string | null = null;
    const err = obj.last_error;
    if (err && (err.reason || err.code)) {
      errorMessage = err.reason ?? err.code;
    }

    return {
      vendorSessionId: sessionId,
      status,
      vendorReportId: obj.last_verification_report ?? null,
      errorMessage,
    };
  },
};
