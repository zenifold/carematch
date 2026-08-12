// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { fileURLToPath } from "node:url";
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
  // `experimental`/`scheduledTasks` aren't in LovableViteTanstackOptions'
  // narrow nitro type (it only declares preset/output/cloudflare), but the
  // wrapper forwards this object to nitro/vite's real NitroConfig as-is —
  // see tasks/send-visit-reminders.ts. `as any` only widens past that type
  // check, it doesn't change what's actually passed through.
  nitro: {
    experimental: { tasks: true },
    // Nitro auto-scans for tasks under its own srcDir, which is not this
    // repo's root-level tasks/ directory — so the handler was never bundled
    // and the registry shipped empty. Register it explicitly.
    tasks: {
      "send-visit-reminders": {
        // Absolute path: Nitro resolves this from a virtual module, where a
        // repo-relative specifier has no meaningful base to resolve against.
        handler: fileURLToPath(new URL("./tasks/send-visit-reminders.ts", import.meta.url)),
        description: "Email seniors who opted in when a visit is starting soon",
      },
      "check-credential-expiry": {
        handler: fileURLToPath(new URL("./tasks/check-credential-expiry.ts", import.meta.url)),
        description: "Warn when provider credentials are close to expiry or already lapsed",
      },
    },
    // cloudflare_module has native Cron Trigger support — Nitro writes the
    // matching trigger into .output/server/wrangler.json at build time, no
    // manual wrangler cron config needed.
    // Reminders run hourly because a visit window is hours wide. Credential expiry
    // moves in days, so a daily run at 07:00 UTC lands in the European morning and
    // before the US working day — and an hourly one would either repeat the same
    // warning 24 times or need state purely to avoid doing so.
    scheduledTasks: {
      "0 * * * *": "send-visit-reminders",
      "0 7 * * *": "check-credential-expiry",
    },
  } as any,
});
