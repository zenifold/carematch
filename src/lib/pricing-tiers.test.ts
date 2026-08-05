import { describe, expect, it } from "vitest";
import {
  ASSISTED_LIVING_MONTHLY,
  TIERS,
  WEEKS_PER_MONTH,
  boundRate,
  breakEvenHoursPerWeek,
  estimateMonthly,
  midRate,
  tierByKey,
} from "./pricing-tiers";

describe("TIERS", () => {
  it("has coherent rate bands", () => {
    for (const t of TIERS) {
      expect(t.providerLow).toBeGreaterThan(0);
      expect(t.providerHigh).toBeGreaterThan(t.providerLow);
    }
  });

  it("keeps fees within the 15-18% the marketing copy claims", () => {
    for (const t of TIERS) {
      expect(t.feePct).toBeGreaterThanOrEqual(15);
      expect(t.feePct).toBeLessThanOrEqual(18);
    }
  });

  it("uses unique keys", () => {
    expect(new Set(TIERS.map((t) => t.key)).size).toBe(TIERS.length);
  });
});

describe("tierByKey", () => {
  it("finds a tier", () => {
    expect(tierByKey("nursing").name).toBe("Skilled nursing");
  });

  it("throws on an unknown key rather than returning undefined", () => {
    expect(() => tierByKey("massage")).toThrow(/Unknown service tier/);
  });
});

describe("estimateMonthly", () => {
  const companionship = tierByKey("companionship");

  it("carries weekly hours to a month at 52/12, not 4", () => {
    const { monthlyHours } = estimateMonthly(companionship, 20, 24);
    expect(monthlyHours).toBeCloseTo(86.667, 2);
    // The naive "4 weeks" answer would be 80 — a month of visits short per year.
    expect(monthlyHours).not.toBe(80);
  });

  it("applies the tier fee on top of the provider's cost", () => {
    const e = estimateMonthly(companionship, 10, 20);
    expect(e.providerCost).toBeCloseTo(20 * 10 * WEEKS_PER_MONTH, 6);
    expect(e.serviceFee).toBeCloseTo(e.providerCost * 0.18, 6);
    expect(e.total).toBeCloseTo(e.providerCost + e.serviceFee, 6);
  });

  it("charges skilled nursing the lower 15% fee", () => {
    const e = estimateMonthly(tierByKey("nursing"), 10, 60);
    expect(e.serviceFee).toBeCloseTo(e.providerCost * 0.15, 6);
  });

  it("scales linearly with hours", () => {
    const a = estimateMonthly(companionship, 10, 25);
    const b = estimateMonthly(companionship, 20, 25);
    expect(b.total).toBeCloseTo(a.total * 2, 6);
  });

  it("is zero at zero hours", () => {
    expect(estimateMonthly(companionship, 0, 25).total).toBe(0);
  });
});

describe("boundRate", () => {
  const t = tierByKey("companionship"); // 18-30

  it("clamps below and above the band", () => {
    expect(boundRate(t, 5)).toBe(18);
    expect(boundRate(t, 999)).toBe(30);
  });

  it("leaves an in-band rate alone", () => {
    expect(boundRate(t, 24)).toBe(24);
  });
});

describe("midRate", () => {
  it("returns the band midpoint, within the band", () => {
    for (const t of TIERS) {
      const mid = midRate(t);
      expect(mid).toBeGreaterThanOrEqual(t.providerLow);
      expect(mid).toBeLessThanOrEqual(t.providerHigh);
    }
  });
});

describe("breakEvenHoursPerWeek", () => {
  it("lands near the ~40 hrs/week the article claims, at a mid companionship rate", () => {
    const hours = breakEvenHoursPerWeek(tierByKey("companionship"), 24);
    expect(hours).toBeGreaterThan(35);
    expect(hours).toBeLessThan(50);
  });

  it("is the point where monthly cost meets assisted living", () => {
    const t = tierByKey("companionship");
    const hours = breakEvenHoursPerWeek(t, 24);
    expect(estimateMonthly(t, hours, 24).total).toBeCloseTo(ASSISTED_LIVING_MONTHLY, 4);
  });

  it("falls as the rate rises", () => {
    const t = tierByKey("personal");
    expect(breakEvenHoursPerWeek(t, 50)).toBeLessThan(breakEvenHoursPerWeek(t, 28));
  });
});
