# Working in this repo

## Package manager

npm is canonical. CI runs `npm ci` against `package-lock.json`
(`.github/workflows/ci.yml`). Do not add a second lockfile.

## Commands

- `npm run typecheck` — `tsc --noEmit`, expected to pass clean
- `npm test` — vitest
- `npm run build` — Vite + Nitro, emits the Cloudflare Worker to `.output/`
- `npm run deploy` — build, then `wrangler deploy`

`npm run lint` currently reports a large pre-existing backlog, most of it
`prettier/prettier` line-ending noise on Windows checkouts. CI runs it with
`continue-on-error: true`. Don't bulk-reformat to clear it — the diff buries
real changes.

## Deploys

`wrangler.toml` deliberately omits `main` and `[assets]`; Nitro regenerates
them into `.output/server/wrangler.json` at build time and `wrangler` picks
that up via `.wrangler/deploy/config.json`. Secrets go in with
`wrangler secret put <NAME>`, never into `wrangler.toml` — that file is
committed.

The hourly cron trigger comes from `scheduledTasks` in `vite.config.ts`, not
from `wrangler.toml`. Its handler lives in `tasks/`.

## Database

Supabase, one project shared by local dev and production — there is no
separate staging database. `.env` points at the same project the deployed
Worker uses, so exercising a write path locally writes production rows.
All tables have RLS enabled; keep it that way when adding one.
