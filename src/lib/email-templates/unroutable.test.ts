import { describe, expect, it } from "vitest";

import { isUnroutableAddress } from "./send-email";

describe("isUnroutableAddress", () => {
  it("catches the reserved TLDs a send can never reach", () => {
    for (const a of [
      "demo-senior@companioncare.test",
      "someone@thing.example",
      "x@nope.invalid",
      "root@localhost",
      "root@my.localhost",
    ]) {
      expect(isUnroutableAddress(a), a).toBe(true);
    }
  });

  it("catches the reserved second-level example domains", () => {
    expect(isUnroutableAddress("a@example.com")).toBe(true);
    expect(isUnroutableAddress("a@example.net")).toBe(true);
    expect(isUnroutableAddress("a@example.org")).toBe(true);
  });

  it("treats a reserved TLD as reserved at every depth", () => {
    // The integration account lives on a subdomain, so depth matters.
    expect(isUnroutableAddress("buzz-agent@integrations.getcompanioncare.com")).toBe(false);
    expect(isUnroutableAddress("agent@integrations.companioncare.test")).toBe(true);
  });

  it("leaves real addresses alone — this must never block a customer email", () => {
    for (const a of [
      "maximilian.murphy@sourcefuse.com",
      "support@getcompanioncare.com",
      "someone@gmail.com",
      "a.b+tag@sub.domain.co.uk",
      // Contains "test" but is a real domain.
      "hello@testing.com",
      "hello@latest.io",
    ]) {
      expect(isUnroutableAddress(a), a).toBe(false);
    }
  });

  it("is case- and trailing-dot-insensitive", () => {
    expect(isUnroutableAddress("A@CompanionCare.TEST")).toBe(true);
    expect(isUnroutableAddress("a@companioncare.test.")).toBe(true);
  });

  it("does not throw on malformed input", () => {
    expect(isUnroutableAddress("no-at-sign")).toBe(false);
    expect(isUnroutableAddress("")).toBe(false);
    expect(isUnroutableAddress("trailing@")).toBe(false);
  });
});
