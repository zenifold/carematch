import { describe, expect, it } from "vitest";
import { createHmac } from "crypto";

import {
  BODY_PREVIEW_LIMIT,
  SIGNATURE_TOLERANCE_SECONDS,
  buildIncidentEvent,
  buildTicketEvent,
  isTimestampFresh,
  isUrgentIncident,
  parseSignatureHeader,
  severityLabel,
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

const incidentBase = {
  id: "55555555-5555-4555-8555-555555555555",
  category: "quality",
  severity: 2,
  summary: "Helper arrived 40 minutes late and did not finish the agreed tasks.",
  reporterId: "66666666-6666-4666-8666-666666666666",
  subjectUserId: "77777777-7777-4777-8777-777777777777",
  bookingId: "88888888-8888-4888-8888-888888888888",
  createdAt: "2026-08-12T15:00:00.000Z",
  siteOrigin: "https://getcompanioncare.com",
};

describe("severityLabel", () => {
  it("labels the 1-4 range incidents.functions.ts enforces", () => {
    expect(severityLabel(1)).toBe("low");
    expect(severityLabel(2)).toBe("normal");
    expect(severityLabel(3)).toBe("high");
    expect(severityLabel(4)).toBe("critical");
  });

  it("does not pretend to know about out-of-range values", () => {
    expect(severityLabel(0)).toBe("unknown");
    expect(severityLabel(9)).toBe("unknown");
  });
});

describe("isUrgentIncident", () => {
  it("treats harm categories as urgent at any severity", () => {
    for (const c of ["safety", "abuse", "theft"]) {
      expect(isUrgentIncident(c, 1)).toBe(true);
    }
  });

  it("treats high severity as urgent regardless of category", () => {
    expect(isUrgentIncident("billing", 3)).toBe(true);
    expect(isUrgentIncident("billing", 4)).toBe(true);
  });

  it("leaves routine low-severity reports unflagged", () => {
    expect(isUrgentIncident("quality", 1)).toBe(false);
    expect(isUrgentIncident("no_show", 2)).toBe(false);
    expect(isUrgentIncident("billing", 2)).toBe(false);
  });
});

describe("buildIncidentEvent", () => {
  it("carries what a channel needs to triage at a glance", () => {
    const e = buildIncidentEvent(incidentBase);
    expect(e.event).toBe("incident.created");
    expect(e.id).toBe(incidentBase.id);
    expect(e.category).toBe("quality");
    expect(e.severity).toBe(2);
    expect(e.severity_label).toBe("normal");
    expect(e.status).toBe("open");
    expect(e.booking_id).toBe(incidentBase.bookingId);
    expect(e.admin_url).toBe("https://getcompanioncare.com/admin/trust-safety");
  });

  it("carries NO names — an allegation must not be searchable in a chat log", () => {
    const e = buildIncidentEvent({
      ...incidentBase,
      category: "abuse",
      summary: "Concern about how Andrea Rivera spoke to my mother.",
    });
    const serialised = JSON.stringify(e);
    // The summary preview is the one place a name could legitimately appear,
    // because it is the reporter's own words. Everything else is ids only.
    expect(e).not.toHaveProperty("reporter_name");
    expect(e).not.toHaveProperty("subject_user_name");
    expect(serialised).not.toContain("@");
    expect(e.reporter_id).toBe(incidentBase.reporterId);
    expect(e.subject_user_id).toBe(incidentBase.subjectUserId);
  });

  it("flags urgent so the receiver does not re-derive the routing rule", () => {
    expect(buildIncidentEvent({ ...incidentBase, category: "abuse" }).urgent).toBe(true);
    expect(buildIncidentEvent({ ...incidentBase, severity: 4 }).urgent).toBe(true);
    expect(buildIncidentEvent(incidentBase).urgent).toBe(false);
  });

  it("truncates a long summary the same way ticket bodies are truncated", () => {
    const long = "y".repeat(BODY_PREVIEW_LIMIT + 100);
    const e = buildIncidentEvent({ ...incidentBase, summary: long });
    expect(e.summary_truncated).toBe(true);
    expect(e.summary_preview).toBe(`${"y".repeat(BODY_PREVIEW_LIMIT)}…`);
  });

  it("normalises absent subject and booking to null rather than undefined", () => {
    const e = buildIncidentEvent({ ...incidentBase, subjectUserId: null, bookingId: null });
    expect(e.subject_user_id).toBeNull();
    expect(e.booking_id).toBeNull();
    // undefined would vanish from JSON and the receiver could not tell the
    // difference between "absent" and "field removed".
    expect(JSON.parse(JSON.stringify(e))).toHaveProperty("subject_user_id", null);
  });

  it("defaults status to open", () => {
    expect(buildIncidentEvent(incidentBase).status).toBe("open");
    expect(buildIncidentEvent({ ...incidentBase, status: "triaged" }).status).toBe("triaged");
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
