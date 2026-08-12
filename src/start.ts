import { createStart, createMiddleware } from "@tanstack/react-start";

import { renderErrorPage } from "./lib/error-page";
import { attachSupabaseAuth } from "@/integrations/supabase/auth-attacher";
import {
  buildPreviewCookie,
  decideGate,
  isComingSoonEnabled,
  NOINDEX,
} from "./lib/coming-soon-gate";

const errorMiddleware = createMiddleware().server(async ({ next }) => {
  try {
    return await next();
  } catch (error) {
    if (error != null && typeof error === "object" && "statusCode" in error) {
      throw error;
    }
    console.error(error);
    return new Response(renderErrorPage(), {
      status: 500,
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  }
});

/**
 * Adds the noindex header without disturbing the response body. A Response
 * built by Response.redirect() has immutable headers, hence the try/catch; and
 * the rebuild deliberately passes the *same* body object through, because
 * start-server-core's getFinalResponse matches on body identity to keep the
 * streaming-SSR cleanup wrapper attached.
 */
function withNoIndex(response: Response): Response {
  try {
    response.headers.set("X-Robots-Tag", NOINDEX);
    return response;
  } catch {
    const headers = new Headers(response.headers);
    headers.set("X-Robots-Tag", NOINDEX);
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  }
}

let warnedMissingToken = false;

/**
 * Pre-launch gate — see src/lib/coming-soon-gate.ts for the policy. Registered
 * as a request middleware rather than in the route tree because the 49 public
 * marketing routes share no layout route, and this position also catches the
 * server-route handlers (/api/**) that a beforeLoad never sees. Static assets
 * never reach here: Nitro's cloudflare preset answers those from env.ASSETS
 * before the SSR handler runs, which is why robots.txt and llms.txt had to
 * become routes.
 */
const comingSoonGate = createMiddleware().server(async ({ request, pathname, next }) => {
  const enabled = isComingSoonEnabled(process.env.COMING_SOON);
  if (!enabled) return next();

  const token = process.env.COMING_SOON_TOKEN;
  if (!token && !warnedMissingToken) {
    warnedMissingToken = true;
    // Surfaces in Workers observability (enabled in wrangler.toml). Not fatal:
    // the gate fails closed, and the portal allowlist means nobody is locked
    // out of the app itself — only marketing preview is unavailable.
    console.error(
      "[coming-soon] COMING_SOON=1 but COMING_SOON_TOKEN is unset — preview links are disabled.",
    );
  }

  const url = new URL(request.url);
  const decision = decideGate({
    pathname,
    search: url.search,
    cookieHeader: request.headers.get("cookie"),
    token,
    enabled,
  });

  switch (decision.kind) {
    case "grant":
      return new Response(null, {
        status: 302,
        headers: {
          location: decision.location,
          "set-cookie": buildPreviewCookie(token as string, {
            secure: url.protocol === "https:",
          }),
          // 302 rather than 301, and no-store, so a cached redirect can't
          // outlive the launch.
          "cache-control": "no-store",
          "x-robots-tag": NOINDEX,
        },
      });

    case "gate":
      return new Response(null, {
        status: 302,
        headers: {
          location: "/coming-soon",
          "cache-control": "no-store",
          "x-robots-tag": NOINDEX,
        },
      });

    case "block":
      return new Response("Not found", {
        status: 404,
        headers: {
          "content-type": "text/plain; charset=utf-8",
          "cache-control": "no-store",
          "x-robots-tag": NOINDEX,
        },
      });

    case "allow": {
      const result = await next();
      return { ...result, response: withNoIndex(result.response) };
    }
  }
});

export const startInstance = createStart(() => ({
  functionMiddleware: [attachSupabaseAuth],
  // Gate first: gated traffic never loads a route module. If the gate itself
  // throws, src/server.ts turns the resulting 500 into the error page — i.e. it
  // fails closed rather than leaking real content.
  requestMiddleware: [comingSoonGate, errorMiddleware],
}));
