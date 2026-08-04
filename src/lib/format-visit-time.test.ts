import { describe, expect, it } from "vitest";
import {
  FALLBACK_TIME_ZONE,
  formatVisitTime,
  isValidTimeZone,
  resolveTimeZone,
} from "./format-visit-time";

// 2026-08-06T21:00:00Z is 5:00 PM in New York (EDT, UTC-4) and
// 2:00 PM in Los Angeles (PDT, UTC-7).
const SUMMER_INSTANT = "2026-08-06T21:00:00Z";
// 2026-01-15T22:00:00Z is 5:00 PM in New York (EST, UTC-5) — same wall clock
// as the summer case, which only holds if the offset shifts with DST.
const WINTER_INSTANT = "2026-01-15T22:00:00Z";

describe("formatVisitTime", () => {
  it("renders in the senior's zone, not the runtime's", () => {
    const out = formatVisitTime(SUMMER_INSTANT, "America/New_York");
    expect(out).toContain("5:00 PM");
    expect(out).toContain("EDT");
  });

  it("renders the same instant differently for a west-coast senior", () => {
    const out = formatVisitTime(SUMMER_INSTANT, "America/Los_Angeles");
    expect(out).toContain("2:00 PM");
    expect(out).toContain("PDT");
  });

  it("follows daylight saving rather than a fixed offset", () => {
    const out = formatVisitTime(WINTER_INSTANT, "America/New_York");
    expect(out).toContain("5:00 PM");
    expect(out).toContain("EST");
  });

  it("handles a zone that does not observe DST", () => {
    // Arizona stays on MST year round: 21:00Z is 2:00 PM.
    const out = formatVisitTime(SUMMER_INSTANT, "America/Phoenix");
    expect(out).toContain("2:00 PM");
    expect(out).toContain("MST");
  });

  it("always names the zone, so a fallback is visible rather than misleading", () => {
    expect(formatVisitTime(SUMMER_INSTANT, null)).toContain("EDT");
  });

  it("accepts a Date as well as an ISO string", () => {
    const out = formatVisitTime(new Date(SUMMER_INSTANT), "America/New_York");
    expect(out).toContain("5:00 PM");
  });

  it("does not depend on the ambient runtime zone", () => {
    // The bug this replaces: toLocaleString(undefined, ...) on a Worker
    // resolved to UTC, so 21:00Z rendered as 9:00 PM for everyone.
    expect(formatVisitTime(SUMMER_INSTANT, "America/New_York")).not.toContain("9:00 PM");
  });
});

describe("resolveTimeZone", () => {
  it("keeps a valid zone", () => {
    expect(resolveTimeZone("America/Chicago")).toBe("America/Chicago");
  });

  it("falls back when absent", () => {
    expect(resolveTimeZone(null)).toBe(FALLBACK_TIME_ZONE);
    expect(resolveTimeZone(undefined)).toBe(FALLBACK_TIME_ZONE);
    expect(resolveTimeZone("")).toBe(FALLBACK_TIME_ZONE);
  });

  it("falls back on junk instead of throwing", () => {
    // A RangeError here would abort the whole hourly sweep, not just this row.
    expect(resolveTimeZone("Not/AZone")).toBe(FALLBACK_TIME_ZONE);
    expect(resolveTimeZone("../../etc/passwd")).toBe(FALLBACK_TIME_ZONE);
  });
});

describe("isValidTimeZone", () => {
  it("accepts IANA names and rejects nonsense", () => {
    expect(isValidTimeZone("Europe/London")).toBe(true);
    expect(isValidTimeZone("Mars/Olympus_Mons")).toBe(false);
  });
});
