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
| Open a ticket _as a customer_ | yes     | via `agent_create_ticket_for` only                     |

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
`payment_ledger` and `visits`.

An earlier version of this list also claimed `bookings` was among them. That was
wrong: `20260728093000_add_staff_read_bookings.sql` grants bookings to `support`, so
the account could already read them. Corrected rather than quietly dropped, because
this table is the security boundary and an over-tight description of it is as
misleading as an over-loose one.

## Writes go through RPCs, not raw table calls

**Reads use `/rest/v1/<table>` directly. Writes must use the `agent_*` RPCs below.**
An earlier version of this document pointed writes at the tables too; that was
wrong, for three reasons that only show up in production:

- **`last_activity_at` is maintained in application code, not by a trigger.** A raw
  insert into `support_messages` leaves it untouched, and both staff inbox queries
  order by `last_activity_at DESC` — so every ticket an agent replied to would sink
  to the bottom of the queue humans work from. Silent, and the inbox still looks
  healthy.
- **`resolved_at` is derived, not stored by the caller.** `PATCH status=resolved`
  over raw REST leaves it null forever and breaks resolution-time reporting.
- **Approval provenance has nowhere to live.** When a human approves a draft inside
  the agent's own tool, that fact has to cross the boundary, or every write is
  attributed to "the Buzz account" and nobody can answer who authorised it.

All four RPCs are `POST /rest/v1/rpc/<name>` with a JSON body of named parameters,
under the same auth headers as everything else. They rate-limit the caller to 200
agent actions per hour and write `admin_audit_log` on success.

### `agent_post_reply`

```json
POST /rest/v1/rpc/agent_post_reply
{ "_ticket_id": "uuid", "_body": "...", "_internal": false,
  "_approved_by": "approving human's uuid", "_approval_ref": "your approval record id" }
```

Returns the new message id. Bumps `last_activity_at`.

`_internal: true` needs no approver — that's how an agent proposes a draft or shows
its reasoning. `_internal: false` reaches the customer and **requires
`_approved_by`**, which must be a staff user and must not be the agent itself.

### `agent_update_ticket`

```json
{
  "_ticket_id": "uuid",
  "_status": "pending",
  "_priority": "high",
  "_assignee_id": "uuid",
  "_set_assignee": true,
  "_approved_by": "uuid",
  "_approval_ref": "...",
  "_expected_last_activity_at": "2026-08-12T14:00:00+00:00"
}
```

Derives `resolved_at`. `resolved`/`closed` require an approver.

`_set_assignee` exists because null is a meaningful assignee value — omitting the
flag leaves assignment alone, setting it applies `_assignee_id` including null.

`_expected_last_activity_at` is optimistic concurrency: pass the value you read a
moment ago and the call returns **409 Conflict** if anything touched the ticket
since, instead of silently overwriting a human's decision. Pass null to skip.
**Use it.** An agent and a human working the same queue will collide.

### `agent_triage_incident`

```json
{
  "_incident_id": "uuid",
  "_status": "triaged",
  "_severity": 3,
  "_resolution_notes": "...",
  "_approved_by": "uuid",
  "_approval_ref": "..."
}
```

**Always requires an approver**, including for a severity change. Incidents are
reports about something that may have gone wrong for a person in their own home;
that bar is intentional.

Moving an `abuse`, `safety`, or `theft` incident to `resolved` or `dismissed`
additionally requires an approver holding the **`admin`** role. RLS cannot express
that — `trust_safety` grants UPDATE on the whole row — so it is enforced here.
`resolved_by` records the approving human, not the agent.

### `agent_create_ticket_for`

```json
{
  "_requester_id": "customer uuid",
  "_subject": "...",
  "_body": "...",
  "_portal": "senior",
  "_priority": "normal",
  "_category": "billing",
  "_approval_ref": "..."
}
```

Returns the new ticket id. For inbound email or chat picked up outside the app. The
ticket and its opening message are attributed to the **customer**, not the agent, so
it appears in their own portal as their words. Rejects a missing or deleted profile.

### Errors

Failures come back as PostgREST errors with a readable `message`. Handle the status
codes distinctly rather than lumping them as "4xx" — they call for different actions,
and treating them alike is how a bad approver turns into a retry loop.

| Code  | Meaning                                            | What to do                                               |
| ----- | -------------------------------------------------- | -------------------------------------------------------- |
| `200` | Success, value returned                            | —                                                        |
| `204` | Success, void function                             | Not an error                                             |
| `400` | Validation failed, or the hourly rate limit is hit | Fix the input; do not retry                              |
| `403` | Bad or missing approver                            | Escalate to a human; never retry                         |
| `404` | Unknown ticket, incident, or requester             | Fix the input                                            |
| `409` | `_expected_last_activity_at` did not match         | Re-read and decide again — **never** retry the same call |

The 409 is deliberately not a retryable code. An earlier version raised
`serialization_failure` (40001) here, which tells PostgREST the transaction is safe
to replay — so it retried a deterministically failing call and the request never
returned.

### Reading the queue

```http
GET /rest/v1/support_tickets?select=id,subject,body,status,priority,category,portal,requester_id,assignee_id,created_at,last_activity_at&status=eq.open&order=last_activity_at.desc
```

Full thread for one ticket:

```http
GET /rest/v1/support_messages?select=id,author_id,body,internal,created_at&ticket_id=eq.<id>&order=created_at.asc
```

### Writing

Use `agent_post_reply` and `agent_update_ticket` above, not raw table writes. RLS
would permit a direct `POST /rest/v1/support_messages` — `author_id` is still pinned
to your own user id, so you can never forge another author — but it skips the
`last_activity_at` bump and the audit row, which is the bug the RPCs exist to
prevent.

Enum values, for either path. `status`: `open`, `pending`, `resolved`, `closed`.
`priority`: `low`, `normal`, `high`, `urgent`.

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

## Channel routing

Four channels, each with one accountable owner from `RACI.md` — so every event has
someone who answers for it rather than a committee.

| Channel            | Owner | Events                                                                                 | Built?              |
| ------------------ | ----- | -------------------------------------------------------------------------------------- | ------------------- |
| `customer-support` | COO   | `support_ticket.created`, replies awaiting approval, `cs_task` opened, change requests | ticket event live   |
| `safety`           | COO   | `incident.created`, message flags, credential decisions                                | incident event live |
| `growth`           | CEO   | Waitlist signups, partner enquiries                                                    | not built           |
| `platform`         | CTO   | Credential expiry, payout failures, webhook and cron failures                          | not built           |

Route by **who acts and how fast**, not by which table the row came from. The split
that carries weight is `customer-support` from `safety`: a billing question and an
allegation about a caregiver's conduct need different audiences, different urgency,
and different retention. Merging them means either over-exposing the second or
under-reacting to it.

Today the sender emits two event types. Buzz should switch on the `event` field
rather than assuming one destination, so adding the rest is a routing change on its
side and not a rebuild.

### Rules worth setting before volume arrives

- **One message per item, everything else in-thread.** Keeps the channel scannable
  and gives each item's approval conversation a home. Without it, several event
  types make a channel unreadable within a week.
- **Dedupe on `x-companioncare-delivery-id`.** Webhook pushes and reconcile sweeps
  overlap by design; that header is how the same ticket avoids being posted twice.
- **Only `urgent` mentions anyone.** Already computed server-side for incidents
  (harm categories, or severity >= 3). If everything pings, nothing does.
- **Short retention and restricted membership on `safety`.** Those payloads
  reference allegations. The sender deliberately includes no names and only a
  280-character preview, but the channel is still a searchable record that outlives
  the admin queue — an incident can be dismissed while the message stays forever.
- **Digest unacknowledged items daily rather than re-alerting.** Repeat pings train
  people to ignore the channel.

### Approving from a channel needs an identity mapping

`agent_post_reply` requires `_approved_by` to be a real staff uuid and rejects
self-approval. So a chat-button approval only works if the bot can map the clicking
chat user to their CompanionCare account.

Without that mapping the tempting shortcut is to hardcode one admin's uuid for every
approval, which makes the audit trail lie about who authorised what — and that audit
trail is most of the reason the RPCs exist. Two honest options:

1. **Approve in the agent's own tool or the admin console**, where the human is
   already authenticated, and have the channel post a link. Works immediately.
2. **Build the mapping** — chat user id to CompanionCare uuid, populated once — and
   then channel-button approvals are genuine.

Start with the first. Getting it wrong the other way is expensive to unwind, because
you cannot retroactively reconstruct who actually decided.

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

### Credential expiry payload

```json
{
  "event": "credential_expiry.warning",
  "id": "credential-expiry-2026-08-12",
  "expiring": [
    {
      "credential_id": "uuid",
      "provider_id": "uuid",
      "provider_name": "Andrea Rivera",
      "kind": "background_check",
      "expires_on": "2026-08-19",
      "days_until_expiry": 7
    }
  ],
  "already_expired_count": 1,
  "already_expired_sample": [
    {
      "credential_id": "uuid",
      "provider_id": "uuid",
      "provider_name": "Diego Martinez",
      "kind": "license_check",
      "expires_on": "2026-08-03",
      "days_overdue": 9
    }
  ],
  "urgent": true,
  "admin_url": "https://getcompanioncare.com/admin/credentials"
}
```

A digest, not one event per credential — a batch of renewals is one post rather than
twenty.

**It fires only on the day a credential crosses 30, 14, 7, 1 or 0 days**, not every
day it sits inside the window. That is what keeps the channel worth reading: a
warning repeated daily for a month gets muted, and then the real one is missed too.
Because it is stateless, a run missed during an outage skips that threshold rather
than catching up — there are four more chances.

`already_expired_*` is the part that matters most. Those are credentials whose date
has passed while the row still says `passed`, so the provider reads as verified and
can keep taking bookings. Reported as a count plus up to five named examples, so the
backlog stays visible without renaming everyone every day.

**Provider names are included here**, unlike incident payloads. A lapsed licence is
an operational fact about a contractor rather than an allegation about a person, and
whoever picks it up needs to know who to chase. No contact details either way.

`id` is stable per calendar day, so deduping on `x-companioncare-delivery-id` drops a
second post if the task ever runs twice.

**The sweep does not change any state.** It would be one line to flip a lapsed row to
`expired`, but that un-verifies a provider and may stop them working — a decision for
a person looking at the case, not a cron job. Acting on the alert is a human step.

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

### New items only — never backfill

The channel carries **newly arrived** tickets and incidents, not history. Two rules
make that hold:

**Initialise the cursor to now, not to zero.** On a first run with no stored
high-water mark, set it to the current time and post nothing. An unset cursor
defaulting to epoch means `created_at=gt.1970-01-01`, which matches every ticket the
platform has ever had and dumps the entire backlog into the channel in one burst.
That is the failure mode to design against, and it is easy to ship by accident.

**Filter on `created_at`, not `last_activity_at`.** They differ in a way that
matters here: `created_at` is when the item arrived and never changes, so it gives
exactly "new since I last looked". `last_activity_at` moves every time anyone
replies, so filtering on it re-surfaces old tickets as though they were new each time
a human touches one.

Two consequences worth planning for:

- **Advance the cursor only past items you have actually posted.** Persist it after
  the post succeeds, not before the query — otherwise a crash between the two loses
  items silently, which is the exact thing reconciliation exists to prevent.
- **A long outage produces a large batch.** If Buzz is down for a day, the next sweep
  legitimately returns a day of items. Prefer that over losing them, but cap what
  goes to the channel in one pass and post a summary line for the remainder rather
  than several hundred messages.

If guaranteed delivery is ever required, the right shape is an outbox table drained
by the existing hourly scheduled task — not retries inside the request.

## Known gaps

**Direct INSERT on `support_tickets` is still restricted** to
`requester_id = auth.uid()`, which is correct for the browser and was left alone
deliberately. Filing on a customer's behalf goes through
`agent_create_ticket_for`, which validates the requester and writes an audit row —
things an RLS policy cannot do.

**Writes through the `agent_*` RPCs are audited; raw table writes are not.** That is
the other reason to use them: the RPC records the actor, the approving human, and
your approval reference in `admin_audit_log`. A raw PATCH records nothing.

**Approval state lives in Buzz, not here.** CompanionCare stores _that_ a named
human approved a given action, via `_approved_by` and `_approval_ref`, but not the
draft history or the reasoning. If approval history needs to be reviewable from the
CompanionCare admin console rather than only from Buzz, that wants a
`support_reply_drafts` table — a design decision, not a gap in this contract.

**No SLA or staleness sweep yet.** Nothing notices a ticket sitting untouched. The
hourly scheduled task on the CompanionCare side is the natural home for that;
until it exists, staleness detection is Buzz's job.

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
