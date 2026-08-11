import { describe, expect, it } from "vitest";
import {
  buildPreviewCookie,
  decideGate,
  isComingSoonEnabled,
  PREVIEW_COOKIE,
  type GateInput,
} from "./coming-soon-gate";

const TOKEN = "s3cret-preview-token";

function gate(overrides: Partial<GateInput> = {}) {
  return decideGate({
    pathname: "/",
    search: "",
    cookieHeader: null,
    token: TOKEN,
    enabled: true,
    ...overrides,
  });
}

describe("isComingSoonEnabled", () => {
  it("is opt-in, so an absent or off-ish value leaves the site open", () => {
    expect(isComingSoonEnabled("1")).toBe(true);
    for (const value of [undefined, "", "0", "true", "yes", "on", " 1"]) {
      expect(isComingSoonEnabled(value)).toBe(false);
    }
  });
});

describe("decideGate — master switch", () => {
  it("allows everything when disabled, however hostile the rest of the input", () => {
    expect(
      decideGate({
        pathname: "/pricing",
        search: "?preview=wrong",
        cookieHeader: "cc_preview=nonsense",
        token: undefined,
        enabled: false,
      }),
    ).toEqual({ kind: "allow" });
  });
});

describe("decideGate — gated marketing routes", () => {
  const gated = [
    "/",
    "/pricing",
    "/about",
    "/contact",
    "/faq",
    "/how-it-works",
    "/trust",
    "/for-families",
    "/for-caregivers",
    "/services",
    "/services/errands",
    "/legal",
    "/legal/provider-agreement",
    "/legal/state-availability",
    "/resources",
    "/resources/caregiver-burnout",
  ];
  for (const pathname of gated) {
    it(`gates ${pathname}`, () => {
      expect(gate({ pathname })).toEqual({ kind: "gate" });
    });
  }

  // Regression: a plain startsWith("/senior") allowlist match would let these
  // two public routes straight through the gate.
  it("gates /senior-care despite sharing a prefix with the /senior portal", () => {
    expect(gate({ pathname: "/senior-care" })).toEqual({ kind: "gate" });
    expect(gate({ pathname: "/senior-care/tx" })).toEqual({ kind: "gate" });
  });

  it("gates unknown paths and path-shape variants by default", () => {
    expect(gate({ pathname: "/nonsense" })).toEqual({ kind: "gate" });
    expect(gate({ pathname: "/pricing/" })).toEqual({ kind: "gate" });
    expect(gate({ pathname: "//pricing" })).toEqual({ kind: "gate" });
    expect(gate({ pathname: "/%70ricing" })).toEqual({ kind: "gate" });
    expect(gate({ pathname: "/PRICING" })).toEqual({ kind: "gate" });
  });
});

describe("decideGate — allowlisted paths", () => {
  const allowed = [
    "/coming-soon",
    // The coming-soon page collects PII and links to these two.
    "/legal/privacy",
    "/legal/terms",
    "/robots.txt",
    "/llms.txt",
    "/favicon.png",
    // The team's password entrance, and the POST it submits to.
    "/employee",
    "/auth",
    "/senior",
    "/senior/visits",
    "/family/budget",
    "/provider/schedule",
    "/admin/users",
    "/dashboard",
    "/onboarding/senior",
    "/api/public/hooks/stripe",
    "/api/public/training-postback",
  ];
  for (const pathname of allowed) {
    it(`allows ${pathname}`, () => {
      expect(gate({ pathname })).toEqual({ kind: "allow" });
    });
  }

  it("allows server functions with no cookie — anonymous visitors submit forms", () => {
    expect(gate({ pathname: "/_serverFn/submitWaitlistSignup" })).toEqual({ kind: "allow" });
  });

  it("404s the sitemap rather than redirecting an XML endpoint to HTML", () => {
    expect(gate({ pathname: "/api/sitemap.xml" })).toEqual({ kind: "block" });
  });
});

describe("decideGate — preview grant", () => {
  it("grants on a correct token and strips it from the URL", () => {
    expect(gate({ pathname: "/pricing", search: `?preview=${TOKEN}` })).toEqual({
      kind: "grant",
      location: "/pricing",
    });
  });

  it("keeps other query params when stripping the token", () => {
    expect(gate({ pathname: "/pricing", search: `?utm_source=slack&preview=${TOKEN}` })).toEqual({
      kind: "grant",
      location: "/pricing?utm_source=slack",
    });
  });

  it("tolerates a search string with no leading question mark", () => {
    expect(gate({ pathname: "/pricing", search: `preview=${TOKEN}` })).toEqual({
      kind: "grant",
      location: "/pricing",
    });
  });

  it("grants from an already-allowlisted path too", () => {
    expect(gate({ pathname: "/auth", search: `?preview=${TOKEN}` })).toEqual({
      kind: "grant",
      location: "/auth",
    });
  });

  it("gates a wrong token without issuing a cookie", () => {
    expect(gate({ pathname: "/pricing", search: "?preview=wrong" })).toEqual({ kind: "gate" });
  });

  // The bypass that matters: if an unset token compared equal to an empty
  // ?preview=, a misconfigured deploy would unlock the whole site.
  it("never grants on a blank or missing configured token", () => {
    expect(gate({ pathname: "/pricing", search: "?preview=", token: undefined })).toEqual({
      kind: "gate",
    });
    expect(gate({ pathname: "/pricing", search: "?preview=", token: "" })).toEqual({
      kind: "gate",
    });
    expect(gate({ pathname: "/pricing", search: "?preview", token: undefined })).toEqual({
      kind: "gate",
    });
  });

  it("fails closed when enabled without a token", () => {
    expect(gate({ pathname: "/pricing", token: undefined })).toEqual({ kind: "gate" });
    // …but the team can still reach the portals, so a misconfiguration can't
    // lock anyone out of the app itself.
    expect(gate({ pathname: "/auth", token: undefined })).toEqual({ kind: "allow" });
  });
});

describe("decideGate — preview cookie", () => {
  it("allows a gated path when the cookie carries the token", () => {
    expect(gate({ pathname: "/pricing", cookieHeader: `${PREVIEW_COOKIE}=${TOKEN}` })).toEqual({
      kind: "allow",
    });
  });

  it("finds the cookie among others", () => {
    expect(
      gate({ pathname: "/pricing", cookieHeader: `a=1; ${PREVIEW_COOKIE}=${TOKEN}; b=2` }),
    ).toEqual({ kind: "allow" });
  });

  it("scans past a planted decoy rather than stopping at the first match", () => {
    expect(
      gate({
        pathname: "/pricing",
        cookieHeader: `${PREVIEW_COOKIE}=junk; ${PREVIEW_COOKIE}=${TOKEN}`,
      }),
    ).toEqual({ kind: "allow" });
  });

  it("tolerates whitespace around the name and value", () => {
    expect(gate({ pathname: "/pricing", cookieHeader: ` ${PREVIEW_COOKIE} = ${TOKEN} ` })).toEqual({
      kind: "allow",
    });
  });

  it("decodes a percent-encoded value", () => {
    expect(
      gate({
        pathname: "/pricing",
        cookieHeader: `${PREVIEW_COOKIE}=${encodeURIComponent("tok en;x")}`,
        token: "tok en;x",
      }),
    ).toEqual({ kind: "allow" });
  });

  it("refuses names that merely contain the cookie name", () => {
    expect(gate({ pathname: "/pricing", cookieHeader: `x${PREVIEW_COOKIE}=${TOKEN}` })).toEqual({
      kind: "gate",
    });
    expect(gate({ pathname: "/pricing", cookieHeader: `${PREVIEW_COOKIE}x=${TOKEN}` })).toEqual({
      kind: "gate",
    });
  });

  it("refuses a stale cookie once the token is rotated", () => {
    expect(
      gate({ pathname: "/pricing", cookieHeader: `${PREVIEW_COOKIE}=${TOKEN}`, token: "rotated" }),
    ).toEqual({ kind: "gate" });
  });

  it("ignores malformed cookie segments", () => {
    expect(gate({ pathname: "/pricing", cookieHeader: "novalue; =orphan; ;" })).toEqual({
      kind: "gate",
    });
  });
});

describe("buildPreviewCookie", () => {
  it("sets the flags the gate depends on", () => {
    const cookie = buildPreviewCookie(TOKEN, { secure: false });
    expect(cookie).toContain(`${PREVIEW_COOKIE}=${TOKEN}`);
    expect(cookie).toContain("Path=/");
    expect(cookie).toContain("HttpOnly");
    expect(cookie).toContain("SameSite=Lax");
    expect(cookie).toContain("Max-Age=2592000");
  });

  it("adds Secure only over https, so http dev origins still work", () => {
    expect(buildPreviewCookie(TOKEN, { secure: false })).not.toContain("Secure");
    expect(buildPreviewCookie(TOKEN, { secure: true })).toContain("Secure");
  });

  it("encodes values that would otherwise break the header", () => {
    const cookie = buildPreviewCookie("tok en;x", { secure: true });
    expect(cookie).toContain(`${PREVIEW_COOKIE}=tok%20en%3Bx`);
    expect(cookie.split(";")[0]).not.toContain(" ");
  });

  it("honours an explicit max age", () => {
    expect(buildPreviewCookie(TOKEN, { secure: true, maxAgeSeconds: 60 })).toContain("Max-Age=60");
  });
});
