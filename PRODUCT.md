# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

**Primary: the older adult.** They need help at home and they hold the decision about who
enters it. Often managing the arrangement themselves, sometimes with a family member helping.
Frequently not confident with technology, which the interface treats as a design requirement
rather than an edge case.

**Family members**, usually adult children, often out of state. They want to know a parent is
okay and to help arrange care without taking the decision away.

**Caregivers** (called "helpers" in user-facing copy, "providers" in the system): CNAs, HHAs,
experienced companionship and homemaker workers, drivers, and licensed clinicians. They set
their own rates and choose their own schedules.

**Partner organizations**, who have no account role: state-licensed home care agencies,
Medicare-certified home health agencies, hospital discharge planners, senior living
communities, and Area Agencies on Aging.

## Product Purpose

A marketplace where older adults find and book verified in-home help: companionship,
housekeeping, errands, meal prep, transportation, tech help, and personal care. Success is a
senior who chose their own helper, sees the same face week after week, and stayed in control of
who comes into their home.

## Positioning

**The older adult decides.** Family members propose; the senior approves. Access is scoped
(view, modify, or financial), granted by the senior, and revocable in one tap. No bookings
happen without their knowledge. Competitors sell to the adult child and treat the senior as the
subject of care rather than the customer, and that inversion is the thing a neighboring product
cannot copy without rebuilding its permission model.

Secondary: a marketplace, not a package. Helpers set their own rates, and the senior sees a
total before booking rather than an agency invoice afterward.

## Operating Context

Pre-launch. The public site is gated behind a coming-soon page; every marketing route redirects
there while `COMING_SOON=1`, and a shared password at `/employee` issues a preview cookie for
the team.

Rollout is state by state, gated by licensing and by how many verified helpers are on the
ground. Virginia is live for companionship and household help. North Carolina, South Carolina,
and Tennessee are in progress. The canonical list is `src/lib/state-availability.ts`, shared by
the coming-soon page and `/legal/state-availability`.

Three service lines with different delivery models: the marketplace (CompanionCare's own 1099
network), partners (personal care through state-licensed home care agencies, because
CompanionCare is not a licensed agency), and healthcare (skilled nursing and therapy referred
to Medicare-certified agencies and billed by them, not by CompanionCare).

Support is email and in-app messaging. **There is no phone line**, and none is planned; the
concierge phone channel was removed from the product in August 2026. A real person replies
within one business day. Safety reports jump the queue. Emergencies route to 911.

## Capabilities and Constraints

- Booking, scheduling, messaging, and per-visit billing through Stripe. Provider-set hourly
  rates with a 15–18% service fee (15% for skilled nursing), shown as one total before booking.
- Rate bands live in `src/lib/pricing-tiers.ts` and are the only place rates may be quoted from.
- Billing is per completed visit. The senior sets a spending cap that acts as a limit, not a
  commitment.
- Family access is scoped and revocable, enforced by row-level security.
- CompanionCare is not a home care agency, a medical provider, or a HIPAA-covered entity, and
  does not employ personal care aides or clinicians.
- Helpers are 1099 independent contractors. Because platform control over rates, scheduling,
  and required conduct is what a classification test examines, changes to those controls are a
  legal question and not only a product one.

**Explicitly undecided.** Future work must not resolve these by assumption:

- **Membership tier.** Whether a paid membership exists is open. Nothing implements one: no
  table, no Stripe subscription, and `backlog.md` commits to pay-as-you-go as positioning
  against care.com. The terms of service and `/family/budget` both already stated that no
  membership fee is charged, so `/pricing`'s "CompanionCare Plus — $29/month" section was the
  lone outlier and has been removed. Don't publish a price until the tier exists.

**Corrected.** The cancellation policy was previously recorded here as undecided and unbuilt.
That was wrong, and acting on it would have deleted accurate copy:

- **Cancellation policy is implemented and documented correctly.**
  `src/lib/stripe/charge-visit.server.ts` defines `LATE_CANCEL_WINDOW_MS` at 24 hours and
  `refundCancelledBooking` applies it — full refund outside the window; inside it, half the
  visit cost is kept and split evenly between provider and platform, half refunded. It skips
  bookings already paid out. The 13 places that describe this (including the terms of service)
  match the code, down to the even split. Change the constant and the copy together.

## Brand Commitments

- Name: CompanionCare. Domain: getcompanioncare.com. Support: support@getcompanioncare.com.
- Existing visual system in `src/styles.css`: sage green primary, warm terracotta accent, warm
  cream ground, Fraunces serif for headings, Inter for body, 1rem base radius. Treat as
  incumbent design authority.
- **Voice: candid about being new.** The homepage states "No stock testimonials. Just what we
  promise," and `/about` says "instead of borrowed statistics, here is what is true today."
  Future copy inherits this. No invented proof, no borrowed metrics, no manufactured urgency.
- User-facing vocabulary: "helper" in prose, "provider" in the system, "senior" or "older
  adult" rather than "client" or "patient".

## Evidence on Hand

- 18 photographs in `src/assets/`, including per-audience portraits (`auth-senior.jpg`,
  `auth-family.jpg`, `auth-provider.jpg`) and lifestyle imagery (`hero.jpg`, `hands-tea.jpg`,
  `caregiver-plants.jpg`).
- Real per-state availability data and real rate bands, both in shared modules.
- Pre-launch interest signups in the `waitlist_signups` table, readable at `/admin/waitlist`.

**Absences future work must not fabricate:**

- **No customer testimonials, reviews, ratings, or case studies exist.** The named quotes on
  `/auth` are illustrative personas, not real customers. Do not present them as reviews or add
  more.
- No usage metrics, customer counts, or outcome statistics exist.
- Verification is currently **manual**. `BACKGROUND_CHECK_VENDOR` and `IDV_VENDOR` are both set
  to `"manual"`. Public pages must not name a verification vendor or imply automated 30-day
  re-checks until those integrations are live. The five-stage process may be described as
  process; the automation may not be claimed.

## Product Principles

1. **The senior is the customer.** When a design decision would be easier by routing around
   them, it is the wrong decision.
2. **Show trust, don't assert it.** Describe the mechanism that earns confidence rather than
   using adjectives about safety.
3. **Claim only what exists.** The candid-about-being-new voice is an asset and it is
   load-bearing; one inflated claim costs more than a weak one gains.
4. **Accessibility is a feature, not compliance.** It is a primary reason this audience can use
   the product at all.
5. **Supply is the constraint.** Copy and design that generate demand ahead of verified local
   helpers create a broken first experience.

## Accessibility & Inclusion

WCAG 2.2 AA is a build gate, not an aspiration. Shipped and to be preserved:

- Large Text Mode scaling the whole interface (17px base, 20px large, 23px extra-large), driven
  by `html[data-text-size]` and `src/hooks/use-senior-preferences.tsx`.
- High-contrast mode via `html[data-contrast="high"]`, and reduced motion via
  `html[data-motion="reduce"]`.
- Voice input on form fields; one question per screen in flows.
- Native form controls preferred over custom widgets, so platform keyboard and screen-reader
  behavior is inherited rather than reimplemented.
- Touch targets at 44px minimum.
