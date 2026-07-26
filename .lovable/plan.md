# Phase 2: Background Check Integration (pluggable vendor, Certn-first)

Goal: turn the Phase 1 identity data into an actual FCRA-grade background check, without locking us to one vendor or one price tier. Start on Certn (~$15–$35/basic) but keep the door open to Checkr, Yardstik, or GoodHire without rewriting UI or webhooks.

## 1. Data model (one migration)

**`provider_background_checks`** — one row per check attempt, provider can have several (retries, re-checks, upgrades):
- `id`, `provider_id`
- `vendor` enum: `certn`, `checkr`, `yardstik`, `goodhire`, `manual`
- `vendor_candidate_id` (text) — id in vendor's system
- `vendor_report_id` (text, nullable)
- `package_code` (text) — e.g. `basic_us`, `basic_plus_mvr`, `enhanced`
- `package_tier` enum: `basic`, `basic_plus`, `enhanced`, `enhanced_plus_mvr` — normalized across vendors
- `status` enum: `created`, `invitation_sent`, `pending_candidate_info`, `pending_vendor`, `clear`, `consider`, `suspended`, `dispute`, `canceled`, `error`
- `adjudication` enum: `pending`, `engaged`, `pre_adverse_action`, `adverse_action`, `cleared` — our decision, separate from vendor status
- `invitation_url` (text) — where we send the caregiver
- `invitation_expires_at`
- `ordered_at`, `completed_at`
- `cost_cents` (int) — captured from webhook for reporting
- `raw_last_event` (jsonb) — most recent webhook payload for debugging
- `error_message` (text, nullable)

**`background_check_events`** — append-only ledger of every webhook we accept:
- `id`, `background_check_id`, `vendor`
- `vendor_event_id` (text, UNIQUE with vendor for idempotency)
- `event_type` (text)
- `payload` (jsonb)
- `received_at`, `signature_verified` (bool)

Both tables: GRANT + RLS. Provider reads own `provider_background_checks` (not events); admin/staff/support/success read-all both; service_role full.

Trigger: when a `provider_background_checks` row transitions to `status = 'clear'` AND `adjudication = 'cleared'`, upsert `provider_credentials(kind='background_check', status='passed', verified_at=now())` — existing tier-recompute trigger picks it up.

## 2. Vendor adapter interface

`src/lib/background-check/vendor.ts` — one small typed interface, no vendor SDKs at module scope:

```ts
type VendorAdapter = {
  vendor: 'certn' | 'checkr' | 'yardstik' | 'goodhire';
  createCandidate(input: CandidateInput): Promise<{ candidateId: string }>;
  orderCheck(input: OrderInput): Promise<{ reportId?: string; invitationUrl: string; expiresAt: string }>;
  verifyWebhookSignature(rawBody: string, headers: Headers): boolean;
  normalizeEvent(payload: unknown): NormalizedEvent; // status, adjudication, cost, ids
};
```

Implementations (all `.server.ts`, service-key/env read inside handlers):
- `src/lib/background-check/adapters/certn.server.ts` — primary. Uses Certn REST + HMAC webhook signature.
- `src/lib/background-check/adapters/checkr.server.ts` — stub file with the same interface, marked TODO, so switching is a config flip.

Selection: `BACKGROUND_CHECK_VENDOR` env var (`certn` default). Kept out of the `.functions.ts` client graph via `.server.ts` extension.

## 3. Package selection logic

`src/lib/background-check/packages.server.ts` — maps provider capabilities → package tier, so cost matches risk:
- Companion / errands only → `basic`
- Personal care (bathing, transfers) → `basic_plus`
- Transport / driving capability → add MVR → `enhanced_plus_mvr`
- Clinical (LPN/RN/CNA/med tech) → `enhanced`

Per-vendor mapping table in the adapter turns our tier into the vendor's package code.

## 4. Server functions (`src/lib/background-checks.functions.ts`)

All `.middleware([requireSupabaseAuth])`, admin ones do a role check inside the handler:

- `getMyBackgroundCheck()` — latest row for current provider + human-readable status.
- `startBackgroundCheck({ ssn })` — provider-initiated. Preconditions: identity submitted, all required consents current, ID docs accepted. Chooses package from capabilities, calls adapter `createCandidate` + `orderCheck` (SSN forwarded, never persisted beyond last 4), inserts row, returns `invitation_url`.
- `refreshBackgroundCheck()` — admin/support only, re-pulls current status from vendor.
- `cancelBackgroundCheck({ id, reason })` — admin only.
- `adminListBackgroundChecks({ filters })` — admin/staff/support/success table view.
- `adminAdjudicate({ id, decision, note })` — admin only; writes adjudication + optional pre-adverse-action state.

## 5. Public webhook route

`src/routes/api/public/hooks/background-check.ts`:
- `POST` handler, per-vendor signature verification via adapter.
- Idempotent on `(vendor, vendor_event_id)`.
- Loads `supabaseAdmin` inside the handler.
- Inserts into `background_check_events`, updates `provider_background_checks` via `normalizeEvent`, lets the DB trigger flip `provider_credentials` when appropriate.
- Returns 200 fast; heavy work stays sync but bounded.

URL to configure in Certn: `https://carematcher.lovable.app/api/public/hooks/background-check` (or dev host).

## 6. UI

**Provider dashboard tile** (`provider.index.tsx`): after identity submitted, replaces "waiting for review" nudge with a "Start background check" card showing package, expected cost, "we'll email you a secure link". Button calls `startBackgroundCheck`, opens `invitation_url` in a new tab. Once check is `pending_vendor`, tile shows spinner + "usually 1–3 days". On `clear` + `cleared`, tile disappears and provider is marked verified.

**New status route** `_authenticated/provider.background-check.tsx`: detail page with timeline of events, current status, retry/dispute contact.

**Admin** `admin.credentials.tsx`: new "Background checks" tab — list of rows across providers with filter chips (status, vendor, adjudication), row actions: view events, refresh, adjudicate, mark pre-adverse / adverse.

## 7. SSN handling

Full SSN is collected on the `startBackgroundCheck` call screen (one-time), passed to the adapter, then dropped. DB stores only last 4 (already there from Phase 1) + `ssn_provided_at`. Never logged, never returned in server-fn responses.

## 8. Secrets

Requested via `add_secret` in a follow-up turn (after you confirm vendor choice):
- `CERTN_API_KEY`
- `CERTN_WEBHOOK_SECRET`
- `BACKGROUND_CHECK_VENDOR` (set via `set_secret` to `certn`)

Checkr secrets stay unset until we flip vendor.

## 9. Out of scope (later)

- Continuous monitoring / re-check every 12 months (schema supports it; scheduler is Phase 3).
- Automated adverse-action letter generation (manual for now with a template).
- MVR-only re-runs when a driver adds transport later (row supports it; UI in Phase 3).
- Passing cost to caregiver via Stripe (row already has `cost_cents`, but no payment collection here).

## Technical section

- Adapter files use the `.server.ts` extension → hard-blocked from client bundles.
- Server functions live in `src/lib/background-checks.functions.ts` (client-safe path). Adapters are imported inside `.handler()` bodies with `await import(...)`.
- Webhook route calls `await import('@/integrations/supabase/client.server')` inside the POST handler; signature verify uses `timingSafeEqual`.
- Package + tier normalization is centralized so UI copy ("Basic check", "Enhanced + driving") doesn't branch per vendor.
- All new tables get GRANT + RLS + updated_at trigger; consent-style immutability trigger on `background_check_events`.
- Trigger writing to `provider_credentials` uses SECURITY DEFINER with `search_path = public`.
- No `supabaseAdmin` calls to authorize admins — role check goes through `context.supabase.rpc('has_role', …)`.

## Deliverables

1. One migration: 2 tables + enums + RLS + grants + immutability trigger + credential-writeback trigger.
2. `src/lib/background-check/vendor.ts` — interface + types.
3. `src/lib/background-check/adapters/certn.server.ts` — primary implementation.
4. `src/lib/background-check/adapters/checkr.server.ts` — stub.
5. `src/lib/background-check/packages.server.ts` — tier selection.
6. `src/lib/background-checks.functions.ts` — server functions listed above.
7. `src/routes/api/public/hooks/background-check.ts` — webhook.
8. `src/routes/_authenticated/provider.background-check.tsx` — status page.
9. Edits: `provider.index.tsx` dashboard tile, `admin.credentials.tsx` new tab.
10. `.lovable/plan.md` updated to reflect Phase 2 shipped.

Approve and I'll request the Certn secrets, then implement.

---

## Phase 2 — SHIPPED

- Migration: `provider_background_checks` + `background_check_events` with GRANT/RLS, immutability + credential-writeback triggers.
- Vendor abstraction: `src/lib/background-check/vendor.ts` (types), `adapters/certn.server.ts` (primary), `adapters/checkr.server.ts` (stub), `adapters/index.server.ts` (selector via `BACKGROUND_CHECK_VENDOR`).
- Package tier logic: `packages.server.ts` — companion→basic, personal-care→basic_plus, driving→enhanced_plus_mvr, clinical→enhanced.
- Server functions: `src/lib/background-checks.functions.ts` — getMy, start, adminList, adminAdjudicate, cancel, listMyEvents.
- Webhook: `src/routes/api/public/hooks/background-check.ts` — HMAC verify, idempotent on (vendor, vendor_event_id), auto-adjudicate on `clear`.
- UI: provider dashboard tile + `/provider/background-check` status page + admin `admin.credentials.tsx` table.

### To flip on

1. Sign up for Certn (or Yardstik/GoodHire — same adapter shape).
2. Add `CERTN_API_KEY` and `CERTN_WEBHOOK_SECRET` in Settings → Secrets.
3. Point the vendor's webhook at `https://carematcher.lovable.app/api/public/hooks/background-check`.
4. `BACKGROUND_CHECK_VENDOR` defaults to `certn`; set it if switching.
