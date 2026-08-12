# Buzz ↔ CompanionCare support

How the Buzz agents read and write customer support tickets and trust-and-safety
incidents, and how both reach the support channel.

**The design in one line:** there is no bespoke support API. RLS already encodes
the permission model, so Buzz authenticates as a machine account holding the
`support` and `trust_safety` roles and calls Supabase's REST API directly, with
Postgres enforcing the boundary.

## Credentials

| What         | Value                                                                    |
| ------------ | ------------------------------------------------------------------------ |
| Account      | `buzz-agent@integrations.getcompanioncare.com`                           |
| Roles        | `support` (tickets) + `trust_safety` (incidents)                         |
| Password     | `AGENT_ACCOUNT_PASSWORD` in `.env` — ask, never committed                |
| Supabase URL | `https://wcjahuathjuzocvpmewu.supabase.co`                               |
| Anon key     | `SUPABASE_PUBLISHABLE_KEY` (safe to embed; it grants nothing on its own) |

Provisioned and checked by `node scripts/provision-agent-account.mjs`. Run it with
`--verify` to re-assert the boundary without changing anything, or `--revoke` to
cut access off.

The account is **not** on `companioncare.test`. That domain is the demo seed's
marker and `seed-demo.mjs --reset` deletes everything on it, which would take the
integration down silently.

## Getting a session

```bash
curl -s "$SUPABASE_URL/auth/v1/token?grant_type=password" \
  -H "apikey: $ANON_KEY" -H 'content-type: application/json' \
  -d '{"email":"buzz-agent@integrations.getcompanioncare.com","password":"'"$AGENT_PASSWORD"$'"}'
```

Returns `access_token` (a JWT, ~1 hour) and `refresh_token`. **Buzz must refresh.**
Access tokens are short-lived by design; exchange the refresh token at
`/auth/v1/token?grant_type=refresh_token` rather than re-sending the password on a
loop.

Every subsequent call sends both headers:

```
apikey: <anon key>
Authorization: Bearer <access_token>
```

## What the agent can do

Verified against live RLS by the provisioning script. Each row is an assertion it
re-checks on every run.

| Operation                     | Allowed | Notes                                                  |
| ----------------------------- | ------- | ------------------------------------------------------ |
| Read all tickets              | yes     | `GET /rest/v1/support_tickets`                         |
| Read all messages             | yes     | including `internal = true` staff notes                |
| Update a ticket               | yes     | status, priority, assignee, category                   |
| Post a public reply           | yes     | `internal: false` — the requester sees it              |
| Post an internal note         | yes     | `internal: true` — staff only                          |
| Read all incidents            | yes     | via `trust_safety`                                     |
| Triage an incident            | yes     | status, severity, `resolution_notes`                   |
| Read all profiles             | yes     | **including care notes — see below**                   |
| Post as someone else          | **no**  | policy pins `author_id` to `auth.uid()`; returns 403   |
| Delete a message              | **no**  | no DELETE grant and no policy — history is append-only |
| Read `payment_ledger`         | **no**  | returns 0 rows                                         |
| Open a ticket _as a customer_ | **no**  | see the gap below                                      |

### What the agent can see that you may not expect

`support` already grants SELECT on **every** profile, and `profiles` includes
`care_notes`, `care_medical_notes`, `care_home_notes`, `care_no_go_notes`, and
`phone`. That is not something `trust_safety` added — it has been true since
`20260728093100_add_staff_read_profiles.sql`, which exists because the admin views
silently returned zero rows without it.

So the agent can read care notes. If that is not acceptable, the fix is a narrower
projection for the staff-read policy or a view that excludes the care columns —
worth doing deliberately, and it will need the admin views checked against it.

Why `trust_safety` rather than `admin` or `staff`: checked against every policy
referencing it, `trust_safety` adds exactly `incidents`, `message_flags`, and
`user_legal_acceptances`. `admin` and `staff` would additionally open
`payment_ledger`, `bookings`, and `visits`.

### Reading the queue

```http
GET /rest/v1/support_tickets?select=id,subject,body,status,priority,category,portal,requester_id,assignee_id,created_at,last_activity_at&status=eq.open&order=last_activity_at.desc
```

Full thread for one ticket:

```http
GET /rest/v1/support_messages?select=id,author_id,body,internal,created_at&ticket_id=eq.<id>&order=created_at.asc
```

### Replying

```http
POST /rest/v1/support_messages
{ "ticket_id": "<id>", "author_id": "<agent uuid>", "body": "…", "internal": false }
```

`author_id` must be the agent's own user id — anything else is rejected. That is
deliberate: it keeps every agent action attributable, and means a compromised
agent cannot forge a message from a staff member or a customer.

### Changing state

```http
PATCH /rest/v1/support_tickets?id=eq.<id>
{ "status": "pending", "assignee_id": "<staff uuid>" }
```

`status` is one of `open`, `pending`, `resolved`, `closed`. `priority` is `low`,
`normal`, `high`, `urgent`. Setting `resolved_at` is the app's job, not the
agent's — leave it alone.

### Incidents

Trust-and-safety reports live in a separate table with its own vocabulary.

```http
GET /rest/v1/incidents?select=id,category,severity,status,summary,reporter_id,subject_user_id,booking_id,created_at&status=eq.open&order=created_at.desc
```

`category` is one of `no_show`, `safety`, `abuse`, `theft`, `quality`, `billing`,
`other`. `severity` is `1`–`4` (low / normal / high / critical). `status` is `open`,
`triaged`, `resolved`, `dismissed`.

```http
PATCH /rest/v1/incidents?id=eq.<id>
{ "status": "triaged", "severity": 3, "resolution_notes": "…" }
```

Incidents have no message thread — `resolution_notes` is the only free-text field
an agent can add, and it overwrites rather than appends. Read it before writing so
you don't discard a human's note.

An incident is not a ticket, and the difference is worth respecting: `abuse`,
`safety`, and `theft` are allegations about a person's conduct. An agent
auto-resolving one of those is a materially worse mistake than mishandling a
billing question. Triage and route them; leave the judgement to a human.

## Notifications

Both event types go to the same `SUPPORT_WEBHOOK_URL`, so one channel sees
everything. Tell them apart by the `event` field or the `x-companioncare-event`
header.

| Event                    | Fired from            | Table             |
| ------------------------ | --------------------- | ----------------- |
| `support_ticket.created` | `createSupportTicket` | `support_tickets` |
| `incident.created`       | `reportIncident`      | `incidents`       |

Both hooks sit in the application rather than in database triggers, because RLS
restricts INSERT on each table to `reporter_id`/`requester_id = auth.uid()` — which
makes those two server functions the only paths in. No `pg_net` and no dashboard
webhook config needed.

Set both secrets to turn it on; it is inert without them:

```bash
wrangler secret put SUPPORT_WEBHOOK_URL
wrangler secret put SUPPORT_WEBHOOK_SECRET
```

### Payload

```json
{
  "event": "support_ticket.created",
  "id": "3f2c…",
  "subject": "Can I be billed instead of my mother?",
  "body_preview": "Mum's card is on the account but I'd rather…",
  "body_truncated": true,
  "category": "billing",
  "portal": "family",
  "priority": "normal",
  "status": "open",
  "requester": { "id": "22…", "name": "Dana Alvarez" },
  "created_at": "2026-08-12T14:00:00.000Z",
  "admin_url": "https://getcompanioncare.com/admin/support"
}
```

**The full body is not sent, and neither is the requester's email.** Only the
first 280 characters. These payloads land in chat channels and their logs, which
persist far longer and are visible to more people than the admin queue, and ticket
bodies routinely carry health details and home circumstances. When `body_truncated`
is true and the agent needs the rest, fetch it over the API under the same RLS a
human staffer works within. `BODY_PREVIEW_LIMIT` in `src/lib/support-webhook.ts`
can be raised, but that is the tradeoff being made.

### Incident payload

```json
{
  "event": "incident.created",
  "id": "7a1b…",
  "category": "safety",
  "severity": 3,
  "severity_label": "high",
  "status": "open",
  "summary_preview": "Loved one was left alone for two hours during a…",
  "summary_truncated": true,
  "reporter_id": "aa…",
  "subject_user_id": "bb…",
  "booking_id": null,
  "created_at": "2026-08-12T16:00:00.000Z",
  "admin_url": "https://getcompanioncare.com/admin/trust-safety",
  "urgent": true
}
```

**Incident payloads carry no names at all — not even the reporter's.** Stricter than
tickets, deliberately. `abuse`, `safety`, and `theft` incidents can be allegations
against a named person, and a chat channel is the wrong place for that to live
permanently, searchable by the whole workspace and outliving any dismissal of the
report. Ids are enough to open the right record; resolve them over the API when
there's a reason to.

`urgent` is computed server-side (`category` in `safety`/`abuse`/`theft`, **or**
`severity >= 3`) so the routing rule lives in one place and is covered by tests.
Use it to decide whether to @-mention.

### Verifying a delivery

Three headers arrive: `x-companioncare-timestamp`, `x-companioncare-signature`
(`sha256=<hex>`), and `x-companioncare-delivery-id`.

```js
import { createHmac, timingSafeEqual } from "crypto";

function verify(rawBody, headers, secret) {
  const ts = Number(headers["x-companioncare-timestamp"]);
  if (!Number.isFinite(ts) || Math.abs(Date.now() / 1000 - ts) > 300) return false;
  const got = /^sha256=([0-9a-f]{64})$/.exec(headers["x-companioncare-signature"] ?? "")?.[1];
  if (!got) return false;
  const want = createHmac("sha256", secret).update(`${ts}.${rawBody}`).digest("hex");
  return timingSafeEqual(Buffer.from(got), Buffer.from(want));
}
```

Sign over the **raw** body, not a re-serialised object — key order would differ and
the signature would never match. The timestamp is folded into the signed string so
a captured delivery cannot be replayed later; reject anything outside 300 seconds.

### Delivery guarantees — read this

**One attempt, 3-second timeout, best-effort.** It runs inline in the request that
creates the ticket, so a hanging endpoint would be felt by the person filing it. A
failed delivery is logged as `[support-webhook] delivery failed …` in Workers
observability.

**A dropped delivery means a missed channel post, not a lost ticket.** The row is
committed before the webhook fires and stays in the admin queue. Buzz should treat
the webhook as a latency optimisation and still reconcile periodically:

```http
GET /rest/v1/support_tickets?select=id,subject,created_at&created_at=gt.<last seen>&order=created_at.asc
GET /rest/v1/incidents?select=id,category,severity,created_at&created_at=gt.<last seen>&order=created_at.asc
```

Reconcile **both**. A missed incident matters more than a missed ticket, so if only
one sweep gets built, build the incidents one.

If guaranteed delivery is ever required, the right shape is an outbox table drained
by the existing hourly scheduled task — not retries inside the request.

## Known gaps

**The agent cannot open a ticket on a customer's behalf.** INSERT is
`WITH CHECK (requester_id = auth.uid())`, so it can only file as itself. If Buzz
needs to create tickets for customers (say, from an inbound email), add a
`SECURITY DEFINER` RPC — `create_ticket_for(requester, subject, body, portal)` —
rather than widening the INSERT policy. The RPC can validate input and write an
`admin_audit_log` row, which a policy cannot.

**The agent can read care notes,** via the staff profiles policy described above.
Narrowing that is a deliberate piece of work, not a config change, because the
admin views depend on it.

**Agents can triage incidents but shouldn't close harm reports.** Nothing in RLS
stops the agent setting an `abuse` incident to `dismissed` — `trust_safety` grants
UPDATE on the whole row. That boundary is currently convention, not enforcement. If
you want it enforced, the shape is a policy that blocks status transitions to
`resolved`/`dismissed` for the harm categories unless the actor holds `admin`.

**Agent writes are not in `admin_audit_log`.** Direct REST calls bypass the app's
`writeAudit` helper, so agent replies appear in `support_messages` (attributed,
timestamped) but not the audit log. If the audit log needs to be the complete
record, agent writes should go through RPCs that write both.

## Do not

**Do not give Buzz `SUPABASE_SERVICE_ROLE_KEY.** It bypasses RLS entirely — every
senior's care notes, every payment row, every profile. A prompt-injected agent
holding it is a data breach rather than a bug. The whole point of the `support`-role
account is that the database refuses, so the agent's own judgement is not the only
thing standing between an injected instruction and customer data.

**Do not add support endpoints under `/api/public`.** That namespace carries live
Stripe and vendor webhooks and is the one API path the pre-launch gate allows
through (`src/lib/coming-soon-gate.ts`). Widening it weakens a deliberately narrow
hole — and Buzz talking straight to Supabase means the gate never enters into it.

## If an MCP server is wanted

Worth it for one specific reason: **the MCP server holds the credentials, so the
agent never sees them.** A token handed to an agent can be used directly by an
injected instruction; behind MCP the agent can only invoke the tools you defined,
and every call is logged server-side.

Six tools cover the surface above — `list_tickets`, `get_ticket`, `reply`,
`set_status`, `assign`, `search_tickets` — each a thin wrapper over one REST call
with the session refresh handled in one place. It deploys as a second Cloudflare
Worker, which this project is already set up for. Build it once the direct REST
calls are proven in practice, so the tool shapes follow real usage.
