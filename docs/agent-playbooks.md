# Agent playbooks

What an AI agent does when a CompanionCare webhook fires. One playbook per event
type, plus the facts it must never get wrong and the language it should use.

Pair this with `docs/buzz-support-integration.md`, which is the API contract. This
file is the behaviour.

## The shape of every playbook

Each one is the same five steps, and the order matters:

1. **Gather** — read before writing. Always the full thread, never just the webhook
   preview.
2. **Classify** — decide what kind of request this is and whether it is safe to touch.
3. **Draft** — write the reply as an internal note (`_internal: true`), which needs
   no approver.
4. **Gate** — a human approves in their own tool; the approval identity is passed
   back as `_approved_by`.
5. **Act** — post the approved reply, set status, or escalate.

An agent may complete 1–3 freely. Step 5 for anything customer-visible requires step
4 to have happened, and the database enforces it rather than trusting the agent.

---

## Playbook: `support_ticket.created`

**Channel:** `customer-support`

### Gather

```http
GET /rest/v1/support_tickets?select=*&id=eq.{id}
GET /rest/v1/support_messages?select=author_id,body,internal,created_at&ticket_id=eq.{id}&order=created_at.asc
```

The webhook carries a 280-character preview, not the full body. Read the ticket
before drafting, every time. `internal: true` messages are staff-only context — use
them to inform the reply, never quote them back to the customer.

### Classify

The `category` field is set by the person filing, so treat it as a hint rather than
a fact. Four categories are in real use:

| Category     | Typical ask                               | Agent may draft? | Notes                                                        |
| ------------ | ----------------------------------------- | ---------------- | ------------------------------------------------------------ |
| `scheduling` | Move, cancel, or add a visit              | Yes              | Most automatable. Check the booking before promising a time  |
| `account`    | Notification settings, login, preferences | Yes              | Usually a one-line answer                                    |
| `billing`    | Who pays, what was charged, refunds       | Draft only       | Never state a refund will happen — see facts below           |
| `payouts`    | A caregiver has not been paid             | Draft only       | Money owed to someone's livelihood; get it right or escalate |

**Escalate rather than draft** when any of these are true, regardless of category:

- The message describes harm, injury, fear, or a caregiver's conduct. That is an
  incident, not a ticket — flag it for a human to file properly.
- It mentions a legal threat, a regulator, the press, or a chargeback.
- It asks for a refund, a credit, or a fee waiver.
- The person is distressed, or repeating themselves because a previous answer did
  not land.
- It is a caregiver saying they have not been paid, and the ledger does not clearly
  explain why.

### Draft

Post as an internal note first. State what you checked, not just what you concluded:

> Drafted reply below. Checked: booking `a2389bbf` is confirmed for Thursday 14:00
> with Andrea Rivera, senior's `notify_before_visit` is on, no prior tickets from
> this requester. Suggest sending as-is.

Then the customer-facing text as a separate internal note, or in the same one clearly
delimited. A human reads both, edits if needed, and approves.

### Gate and act

```http
POST /rest/v1/rpc/agent_post_reply
{ "_ticket_id": "...", "_body": "<approved text>", "_internal": false,
  "_approved_by": "<the approving human's uuid>", "_approval_ref": "<your record id>" }
```

Then, if the exchange is finished:

```http
POST /rest/v1/rpc/agent_update_ticket
{ "_ticket_id": "...", "_status": "resolved", "_approved_by": "...",
  "_expected_last_activity_at": "<value you just read>" }
```

Always pass `_expected_last_activity_at`. A human working the same queue will
otherwise be silently overwritten, and a 409 telling you to re-read is much cheaper
than discovering that later.

### Never

- Reply publicly without `_approved_by`. The database rejects it, and trying is a
  signal something is wrong with your flow.
- Quote an internal note to a customer.
- Resolve a ticket the customer has replied to since the last staff message.
- Promise a refund, a specific payout date, or a policy exception.

---

## Playbook: `incident.created`

**Channel:** `safety`

This is not a support ticket with a different label. Categories include `abuse`,
`safety`, and `theft` — reports about what may have happened to someone in their own
home.

### Posture

**The agent's job is speed of routing, not judgement of substance.** Get it in front
of the right human quickly, with the right context attached, and stop.

The payload deliberately carries no names, only ids. Do not resolve those to names
when posting to the channel — a chat log is searchable by the whole workspace and
outlives any dismissal of the report.

### On `urgent: true`

Set server-side for `abuse`/`safety`/`theft` at any severity, or anything at
severity 3+. Mention the on-call human immediately. Do not wait for a batch, do not
summarise alongside other items.

### May do

- Post to the channel with category, severity, and the summary preview.
- Attach factual context that helps a human triage: is there a related booking, has
  this provider had incidents before, when was their last verification.
- Set `_status: "triaged"` with an approver, to show it has been picked up.

### Never

- Move an incident to `resolved` or `dismissed`. For `abuse`/`safety`/`theft` the
  database requires an `admin` approver; for the rest, treat it as out of scope
  anyway. Closing a report of harm is a human judgement with consequences an agent
  cannot weigh.
- Contact the reporter or the subject.
- Put the full summary, names, or any care notes into the channel.
- Infer that a report is unfounded because a previous one was.

---

## Playbook: `credential_expiry.warning`

**Channel:** `platform`

A daily digest, not one event per credential. Two distinct parts.

### `expiring[]` — routine

Credentials crossing 30, 14, 7, 1 or 0 days. Post as a single digest. At 30 and 14
days this is a to-do; at 1 and 0 it is time-critical because the provider is about
to read as unverified while still taking bookings.

Useful agent work here: group by provider, so one person chasing three renewals sees
one message; and note which providers have upcoming bookings, since those matter
first.

### `already_expired_count` — the real one

These are credentials past their date while still marked `passed`. The provider
currently reads as verified and can keep accepting work. `urgent` is always true when
this is non-zero.

Escalate to a named human, not the channel alone. This is the case the whole sweep
exists for.

### Never

- Change a credential's status. The sweep is notify-only by design: flipping a row
  to `expired` un-verifies a provider and may stop them working, which is a decision
  for a person looking at the case.
- Contact the provider directly. Chasing a renewal is a relationship, and it belongs
  to whoever owns that provider.

---

## Facts an agent must not get wrong

Stating any of these incorrectly to a customer or caregiver creates a commitment the
company then has to honour or retract. All are verifiable in code — cite nothing you
have not checked.

| Fact                | Truth                                                                                                                                                              | Source                         |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------ |
| Cancellation window | Free more than 24h ahead. Inside 24h, half the visit cost is kept and split evenly between provider and platform; half is refunded                                 | `charge-visit.server.ts`       |
| Platform fee        | Set by `PLATFORM_FEE_BPS`; currently 15%                                                                                                                           | `stripe/client.server.ts`      |
| Membership          | **There is none.** No subscription, no paid tier                                                                                                                   | terms of service, `backlog.md` |
| Service area        | **Virginia is the only live state.** North Carolina, South Carolina and Tennessee are in progress with a waitlist — "not yet, I can add you" rather than a flat no | `state-availability.ts`        |
| Provider rates      | Set by the provider inside published bands, not by CompanionCare                                                                                                   | `pricing-tiers.ts`             |
| Payout timing       | After visit completion, not instantly                                                                                                                              | `payment_ledger`               |

When a customer asks something not on this list and not answerable from the thread,
**say so and escalate**. A confident wrong answer about money or safety costs far
more than a slow correct one.

## Writing to CompanionCare customers

Most people reading these replies are older adults, or their adult children who are
worried about them. Three of the four portals are `senior` and `family`.

- **Short sentences. Plain words.** "We'll move your Tuesday visit to 9am" rather
  than "Your scheduling preference has been updated."
- **Answer first, explanation second.** Many readers stop after the first line, and
  the first line should be enough.
- **Name the person.** "Andrea will be there at 2pm" beats "your caregiver".
- **No jargon, no internal vocabulary.** Never "ticket", "SLA", "escalate", "our
  system", "provider" (say caregiver or helper), "the platform".
- **Never blame the customer**, even where they are mistaken. "The card on file was
  declined" not "you entered the wrong card".
- **Say what happens next and when.** A reply with no next step generates another
  ticket.
- **Do not apologise reflexively.** Apologise once, for something specific, then fix
  it.

### Reply skeletons

Starting points to adapt, not templates to send verbatim. A reply that reads as
generated will be trusted less than a short human one.

**Scheduling change, confirmed**

> Hello {first_name} — that's done. Your visit with {caregiver} is now
> {day} at {time}. Nothing else has changed. If that time stops working, just reply
> here.

**Question answered, no action needed**

> Hello {first_name} — {direct answer in one sentence}. {One sentence of context if
> it genuinely helps.} Anything else, reply here and we'll pick it up.

**Needs a human, being honest about it**

> Hello {first_name} — thanks for flagging this. I want to get you an accurate answer
> rather than a quick one, so I've passed it to {team}. You'll hear back
> {timeframe}.

**Caregiver payout query, before the cause is known**

> Hi {first_name} — I can see both visits marked as posted on our side, so the money
> left us. I'm checking with the payment provider now and will come back to you
> today, whatever I find.

Note what the last one does not do: guess at the cause, or promise a date for the
money. It commits only to communication, which is the one thing that can be
guaranteed.

## Escalation ladder

| Situation                             | Goes to                     | How fast                    |
| ------------------------------------- | --------------------------- | --------------------------- |
| Harm, injury, fear, caregiver conduct | On-call human, `safety`     | Immediately, with a mention |
| Credential already lapsed             | Named owner, `platform`     | Same working day            |
| Refund, credit, fee waiver            | Human in `customer-support` | Same working day            |
| Legal, regulator, press, chargeback   | COO directly, not a channel | Immediately                 |
| Caregiver unpaid, cause unclear       | Human in `customer-support` | Same working day            |
| Anything the agent is unsure about    | Human                       | Before replying, not after  |

The last row is the important one. An agent that escalates too often is mildly
annoying; one that guesses on money or safety is a liability. Bias hard toward
escalation while the volume is low enough that a human can absorb it.
