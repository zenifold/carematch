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

## Demo and test accounts

`npm run seed:demo` (`scripts/seed-demo.mjs`) owns every non-real account.

**The shared password is not in this repo, and must not be put back.** It lives
in `DEMO_PASSWORD` in `.env` (gitignored); ask someone on the team for it. The
reason is specific rather than reflexive: this repo is public, the pre-launch gate
intentionally leaves `/auth` reachable, `demo-admin@` carries a real `admin`
role, and there is one Supabase project shared by dev and production — so a
password committed here is a working production admin login published to the
internet. The account can read `waitlist_signups`, the only table holding real
people's names, emails, and phone numbers.

| Sign in as | Email                               | What you see                                                              |
| ---------- | ----------------------------------- | ------------------------------------------------------------------------- |
| Admin      | `demo-admin@companioncare.test`     | Every staff queue with real rows in it                                    |
| Senior     | `demo-senior@companioncare.test`    | Marta Alvarez — 6 rated visits, 2 upcoming, a message thread, a spend cap |
| Family     | `demo-family@companioncare.test`    | Dana Alvarez — financial access to Marta, an open billing ticket          |
| Caregiver  | `demo-caregiver@companioncare.test` | Andrea Rivera — 4.8 rating, payout history, a pending request             |

Nine more populated personas exist for list density: `eleanor.vance@`,
`robert.chen@`, `james.vance@`, `sophie.vance@`, and providers `priya.shah@`,
`marcus.chen@`, `nia.okafor@`, `luisa.fernandez@`, `diego.martinez@` (all
`@companioncare.test`).

The four `test-*@companioncare.test` accounts (`test-senior`, `test-family`,
`test-caregiver`, `test-staff`) are deliberately empty, for walking through
onboarding and first-run states the way a new user would.

Three things to know before touching it:

- **Everything lives on `companioncare.test`**, which RFC 2606 reserves, so no
  address can receive mail or collide with a real signup. That domain is also
  the only marker the seed needs: `--reset` deletes every account on it and the
  foreign keys cascade the data away.
- **Re-running is how you refresh it.** Every date is relative to run time, so
  a seed left alone for a month starts showing "upcoming" visits in the past.
  A re-run clears the previous seed data first, so it never doubles up.
- **It writes to production**, per the note above. Inserting bookings, messages,
  and verifications also fires the app's notification triggers, so the row counts
  come out higher than what the script inserts directly — that's expected.

`node scripts/seed-demo.mjs --verify` signs in as all 17 without changing
anything, which is the quickest check that a rename or password reset landed.
