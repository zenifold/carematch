/**
 * Outbound notification for new support tickets, so an external agent (Buzz) can
 * post them into a support channel as they arrive.
 *
 * This fires from createSupportTicket rather than from a database trigger. That
 * function is the only way a customer ticket can be created — RLS restricts
 * INSERT on support_tickets to `requester_id = auth.uid()`, so there is no other
 * path in — which makes it a complete chokepoint without needing pg_net or
 * dashboard-side webhook config.
 *
 * The signing and payload construction live here as pure functions so they can be
 * tested without network access; the delivery half is in
 * support-webhook.server.ts.
 */

/** How much of the ticket body travels in the webhook. See buildTicketEvent. */
export const BODY_PREVIEW_LIMIT = 280;

/** Reject anything older than this on the receiving end, to stop replay. */
export const SIGNATURE_TOLERANCE_SECONDS = 300;

export type SupportTicketEvent = {
  event: "support_ticket.created";
  id: string;
  subject: string;
  body_preview: string;
  body_truncated: boolean;
  category: string | null;
  portal: string;
  priority: string;
  status: string;
  requester: { id: string; name: string | null };
  created_at: string;
  admin_url: string;
};

/**
 * Builds the webhook body.
 *
 * The full ticket body is deliberately *not* included, only a preview. These
 * payloads land in chat channels and their logs, where they persist far longer
 * and are visible to more people than the admin queue; ticket bodies routinely
 * carry health details and home circumstances. An agent holding the service
 * account can fetch the complete body over the API when it actually needs it,
 * under the same RLS as a human staffer. Raise BODY_PREVIEW_LIMIT only with that
 * tradeoff in mind.
 */
export function buildTicketEvent(input: {
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
  siteOrigin: string;
}): SupportTicketEvent {
  const body = input.body ?? "";
  const truncated = body.length > BODY_PREVIEW_LIMIT;
  return {
    event: "support_ticket.created",
    id: input.id,
    subject: input.subject,
    body_preview: truncated ? `${body.slice(0, BODY_PREVIEW_LIMIT)}…` : body,
    body_truncated: truncated,
    category: input.category ?? null,
    portal: input.portal,
    priority: input.priority,
    status: input.status ?? "open",
    requester: { id: input.requesterId, name: input.requesterName ?? null },
    created_at: input.createdAt,
    // Deep link so a human can take over from the channel in one click.
    admin_url: `${input.siteOrigin.replace(/\/+$/, "")}/admin/support`,
  };
}

/**
 * The string that gets signed. Timestamp is folded in — signing the body alone
 * would let anyone who captured one delivery replay it forever.
 */
export function signingPayload(timestamp: number, body: string): string {
  return `${timestamp}.${body}`;
}

export function signatureHeader(hexDigest: string): string {
  return `sha256=${hexDigest}`;
}

/** Parses `sha256=<hex>`, returning null for anything malformed. */
export function parseSignatureHeader(header: string | null): string | null {
  if (!header) return null;
  const match = /^sha256=([0-9a-f]{64})$/.exec(header.trim());
  return match ? match[1] : null;
}

/**
 * Whether a delivery's timestamp is inside the replay window. Exported for the
 * receiving side and for tests; `now` is injectable so tests don't depend on the
 * clock.
 */
export function isTimestampFresh(
  timestamp: number,
  nowSeconds: number,
  toleranceSeconds = SIGNATURE_TOLERANCE_SECONDS,
): boolean {
  if (!Number.isFinite(timestamp)) return false;
  return Math.abs(nowSeconds - timestamp) <= toleranceSeconds;
}
