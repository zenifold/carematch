import { createHmac } from "crypto";

import {
  buildIncidentEvent,
  buildTicketEvent,
  signatureHeader,
  signingPayload,
  type WebhookEvent,
} from "./support-webhook";

/**
 * Delivery half of the support webhook. Server-only: it reads secrets and uses
 * node:crypto (available because wrangler.toml sets nodejs_compat).
 *
 * Carries two event types to one endpoint — support tickets and trust-and-safety
 * incidents — so the receiving channel sees everything. They are distinguishable
 * by the `event` field and the x-companioncare-event header.
 */

/** Single attempt, tight timeout. See notifyNewSupportTicket for why. */
const DELIVERY_TIMEOUT_MS = 3000;

export type DeliveryResult =
  { delivered: true; status: number } | { delivered: false; reason: string };

function siteOrigin(): string {
  return process.env.SITE_ORIGIN ?? "https://getcompanioncare.com";
}

export function isSupportWebhookConfigured(): boolean {
  return !!process.env.SUPPORT_WEBHOOK_URL && !!process.env.SUPPORT_WEBHOOK_SECRET;
}

/**
 * Signs and posts one event.
 *
 * Best-effort by design, matching the confirmation email alongside it: neither a
 * ticket nor an incident report must ever fail because a downstream chat
 * integration is down. One attempt with a 3s timeout, because this runs inline in
 * the request that creates the row and a hanging endpoint would otherwise be felt
 * by the person filing it.
 *
 * The cost is that a dropped delivery is a missed channel post. It is not a lost
 * record — the row is committed before this runs and stays in the admin queue, and
 * an agent can reconcile by listing. If guaranteed delivery becomes a requirement,
 * that wants an outbox table drained by the existing hourly task, not retries here.
 */
async function deliver(event: WebhookEvent & { urgent?: boolean }): Promise<DeliveryResult> {
  const url = process.env.SUPPORT_WEBHOOK_URL;
  const secret = process.env.SUPPORT_WEBHOOK_SECRET;
  if (!url || !secret) return { delivered: false, reason: "not_configured" };

  const body = JSON.stringify(event);
  const timestamp = Math.floor(Date.now() / 1000);
  const digest = createHmac("sha256", secret).update(signingPayload(timestamp, body)).digest("hex");

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-companioncare-event": event.event,
        "x-companioncare-timestamp": String(timestamp),
        "x-companioncare-signature": signatureHeader(digest),
        // Lets the receiver drop duplicates if we ever do add retries.
        "x-companioncare-delivery-id": event.id,
      },
      body,
      signal: AbortSignal.timeout(DELIVERY_TIMEOUT_MS),
    });
    if (!res.ok) {
      return { delivered: false, reason: `http_${res.status}` };
    }
    return { delivered: true, status: res.status };
  } catch (err) {
    // AbortSignal.timeout rejects with a DOMException named TimeoutError; keep the
    // two apart so a slow endpoint is distinguishable from an unreachable one.
    const name = err instanceof Error ? err.name : "";
    return { delivered: false, reason: name === "TimeoutError" ? "timeout" : "network_error" };
  }
}

export async function notifyNewSupportTicket(input: {
  id: string;
  subject: string;
  body: string;
  category: string | null;
  portal: string;
  priority: string;
  status?: string;
  requesterId: string;
  requesterName: string | null;
  createdAt: string;
}): Promise<DeliveryResult> {
  if (!isSupportWebhookConfigured()) return { delivered: false, reason: "not_configured" };
  return deliver(buildTicketEvent({ ...input, siteOrigin: siteOrigin() }));
}

/**
 * Trust-and-safety incidents go to the same endpoint as tickets, because the team
 * wants one channel that sees everything. The payload deliberately carries no
 * names — see buildIncidentEvent.
 */
export async function notifyNewIncident(input: {
  id: string;
  category: string;
  severity: number;
  status?: string;
  summary: string;
  reporterId: string;
  subjectUserId: string | null;
  bookingId: string | null;
  createdAt: string;
}): Promise<DeliveryResult> {
  if (!isSupportWebhookConfigured()) return { delivered: false, reason: "not_configured" };
  return deliver(buildIncidentEvent({ ...input, siteOrigin: siteOrigin() }));
}
