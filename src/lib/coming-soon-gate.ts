/**
 * Pre-launch gate. The site is deployed to getcompanioncare.com but the app
 * isn't finished, so every public marketing route serves /coming-soon instead
 * of its real content, and crawlers are refused outright.
 *
 * Deliberately default-deny: anything not explicitly allowlisted is gated.
 * With 49 marketing routes (and more being added), an allowlist of paths to
 * *block* would need updating every time someone adds a page — and the failure
 * mode of forgetting is a half-built page going public. Default-deny's failure
 * mode is a teammate seeing the coming-soon page on a path we forgot to allow,
 * which is loud and harmless.
 *
 * Pure and framework-free so it's unit-testable; src/start.ts does the I/O.
 */

export const PREVIEW_COOKIE = "cc_preview";
export const PREVIEW_PARAM = "preview";
export const NOINDEX = "noindex, nofollow, noarchive";

/**
 * Server-function endpoint prefix — `process.env.TSS_SERVER_FN_BASE` in
 * @tanstack/react-start 1.168.x, which is compile-time-replaced with
 * "/_serverFn/". Hardcoded rather than read from env because this module is
 * unit-tested outside the Vite transform that does the replacement.
 */
const SERVER_FN_BASE = "/_serverFn/";

/**
 * Reachable while gated, exact match only.
 *
 * The two legal pages are here deliberately: /coming-soon collects names,
 * emails and phone numbers, so the privacy policy it links to has to actually
 * load. Note this is the one place the gate is soft — those pages render
 * SiteHeader, whose <Link> nav can client-side navigate into gated routes from
 * the already-loaded bundle. Crawlers still can't reach them (robots + the
 * noindex header + a 302 on any hard navigation), which is the requirement;
 * closing the client-side path too would need a router-level rewrite.
 */
const ALLOW_EXACT = new Set([
  "/coming-soon",
  "/legal/privacy",
  "/legal/terms",
  "/robots.txt",
  "/llms.txt",
  "/favicon.png",
]);

/**
 * Reachable while gated, as a path root. The team still needs to log in and
 * exercise the portals against production data while the marketing site is
 * dark, and /api/public/* carries live Stripe + vendor webhooks that must never
 * see a redirect.
 */
const ALLOW_ROOTS = [
  // The team's password entrance to the real site — it issues the same cookie
  // a ?preview=TOKEN link does, so it obviously must be reachable while gated.
  "/employee",
  "/auth",
  "/dashboard",
  "/onboarding",
  "/senior",
  "/family",
  "/provider",
  "/admin",
  "/api/public",
];

/**
 * Gated with a 404 rather than a redirect. /api/sitemap.xml is the only path
 * here today: a sitemap advertising 49 gated URLs shouldn't exist while we're
 * hidden, and 302-ing an XML endpoint to an HTML page is worse than absent.
 */
const BLOCK_ROOTS = ["/api"];

/**
 * The single reading of the master switch, shared by the middleware and the
 * robots.txt/llms.txt routes so the gate and what we tell crawlers can't drift
 * apart. Opt-in ("1"), not opt-out, so `npm run dev` is unaffected by default
 * and no developer can lock themselves out of their own machine.
 */
export function isComingSoonEnabled(value: string | undefined): boolean {
  return value === "1";
}

export type GateDecision =
  /** Serve the real thing. */
  | { kind: "allow" }
  /** Valid preview token: set the cookie and bounce to the token-free URL. */
  | { kind: "grant"; location: string }
  /** Redirect to the coming-soon page. */
  | { kind: "gate" }
  /** Refuse outright with a 404. */
  | { kind: "block" };

export type GateInput = {
  pathname: string;
  /** Raw query string, with or without the leading "?" (e.g. "?preview=abc"). */
  search: string;
  cookieHeader: string | null;
  /** process.env.COMING_SOON_TOKEN */
  token: string | undefined;
  /** process.env.COMING_SOON === "1" */
  enabled: boolean;
};

/**
 * Segment-boundary prefix match. A plain startsWith("/senior") would also
 * match "/senior-care" and "/senior-care/tx", punching a hole straight through
 * the gate for two public routes.
 */
function matchesRoot(pathname: string, root: string): boolean {
  return pathname === root || pathname.startsWith(`${root}/`);
}

/** Length-independent compare, so the token isn't discoverable by timing. */
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/**
 * Scans every cookie rather than stopping at the first `cc_preview`, so a
 * planted decoy (`cc_preview=junk; cc_preview=<real>`) can't lock the team out.
 */
function hasPreviewCookie(header: string | null, token: string | undefined): boolean {
  if (!token || !header) return false;
  for (const part of header.split(";")) {
    const eq = part.indexOf("=");
    if (eq === -1) continue;
    if (part.slice(0, eq).trim() !== PREVIEW_COOKIE) continue;
    let value = part.slice(eq + 1).trim();
    try {
      value = decodeURIComponent(value);
    } catch {
      // A malformed escape isn't the token; fall through with the raw value.
    }
    if (safeEqual(value, token)) return true;
  }
  return false;
}

export function decideGate(input: GateInput): GateDecision {
  if (!input.enabled) return { kind: "allow" };

  const { pathname, token } = input;

  // Checked before the allowlist so ?preview=… grants from any URL, including
  // the ones that are reachable anyway.
  const params = new URLSearchParams(
    input.search.startsWith("?") ? input.search.slice(1) : input.search,
  );
  const offered = params.get(PREVIEW_PARAM);
  // `token &&` is load-bearing: without it, an unset COMING_SOON_TOKEN makes
  // "?preview=" (empty === undefined-ish) unlock the entire site.
  if (token && offered !== null && safeEqual(offered, token)) {
    params.delete(PREVIEW_PARAM);
    const rest = params.toString();
    // Strip the token from the URL so it stays out of Referer headers,
    // browser history, analytics, and pasted screenshots.
    return { kind: "grant", location: rest ? `${pathname}?${rest}` : pathname };
  }

  if (hasPreviewCookie(input.cookieHeader, token)) return { kind: "allow" };

  // Unconditional — anonymous visitors submit the interest forms through here
  // and have no cookie.
  if (pathname.startsWith(SERVER_FN_BASE)) return { kind: "allow" };

  if (ALLOW_EXACT.has(pathname)) return { kind: "allow" };
  if (ALLOW_ROOTS.some((root) => matchesRoot(pathname, root))) return { kind: "allow" };
  if (BLOCK_ROOTS.some((root) => matchesRoot(pathname, root))) return { kind: "block" };

  return { kind: "gate" };
}

/**
 * `Secure` is conditional rather than always-on: browsers do treat
 * http://localhost as a secure context, but an unconditional Secure silently
 * breaks any other http origin — a LAN IP for phone testing, or the Lovable
 * sandbox host. SameSite=Lax (not Strict) so the preview link still works when
 * clicked from Slack or email, which is how the team will actually use it.
 */
export function buildPreviewCookie(
  token: string,
  opts: { secure: boolean; maxAgeSeconds?: number },
): string {
  const parts = [
    `${PREVIEW_COOKIE}=${encodeURIComponent(token)}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${opts.maxAgeSeconds ?? 60 * 60 * 24 * 30}`,
  ];
  if (opts.secure) parts.push("Secure");
  return parts.join("; ");
}
