import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createHmac } from "crypto";

import { isTimestampFresh, parseSignatureHeader, signingPayload } from "./support-webhook";
import { isSupportWebhookConfigured, notifyNewSupportTicket } from "./support-webhook.server";

const SECRET = "whsec_test_value";
const URL_ = "https://buzz.example.com/hooks/companioncare";

const ticket = {
  id: "33333333-3333-4333-8333-333333333333",
  subject: "Payout hasn't landed",
  body: "Two visits from last week show as posted but the transfer isn't in my account.",
  category: "payouts",
  portal: "provider",
  priority: "high",
  requesterId: "44444444-4444-4444-4444-444444444444",
  requesterName: "Andrea Rivera",
  createdAt: "2026-08-12T09:00:00.000Z",
};

let originalFetch: typeof globalThis.fetch;

beforeEach(() => {
  originalFetch = globalThis.fetch;
  process.env.SUPPORT_WEBHOOK_URL = URL_;
  process.env.SUPPORT_WEBHOOK_SECRET = SECRET;
  process.env.SITE_ORIGIN = "https://getcompanioncare.com";
});

afterEach(() => {
  globalThis.fetch = originalFetch;
  delete process.env.SUPPORT_WEBHOOK_URL;
  delete process.env.SUPPORT_WEBHOOK_SECRET;
  delete process.env.SITE_ORIGIN;
  vi.restoreAllMocks();
});

/**
 * The shape notifyNewSupportTicket actually passes to fetch. Declared rather than
 * using RequestInit so the assertions can index headers and treat body as a
 * string, which is what the receiver will parse.
 */
type CapturedInit = {
  method: string;
  headers: Record<string, string>;
  body: string;
  signal?: AbortSignal;
};

/** Captures the single outbound request without touching the network. */
function stubFetch(response: Response | Error) {
  const spy = vi.fn(async (_url: string, _init: CapturedInit) => {
    if (response instanceof Error) throw response;
    return response;
  });
  globalThis.fetch = spy as unknown as typeof globalThis.fetch;
  return spy;
}

describe("isSupportWebhookConfigured", () => {
  it("needs both the url and the secret", () => {
    expect(isSupportWebhookConfigured()).toBe(true);
    delete process.env.SUPPORT_WEBHOOK_SECRET;
    expect(isSupportWebhookConfigured()).toBe(false);
    process.env.SUPPORT_WEBHOOK_SECRET = SECRET;
    delete process.env.SUPPORT_WEBHOOK_URL;
    expect(isSupportWebhookConfigured()).toBe(false);
  });
});

describe("notifyNewSupportTicket", () => {
  it("does nothing at all when unconfigured — no request attempted", async () => {
    delete process.env.SUPPORT_WEBHOOK_URL;
    const spy = stubFetch(new Response(null, { status: 200 }));
    const result = await notifyNewSupportTicket(ticket);
    expect(result).toEqual({ delivered: false, reason: "not_configured" });
    expect(spy).not.toHaveBeenCalled();
  });

  it("posts to the configured url with a JSON body", async () => {
    const spy = stubFetch(new Response(null, { status: 204 }));
    const result = await notifyNewSupportTicket(ticket);
    expect(result).toEqual({ delivered: true, status: 204 });

    const [url, init] = spy.mock.calls[0];
    expect(url).toBe(URL_);
    expect(init.method).toBe("POST");
    expect(init.headers["content-type"]).toBe("application/json");
    expect(init.headers["x-companioncare-event"]).toBe("support_ticket.created");
    expect(init.headers["x-companioncare-delivery-id"]).toBe(ticket.id);
  });

  it("signs the timestamp and body together, verifiably by the receiver", async () => {
    const spy = stubFetch(new Response(null, { status: 200 }));
    await notifyNewSupportTicket(ticket);

    const [, init] = spy.mock.calls[0];
    const timestamp = Number(init.headers["x-companioncare-timestamp"]);
    const received = parseSignatureHeader(init.headers["x-companioncare-signature"]);
    expect(received).not.toBeNull();

    // This is exactly the check Buzz will run.
    const expected = createHmac("sha256", SECRET)
      .update(signingPayload(timestamp, init.body))
      .digest("hex");
    expect(received).toBe(expected);
    expect(isTimestampFresh(timestamp, Math.floor(Date.now() / 1000))).toBe(true);
  });

  it("produces a signature that fails against the wrong secret", async () => {
    const spy = stubFetch(new Response(null, { status: 200 }));
    await notifyNewSupportTicket(ticket);
    const [, init] = spy.mock.calls[0];
    const timestamp = Number(init.headers["x-companioncare-timestamp"]);
    const wrong = createHmac("sha256", "not-the-secret")
      .update(signingPayload(timestamp, init.body))
      .digest("hex");
    expect(parseSignatureHeader(init.headers["x-companioncare-signature"])).not.toBe(wrong);
  });

  it("sends the preview but never the full body of a long ticket", async () => {
    const long = "sensitive detail ".repeat(80);
    const spy = stubFetch(new Response(null, { status: 200 }));
    await notifyNewSupportTicket({ ...ticket, body: long });
    const [, init] = spy.mock.calls[0];
    const sent = JSON.parse(init.body);
    expect(sent.body_truncated).toBe(true);
    expect(init.body).not.toContain(long);
    expect(sent.body_preview.length).toBeLessThan(long.length);
  });

  it("reports a non-2xx as undelivered rather than throwing", async () => {
    stubFetch(new Response("nope", { status: 500 }));
    await expect(notifyNewSupportTicket(ticket)).resolves.toEqual({
      delivered: false,
      reason: "http_500",
    });
  });

  it("reports a network failure rather than throwing into the caller", async () => {
    stubFetch(new TypeError("connection refused"));
    await expect(notifyNewSupportTicket(ticket)).resolves.toEqual({
      delivered: false,
      reason: "network_error",
    });
  });

  it("reports a timeout distinctly, so a slow endpoint is diagnosable", async () => {
    const timeoutErr = Object.assign(new Error("timed out"), { name: "TimeoutError" });
    stubFetch(timeoutErr);
    await expect(notifyNewSupportTicket(ticket)).resolves.toEqual({
      delivered: false,
      reason: "timeout",
    });
  });

  it("never rejects — a ticket must not fail because a chat integration is down", async () => {
    stubFetch(new Error("catastrophe"));
    await expect(notifyNewSupportTicket(ticket)).resolves.toBeTruthy();
  });
});
