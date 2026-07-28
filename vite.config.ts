// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
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
    // cloudflare_module has native Cron Trigger support — Nitro writes the
    // matching trigger into .output/server/wrangler.json at build time, no
    // manual wrangler cron config needed.
    scheduledTasks: { "0 * * * *": "send-visit-reminders" },
  } as any,
});
