import { describe, expect, it } from "vitest";
import { createHmac } from "crypto";

import {
  BODY_PREVIEW_LIMIT,
  SIGNATURE_TOLERANCE_SECONDS,
  buildTicketEvent,
  isTimestampFresh,
  parseSignatureHeader,
  signatureHeader,
  signingPayload,
} from "./support-webhook";

const base = {
  id: "11111111-1111-4111-8111-111111111111",
  subject: "Can I be billed instead of my mother?",
  body: "Mum's card is on the account but I'd rather the visits came to me.",
  category: "billing",
  portal: "family",
  priority: "normal",
  requesterId: "22222222-2222-4222-8222-222222222222",
  requesterName: "Dana Alvarez",
  createdAt: "2026-08-12T14:00:00.000Z",
  siteOrigin: "https://getcompanioncare.com",
};

describe("buildTicketEvent", () => {
  it("carries the fields an agent needs to triage without a second call", () => {
    const e = buildTicketEvent(base);
    expect(e.event).toBe("support_ticket.created");
    expect(e.id).toBe(base.id);
    expect(e.subject).toBe(base.subject);
    expect(e.category).toBe("billing");
    expect(e.portal).toBe("family");
    expect(e.priority).toBe("normal");
    expect(e.requester).toEqual({ id: base.requesterId, name: "Dana Alvarez" });
    expect(e.created_at).toBe(base.createdAt);
  });

  it("defaults status to open, since that is the only state a new ticket has", () => {
    expect(buildTicketEvent(base).status).toBe("open");
    expect(buildTicketEvent({ ...base, status: "pending" }).status).toBe("pending");
  });

  it("passes a short body through untouched and does not claim truncation", () => {
    const e = buildTicketEvent(base);
    expect(e.body_preview).toBe(base.body);
    expect(e.body_truncated).toBe(false);
  });

  it("truncates a long body and flags it, so the receiver knows to fetch the rest", () => {
    const long = "x".repeat(BODY_PREVIEW_LIMIT + 50);
    const e = buildTicketEvent({ ...base, body: long });
    expect(e.body_truncated).toBe(true);
    expect(e.body_preview).toBe(`${"x".repeat(BODY_PREVIEW_LIMIT)}…`);
    // The guarantee that matters: the full body never leaves in the payload.
    expect(e.body_preview.length).toBeLessThan(long.length);
  });

  it("does not include the requester's email — chat logs outlive the admin queue", () => {
    const e = buildTicketEvent(base) as Record<string, unknown>;
    expect(JSON.stringify(e)).not.toContain("@");
    expect(e).not.toHaveProperty("requester_email");
  });

  it("keeps a null name null rather than inventing a placeholder", () => {
    expect(buildTicketEvent({ ...base, requesterName: null }).requester.name).toBeNull();
  });

  it("normalises a null category", () => {
    expect(buildTicketEvent({ ...base, category: null }).category).toBeNull();
  });

  it("builds a deep link without doubling the slash", () => {
    expect(buildTicketEvent(base).admin_url).toBe("https://getcompanioncare.com/admin/support");
    expect(
      buildTicketEvent({ ...base, siteOrigin: "https://getcompanioncare.com/" }).admin_url,
    ).toBe("https://getcompanioncare.com/admin/support");
  });

  it("tolerates an empty body", () => {
    const e = buildTicketEvent({ ...base, body: "" });
    expect(e.body_preview).toBe("");
    expect(e.body_truncated).toBe(false);
  });
});

describe("signing", () => {
  it("binds the timestamp into the signed string so a capture cannot be replayed", () => {
    expect(signingPayload(1786500000, '{"a":1}')).toBe('1786500000.{"a":1}');
    // Same body, different time, must produce a different signature.
    const secret = "s3cret";
    const a = createHmac("sha256", secret).update(signingPayload(1, "{}")).digest("hex");
    const b = createHmac("sha256", secret).update(signingPayload(2, "{}")).digest("hex");
    expect(a).not.toBe(b);
  });

  it("round-trips through the header format", () => {
    const digest = createHmac("sha256", "k").update("payload").digest("hex");
    expect(parseSignatureHeader(signatureHeader(digest))).toBe(digest);
  });

  it("rejects malformed or absent signature headers", () => {
    expect(parseSignatureHeader(null)).toBeNull();
    expect(parseSignatureHeader("")).toBeNull();
    expect(parseSignatureHeader("deadbeef")).toBeNull();
    expect(parseSignatureHeader("sha1=abc")).toBeNull();
    expect(parseSignatureHeader("sha256=nothex")).toBeNull();
    // Right prefix, wrong length.
    expect(parseSignatureHeader("sha256=abc123")).toBeNull();
    // Uppercase hex is not what we emit; refuse rather than normalise.
    expect(parseSignatureHeader(`sha256=${"A".repeat(64)}`)).toBeNull();
  });

  it("tolerates surrounding whitespace from header handling", () => {
    const digest = "a".repeat(64);
    expect(parseSignatureHeader(`  sha256=${digest}  `)).toBe(digest);
  });
});

describe("isTimestampFresh", () => {
  const now = 1786500000;

  it("accepts a delivery inside the window, in either direction", () => {
    expect(isTimestampFresh(now, now)).toBe(true);
    expect(isTimestampFresh(now - SIGNATURE_TOLERANCE_SECONDS + 1, now)).toBe(true);
    // Clock skew can put a sender slightly ahead.
    expect(isTimestampFresh(now + 60, now)).toBe(true);
  });

  it("rejects a delivery outside the window", () => {
    expect(isTimestampFresh(now - SIGNATURE_TOLERANCE_SECONDS - 1, now)).toBe(false);
    expect(isTimestampFresh(now + SIGNATURE_TOLERANCE_SECONDS + 1, now)).toBe(false);
  });

  it("treats the boundary as still fresh", () => {
    expect(isTimestampFresh(now - SIGNATURE_TOLERANCE_SECONDS, now)).toBe(true);
  });

  it("rejects non-finite input rather than letting NaN compare false-y", () => {
    expect(isTimestampFresh(NaN, now)).toBe(false);
    expect(isTimestampFresh(Infinity, now)).toBe(false);
  });
});
