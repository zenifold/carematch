import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { KeyRound, ArrowRight, AlertCircle } from "lucide-react";

import { buildPreviewCookie } from "@/lib/coming-soon-gate";

/**
 * Employee entrance to the real site while the public gate is up.
 *
 * Same mechanism as the ?preview=TOKEN link (see src/lib/coming-soon-gate.ts) —
 * this is just a friendlier front door for the team: enter the shared password
 * and you get the same httpOnly cookie, then land on the real homepage with the
 * full nav.
 *
 * Deliberately a plain <form method="post"> handled by a server handler rather
 * than a server function:
 *  - The password is compared on the server and never reaches the client
 *    bundle; there is no API that reports whether a guess was right beyond the
 *    redirect itself.
 *  - The handler constructs its own Response, so Set-Cookie is explicit rather
 *    than relying on framework cookie-merge semantics (which skip merging on
 *    2xx responses).
 *  - It works with JavaScript disabled, and there is no client state to get
 *    out of sync with the cookie the server just set.
 */

const SearchSchema = z.object({
  /**
   * Set by the POST handler on a failed attempt so we can show a message.
   *
   * A word, not "1": TanStack Router's default search parser JSON-parses
   * values, so `?error=1` arrives as the number 1 and a z.literal("1") throws
   * — which renders the 500 page instead of the login form.
   */
  error: z.enum(["denied"]).optional(),
});

export const Route = createFileRoute("/employee")({
  validateSearch: SearchSchema,
  head: () => ({
    meta: [
      { title: "Employee portal — CompanionCare" },
      { name: "robots", content: "noindex, nofollow, noarchive" },
    ],
  }),
  server: {
    handlers: {
      POST: async ({ request }) => {
        const token = process.env.COMING_SOON_TOKEN;
        const form = await request.formData();
        const supplied = String(form.get("password") ?? "");
        const url = new URL(request.url);

        // `token &&` is load-bearing: without it, an unset COMING_SOON_TOKEN
        // would let an empty password through and unlock the whole site.
        const ok = Boolean(token) && safeEqual(supplied, token as string);

        if (!ok) {
          return new Response(null, {
            status: 303,
            headers: { location: "/employee?error=denied", "cache-control": "no-store" },
          });
        }

        // 303 so the browser follows with GET rather than re-POSTing.
        return new Response(null, {
          status: 303,
          headers: {
            location: "/",
            "set-cookie": buildPreviewCookie(token as string, {
              secure: url.protocol === "https:",
            }),
            "cache-control": "no-store",
          },
        });
      },
    },
  },
  component: EmployeePortal,
});

/** Length-independent compare, so the password isn't discoverable by timing. */
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

function EmployeePortal() {
  const { error } = Route.useSearch();

  return (
    <div className="grid min-h-dvh place-items-center bg-background px-5 py-12 text-foreground">
      <main className="w-full max-w-md">
        <div className="mb-8 text-center">
          <span className="font-serif text-xl font-bold tracking-tight">CompanionCare</span>
        </div>

        <div className="surface-card p-7 sm:p-9">
          <div className="grid size-11 place-items-center rounded-full bg-primary/10">
            <KeyRound className="size-5 text-primary" aria-hidden />
          </div>
          <h1 className="mt-4 font-serif text-3xl tracking-tight">Employee portal</h1>
          <p className="mt-2 text-base text-muted-foreground text-pretty">
            The public site is still behind a pre-launch page. Enter the team password to browse the
            real site for the next 30 days on this device.
          </p>

          {/* No "the gate is off" hint here on purpose: process.env.COMING_SOON
              is server-only, so a component reading it renders one thing during
              SSR and the opposite after hydration. If the gate is off this page
              is simply harmless — the cookie it sets gates nothing. */}
          {error && (
            <p
              role="alert"
              className="mt-5 flex items-start gap-2 rounded-xl bg-destructive/10 p-4 text-base text-destructive"
            >
              <AlertCircle className="mt-0.5 size-5 shrink-0" aria-hidden />
              That password didn&rsquo;t match. Check with the team and try again.
            </p>
          )}

          {/* method="post" to this same path — the server handler above answers
              POST, while GET renders this page. */}
          <form method="post" action="/employee" className="mt-6">
            <label htmlFor="password" className="mb-1.5 block text-base font-semibold">
              Team password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoFocus
              autoComplete="current-password"
              className="w-full rounded-xl border border-input bg-background px-4 py-3 text-lg outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40"
            />
            <button
              type="submit"
              className="mt-4 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-primary px-6 text-lg font-semibold text-primary-foreground hover:bg-primary/90"
            >
              Enter the site <ArrowRight className="size-5" aria-hidden />
            </button>
          </form>
        </div>

        {/* Plain anchors: a hard navigation is re-evaluated by the gate. */}
        <p className="mt-6 text-center text-base text-muted-foreground">
          Looking for your account?{" "}
          <a href="/auth" className="font-medium text-primary underline">
            Sign in
          </a>{" "}
          ·{" "}
          <a href="/coming-soon" className="font-medium text-primary underline">
            Back
          </a>
        </p>
      </main>
    </div>
  );
}
