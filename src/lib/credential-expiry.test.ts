import { describe, expect, it } from "vitest";

import {
  ALERT_THRESHOLD_DAYS,
  buildCredentialExpiryEvent,
  daysUntil,
  hasAnythingToReport,
  selectAlreadyExpired,
  selectExpiringToday,
  type CredentialRow,
} from "./credential-expiry";

const TODAY = new Date("2026-08-12T09:00:00.000Z");

function cred(over: Partial<CredentialRow> & { expires_on: string | null }): CredentialRow {
  return {
    id: `cred-${over.expires_on ?? "none"}-${over.kind ?? "background_check"}`,
    provider_id: "prov-1",
    kind: "background_check",
    status: "passed",
    ...over,
  };
}

describe("daysUntil", () => {
  it("counts whole calendar days", () => {
    expect(daysUntil("2026-08-12", TODAY)).toBe(0);
    expect(daysUntil("2026-08-13", TODAY)).toBe(1);
    expect(daysUntil("2026-09-11", TODAY)).toBe(30);
    expect(daysUntil("2026-08-11", TODAY)).toBe(-1);
  });

  it("is stable across the run hour — a DATE does not drift with the clock", () => {
    // The sweep must report the same number at 01:00 and 23:00, or a credential
    // expiring today would read 0 in the morning and -1 at night.
    for (const hour of ["00:01", "09:00", "23:59"]) {
      expect(daysUntil("2026-08-12", new Date(`2026-08-12T${hour}:00.000Z`))).toBe(0);
    }
  });

  it("handles month and year boundaries", () => {
    expect(daysUntil("2026-09-01", new Date("2026-08-31T12:00:00Z"))).toBe(1);
    expect(daysUntil("2027-01-01", new Date("2026-12-31T12:00:00Z"))).toBe(1);
  });

  it("tolerates a full timestamp in the column", () => {
    expect(daysUntil("2026-08-13T00:00:00+00:00", TODAY)).toBe(1);
  });
});

describe("selectExpiringToday", () => {
  it("fires only on a threshold day, not every day inside the window", () => {
    const rows = [30, 29, 15, 14, 8, 7, 2, 1, 0].map((d) =>
      cred({ expires_on: new Date(Date.UTC(2026, 7, 12 + d)).toISOString().slice(0, 10) }),
    );
    const got = selectExpiringToday(rows, TODAY).map((r) => r.days_until_expiry);
    expect(got).toEqual([0, 1, 7, 14, 30]);
    // The in-between days are the whole point — a warning that repeats daily for a
    // month gets muted, and then the real one is missed too.
    expect(got).not.toContain(29);
    expect(got).not.toContain(15);
  });

  it("covers every declared threshold", () => {
    for (const d of ALERT_THRESHOLD_DAYS) {
      const iso = new Date(Date.UTC(2026, 7, 12 + d)).toISOString().slice(0, 10);
      expect(selectExpiringToday([cred({ expires_on: iso })], TODAY)).toHaveLength(1);
    }
  });

  it("ignores credentials with no expiry, and statuses that need no warning", () => {
    expect(selectExpiringToday([cred({ expires_on: null })], TODAY)).toHaveLength(0);
    for (const status of ["pending", "failed", "expired"]) {
      expect(selectExpiringToday([cred({ expires_on: "2026-08-12", status })], TODAY)).toHaveLength(
        0,
      );
    }
  });

  it("excludes already-expired rows — those are reported separately", () => {
    expect(selectExpiringToday([cred({ expires_on: "2026-08-01" })], TODAY)).toHaveLength(0);
  });

  it("sorts most urgent first", () => {
    const rows = [
      cred({ expires_on: "2026-09-11", kind: "insurance" }),
      cred({ expires_on: "2026-08-12", kind: "license_check" }),
      cred({ expires_on: "2026-08-19", kind: "id_check" }),
    ];
    expect(selectExpiringToday(rows, TODAY).map((r) => r.days_until_expiry)).toEqual([0, 7, 30]);
  });
});

describe("selectAlreadyExpired", () => {
  it("finds rows still marked passed after their expiry date", () => {
    const rows = [
      cred({ expires_on: "2026-08-01" }),
      cred({ expires_on: "2026-08-11" }),
      cred({ expires_on: "2026-08-12" }),
      cred({ expires_on: "2026-08-20" }),
    ];
    const got = selectAlreadyExpired(rows, TODAY);
    expect(got.map((r) => r.days_until_expiry)).toEqual([-11, -1]);
  });

  it("does not report a row already marked expired — that one is reconciled", () => {
    expect(
      selectAlreadyExpired([cred({ expires_on: "2026-08-01", status: "expired" })], TODAY),
    ).toHaveLength(0);
  });
});

describe("buildCredentialExpiryEvent", () => {
  const nameFor = (id: string) => (id === "prov-1" ? "Andrea Rivera" : null);

  it("carries what an operator needs to chase it", () => {
    const expiring = selectExpiringToday([cred({ expires_on: "2026-08-19" })], TODAY);
    const e = buildCredentialExpiryEvent({
      runId: "run-1",
      expiring,
      alreadyExpired: [],
      nameFor,
      siteOrigin: "https://getcompanioncare.com",
    });
    expect(e.event).toBe("credential_expiry.warning");
    expect(e.expiring[0]).toMatchObject({
      provider_name: "Andrea Rivera",
      kind: "background_check",
      expires_on: "2026-08-19",
      days_until_expiry: 7,
    });
    expect(e.admin_url).toBe("https://getcompanioncare.com/admin/credentials");
  });

  it("is urgent when something has lapsed or lapses within a day, not before", () => {
    const build = (expiresOn: string) =>
      buildCredentialExpiryEvent({
        runId: "r",
        expiring: selectExpiringToday([cred({ expires_on: expiresOn })], TODAY),
        alreadyExpired: [],
        nameFor,
        siteOrigin: "https://x.test",
      });
    expect(build("2026-09-11").urgent).toBe(false); // 30 days
    expect(build("2026-08-19").urgent).toBe(false); // 7 days
    expect(build("2026-08-13").urgent).toBe(true); // tomorrow
    expect(build("2026-08-12").urgent).toBe(true); // today

    const overdue = buildCredentialExpiryEvent({
      runId: "r",
      expiring: [],
      alreadyExpired: selectAlreadyExpired([cred({ expires_on: "2026-07-01" })], TODAY),
      nameFor,
      siteOrigin: "https://x.test",
    });
    expect(overdue.urgent).toBe(true);
  });

  it("caps the overdue sample but keeps the true count", () => {
    const rows = Array.from({ length: 9 }, (_, i) =>
      cred({ expires_on: `2026-07-0${(i % 9) + 1}`, kind: `k${i}` }),
    );
    const e = buildCredentialExpiryEvent({
      runId: "r",
      expiring: [],
      alreadyExpired: selectAlreadyExpired(rows, TODAY),
      nameFor,
      siteOrigin: "https://x.test",
    });
    expect(e.already_expired_count).toBe(9);
    expect(e.already_expired_sample).toHaveLength(5);
    expect(e.already_expired_sample[0].days_overdue).toBeGreaterThan(0);
  });

  it("carries no contact details", () => {
    const e = buildCredentialExpiryEvent({
      runId: "r",
      expiring: selectExpiringToday([cred({ expires_on: "2026-08-19" })], TODAY),
      alreadyExpired: [],
      nameFor,
      siteOrigin: "https://x.test",
    });
    expect(JSON.stringify(e)).not.toContain("@");
  });

  it("knows when there is nothing worth sending", () => {
    const empty = buildCredentialExpiryEvent({
      runId: "r",
      expiring: [],
      alreadyExpired: [],
      nameFor,
      siteOrigin: "https://x.test",
    });
    expect(hasAnythingToReport(empty)).toBe(false);

    const something = buildCredentialExpiryEvent({
      runId: "r",
      expiring: selectExpiringToday([cred({ expires_on: "2026-08-19" })], TODAY),
      alreadyExpired: [],
      nameFor,
      siteOrigin: "https://x.test",
    });
    expect(hasAnythingToReport(something)).toBe(true);
  });
});
