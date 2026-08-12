import { renderTemplate } from "./templates";

/**
 * Pluggable transactional email — same shape as the background-check /
 * IDV vendor adapters (env var picks the provider, no vendor SDK at module
 * scope). Defaults to a safe no-op until EMAIL_PROVIDER + a provider API
 * key are configured, so callers see "not configured yet" rather than a
 * crash or a silently-dropped send.
 *
 * To go live: set EMAIL_PROVIDER=resend, RESEND_API_KEY, and
 * EMAIL_FROM_ADDRESS (must be a verified sender/domain in Resend).
 */

export type SendTemplateEmailOptions = {
  templateData: Record<string, unknown>;
  idempotencyKey: string;
};

export type SendTemplateEmailResult = { sent: boolean; reason?: string };

/**
 * Domains reserved by RFC 2606 and RFC 6761. Nothing here can ever receive mail.
 *
 * The demo and integration accounts live on `companioncare.test` precisely because
 * of that guarantee, which means every send aimed at one is certain to fail. Worth
 * catching before the provider rather than after: a rejected send comes back as a
 * generic provider error, and callers that retry on provider errors — correctly,
 * for transient ones — then retry forever against an address that will never work.
 * The hourly visit-reminder sweep did exactly that.
 */
const UNROUTABLE_TLDS = [".test", ".example", ".invalid", ".localhost"];
const UNROUTABLE_DOMAINS = ["example.com", "example.net", "example.org"];

/** Whether an address is guaranteed undeliverable, so sending is pointless. */
export function isUnroutableAddress(to: string): boolean {
  const at = to.lastIndexOf("@");
  if (at < 0) return false;
  const domain = to
    .slice(at + 1)
    .trim()
    .toLowerCase()
    .replace(/\.$/, "");
  if (!domain) return false;
  if (UNROUTABLE_DOMAINS.includes(domain)) return true;
  // Subdomains count: a reserved TLD is reserved at every depth.
  return UNROUTABLE_TLDS.some((tld) => domain === tld.slice(1) || domain.endsWith(tld));
}

/**
 * Reason returned for a reserved-domain recipient. Callers should treat this as
 * terminal — the same way they treat `no_provider_configured` — and not retry.
 */
export const UNROUTABLE_REASON = "unroutable_recipient";

async function sendViaResend(
  to: string,
  subject: string,
  html: string,
  text: string,
  idempotencyKey: string,
): Promise<SendTemplateEmailResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM_ADDRESS;
  if (!apiKey || !from) return { sent: false, reason: "no_provider_configured" };

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "Idempotency-Key": idempotencyKey,
    },
    body: JSON.stringify({ from, to, subject, html, text }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    return { sent: false, reason: `resend_error_${res.status}: ${body.slice(0, 200)}` };
  }
  return { sent: true };
}

export async function sendTemplateEmail(
  templateCode: string,
  to: string,
  opts: SendTemplateEmailOptions,
): Promise<SendTemplateEmailResult> {
  const rendered = renderTemplate(templateCode, opts.templateData);
  if (!rendered) return { sent: false, reason: `unknown_template:${templateCode}` };

  // Before the provider: a reserved domain can never accept mail, and a failed
  // send is indistinguishable from a transient one to a retrying caller.
  if (isUnroutableAddress(to)) return { sent: false, reason: UNROUTABLE_REASON };

  const provider = process.env.EMAIL_PROVIDER ?? "none";
  if (provider === "resend") {
    return sendViaResend(to, rendered.subject, rendered.html, rendered.text, opts.idempotencyKey);
  }
  return { sent: false, reason: "no_provider_configured" };
}
