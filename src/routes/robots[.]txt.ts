import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";

import { isComingSoonEnabled } from "@/lib/coming-soon-gate";

/**
 * A route rather than public/robots.txt, because the pre-launch gate can't see
 * static assets — Nitro's cloudflare preset answers those from env.ASSETS
 * before the SSR handler runs. Serving this from the router means what we tell
 * crawlers is derived from the same COMING_SOON flag as the gate itself, so the
 * two can't drift, and launch day is one env-var flip rather than a checklist
 * item somebody forgets.
 *
 * public/robots.txt was deleted when this was added. If it comes back, the
 * asset wins silently and this route stops being served.
 */

// Full block while the site is gated. AI crawlers are named explicitly because
// several of them ignore a bare `User-agent: *` block for training fetches.
const GATED = `# CompanionCare is not open yet. Nothing here is ready to index.
User-agent: *
Disallow: /

User-agent: GPTBot
Disallow: /

User-agent: ClaudeBot
Disallow: /

User-agent: PerplexityBot
Disallow: /

User-agent: Google-Extended
Disallow: /

User-agent: CCBot
Disallow: /

User-agent: Bytespider
Disallow: /
`;

// Restored automatically when COMING_SOON is turned off. Keep in sync with the
// entries in src/routes/api/sitemap[.]xml.ts.
const LIVE = `User-agent: *
Allow: /
Disallow: /_authenticated/
Disallow: /dashboard
Disallow: /senior
Disallow: /family
Disallow: /provider
Disallow: /admin
Disallow: /auth
Disallow: /onboarding
Disallow: /coming-soon

# Explicitly welcome AI crawlers to marketing pages
User-agent: GPTBot
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: Google-Extended
Allow: /

Sitemap: https://getcompanioncare.com/api/sitemap.xml
`;

export const Route = createFileRoute("/robots.txt")({
  server: {
    handlers: {
      GET: async () => {
        const gated = isComingSoonEnabled(process.env.COMING_SOON);
        return new Response(gated ? GATED : LIVE, {
          headers: {
            "Content-Type": "text/plain; charset=utf-8",
            // Short TTL while gated so flipping the flag at launch takes effect
            // quickly instead of being pinned by a day-long cache.
            "Cache-Control": gated ? "public, max-age=300" : "public, max-age=3600",
          },
        });
      },
    },
  },
});
