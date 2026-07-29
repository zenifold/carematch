# Backlog

Living list of product/engineering backlog items. New entries get appended under
**New items**, tagged with source and date. Once shipped, move to **Done**.

---

## New items

### Caregiver continuity for recurring bookings
- **Source:** Care Companion team meeting, 2026-07-28
- **Why:** Real complaint from a family member's own experience with a competitor —
  booked a recurring M/W/F schedule but got "whoever was available" each visit,
  never the same caregiver. Continuity of care matters a lot for this population.
- **What:** The booking flow already has a "same time every week?" recurring
  toggle, but nothing routes repeat bookings back to the same provider. Add a
  "regular caregiver" concept tied to a recurring schedule; matching should try
  the previous provider first before falling back to "anyone available."

### Provider offboarding reason capture
- **Source:** Care Companion team meeting, 2026-07-28
- **Why:** "We should know the reason why they left" — no reason is captured today
  when a provider deactivates, so there's no visibility into how much churn is
  "found other work" vs. "family hired them full-time off-platform" (the two
  reasons identified in the meeting).
- **What:** Required reason code on provider deactivation (found other work /
  hired full-time by family off-platform / avoiding fees or taxes / other),
  feeding retention analytics.

### Cancellation policy — not yet defined
- **Source:** Care Companion team meeting, 2026-07-28
- **Why:** No fee or notice-window concept exists today for booking cancellations
  by either party.
- **What:** Blocked on research (care.com's cancellation + matching etiquette,
  assigned for the next team meeting). Revisit once that comes back.

### Decision needed: who pays for the background check
- **Source:** Care Companion team meeting, 2026-07-28
- **Why:** Rover charges the *provider* $49 upfront for their background check
  (deducted from their account, not billed to the family). CareMatch doesn't
  currently charge providers anything for verification.
- **What:** Decide whether to pass the real background-check vendor cost to
  providers (Rover's model) or absorb it, before activating a real vendor
  (Checkr/Certn — currently still set to `"manual"`).

---

## Confirmed — already built, no action needed

Noted so these don't get re-proposed; each was raised in the 2026-07-28 meeting
as something to build, and each already exists:

- **Pay-as-you-go, no monthly subscription** — senior sets a spending cap
  (`monthly_budget_cents`) that's a limit, not a tracked commitment; billing is
  per completed visit via Stripe. Matches the meeting's explicit differentiation
  strategy against care.com's subscription-heavy model.
- **Independent senior/family accounts, invite either direction** — either the
  senior or a family member can sign up first and invite the other
  (`family_links`, `family_invites`, `senior_invites`).
- **Schedule-on-behalf-of vs. view-only permissions** — the `view`/`modify`/
  `financial` permission tiers on `family_links` already cover this.
- **Explicitly not leaning on paid verification badges/upsells** — raised as a
  possible revenue lever (like Rover's paid "verified badge"), then explicitly
  set aside by the team in the same meeting. Matches the no-paywall product
  direction already locked in — don't reintroduce this.

---

## Tracked — pending external decisions, not yet actionable

- **Company name / domain** — leading candidate discussed: "Care Companion"
  (reversing "Companion Care"). Not final. Will need a rebrand pass through the
  codebase (branding strings, metadata, `SITE_URL` constant, etc.) once decided —
  not urgent before then.
- **Open legal question**: whether recurring/standing weekly scheduling *through
  the marketplace* risks reclassifying the caregiver relationship (1099 vs.
  household employee) under Virginia law. Flagged for an attorney, not something
  to build around yet.

---

## Done

### Off-platform migration detection in messaging — shipped 2026-07-29
A trigger on `messages` insert regex-scans for phone numbers, email addresses,
and off-platform phrases; matches flag into a new `message_flags` table with a
staff review section on the admin Trust & Safety page (dismiss as false
positive, or mark handled). Doesn't block the message itself. Verified live:
phone-number and off-platform-phrase test messages correctly flagged, a clean
message correctly didn't. Commit `7144bfc`.

### Legally-required scope-of-care training content — shipped 2026-07-29
Turned out to be more built than the meeting realized — the scope-of-practice
lesson and a scenario question already existed. The actual gap was narrower:
"transferring in or out of bed or chairs" wasn't covered, and the
fall-prevention lesson read ambiguously rather than clearly hands-off. Added
that explicitly to both lessons plus a 7th scenario question; pass_threshold
bumped from 5/6 to 6/7. Commit `d68ea67`.

### Liability insurance nudge for providers — shipped 2026-07-29
A card on the provider Earnings page recommending general liability insurance,
routed to the existing support-ticket flow rather than an external link since
no partner is chosen yet. Commit `e845fc5`.
