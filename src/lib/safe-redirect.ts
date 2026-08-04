export const DEFAULT_LANDING = "/dashboard";

/**
 * A same-origin path: a leading "/" followed only by characters that are legal
 * in a URL path, query, or fragment.
 *
 * Deliberately an allowlist rather than a blocklist. It rejects backslashes
 * (which some browsers normalise to "/", so "/\evil.com" escapes the origin),
 * whitespace, and control characters (which browsers strip before parsing, and
 * which can therefore smuggle a scheme past a naive prefix check) without
 * having to enumerate them.
 */
const SAFE_PATH = /^\/[A-Za-z0-9\-._~%!$&'()*+,;=:@/?#[\]]*$/;

/**
 * Sanitize a post-login `redirect` search param.
 *
 * The auth guard puts the path the user was trying to reach into the URL, so
 * this value is attacker-controllable — anyone can hand out a link to
 * /auth?redirect=... . Only same-origin paths are honoured; anything a browser
 * would resolve to another origin falls back to the default landing, rather
 * than becoming an open redirect that lends our domain to a phishing page.
 */
export function safeRedirect(target: string | undefined | null): string {
  if (!target) return DEFAULT_LANDING;
  // Protocol-relative ("//evil.com") is absolute in disguise, and would
  // otherwise satisfy the leading-slash rule.
  if (target.startsWith("//")) return DEFAULT_LANDING;
  if (!SAFE_PATH.test(target)) return DEFAULT_LANDING;
  return target;
}
