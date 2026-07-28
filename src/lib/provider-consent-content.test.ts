import { describe, expect, it } from "vitest";
import { CONSENT_DOCS, findConsentDoc, requiredConsents } from "./provider-consent-content";

describe("requiredConsents", () => {
  const baseRequiredKinds = CONSENT_DOCS.filter((d) => d.required && !d.state && !d.onlyIf).map(
    (d) => d.kind,
  );

  it("always includes the FCRA-baseline documents regardless of state", () => {
    const kinds = requiredConsents(null, false).map((d) => d.kind);
    for (const kind of baseRequiredKinds) {
      expect(kinds).toContain(kind);
    }
  });

  it("does not require the MVR authorization for a non-driver", () => {
    const kinds = requiredConsents("CA", false).map((d) => d.kind);
    expect(kinds).not.toContain("mvr_authorization");
  });

  it("requires the MVR authorization for a driver", () => {
    const kinds = requiredConsents("CA", true).map((d) => d.kind);
    expect(kinds).toContain("mvr_authorization");
  });

  it("includes the California state addendum only for a CA caregiver", () => {
    expect(requiredConsents("CA", false).map((d) => d.kind)).toContain("state_addendum_ca");
    expect(requiredConsents("TX", false).map((d) => d.kind)).not.toContain("state_addendum_ca");
  });

  it("matches state case-insensitively", () => {
    const kinds = requiredConsents("ca", false).map((d) => d.kind);
    expect(kinds).toContain("state_addendum_ca");
  });

  it("returns no state addendum for a state with none defined", () => {
    const kinds = requiredConsents("TX", false).map((d) => d.kind);
    const stateAddenda = kinds.filter((k) => k.startsWith("state_addendum_"));
    expect(stateAddenda).toHaveLength(0);
  });

  it("never omits a required, non-conditional document for any state/driver combination", () => {
    for (const state of ["CA", "NY", "WA", "MA", "NJ", "MN", "TX", null]) {
      for (const isDriver of [true, false]) {
        const kinds = requiredConsents(state, isDriver).map((d) => d.kind);
        for (const kind of baseRequiredKinds) {
          expect(kinds).toContain(kind);
        }
      }
    }
  });
});

describe("findConsentDoc", () => {
  it("finds a doc by exact kind + version", () => {
    const doc = findConsentDoc("fcra_disclosure", "2024-01");
    expect(doc).toBeDefined();
    expect(doc?.kind).toBe("fcra_disclosure");
  });

  it("returns undefined for a version that was never published", () => {
    expect(findConsentDoc("fcra_disclosure", "1999-01")).toBeUndefined();
  });
});
