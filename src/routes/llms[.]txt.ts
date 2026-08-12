import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";

import { isComingSoonEnabled } from "@/lib/coming-soon-gate";

/**
 * A route for the same reason as robots[.]txt.ts — the gate can't reach static
 * assets, and an llms.txt that enumerates 30 gated marketing pages to AI
 * crawlers is exactly what we're trying to avoid before launch.
 *
 * The version this replaced (public/llms.txt, now deleted) still said
 * "CareMatch" from before the rebrand, and quoted hourly rates that no longer
 * match src/lib/pricing-tiers.ts. The live copy below points at /pricing rather
 * than restating rates, so it can't drift again.
 */

const GATED = `# CompanionCare

> CompanionCare is a marketplace for verified in-home help for older adults. It is not open to the public yet.

The site is pre-launch and intentionally not indexable. There is no public content to summarize or cite.

For launch timing or press enquiries: press@getcompanioncare.com
`;

const LIVE = `# CompanionCare

> CompanionCare is a marketplace that matches older adults and their families with verified in-home helpers for companionship, personal care, housekeeping, errands, and respite care.

CompanionCare verifies every helper across five continuous stages: identity proofing with a liveness selfie, a national multi-jurisdiction background check, credential and license verification against state registries, re-verification every 30 days, and a live selfie match plus GPS check-in at the start of every visit.

The older adult is the decision-maker. Family members propose visits and can be granted scoped, revocable permission to view, modify, or handle payment — but the senior approves it, and can revoke it in one tap. There are no bookings made without their knowledge.

Accessibility is a first-class feature rather than a compliance checkbox: WCAG 2.2 AA, a Large Text Mode that scales the whole interface, voice input on every field, high-contrast mode, and one question per screen. Support is email and in-app messaging — CompanionCare does not operate a phone line — and a real person replies within one business day.

Helpers set their own hourly rates, so pricing varies by service and market. Current rates and the platform service fee are on the pricing page. Billing is per completed visit — there is no subscription. Skilled clinical care is referred to Medicare-certified home health agencies rather than billed by CompanionCare, and personal care in some states is delivered by state-licensed agency partners.

## Pages
- [Home](/): What CompanionCare is and how the marketplace works
- [How it works](/how-it-works): From first question to verified visit
- [Trust & verification](/trust): The five-stage verification system explained
- [Pricing](/pricing): Current hourly rate ranges by service and the service fee
- [FAQ](/faq): Cost, verification, cancellation, insurance, and safety
- [About](/about): Mission, values, and where the company actually is today
- [Contact](/contact): Email support, in-app messaging, and safety escalation

## Services
- [All services](/services): The full spectrum of in-home help
- [Marketplace](/services/marketplace): Everyday help booked directly from independent helpers
- [Partners](/services/partners): Personal care delivered through state-licensed home care agencies
- [Healthcare](/services/healthcare): Skilled nursing and therapy referred to Medicare-certified agencies
- [Companionship](/services/companionship): Conversation, activities, walks, appointment company
- [Personal care](/services/personal-care): Bathing, dressing, mobility, medication support (CNA/HHA)
- [Housekeeping](/services/housekeeping): Cleaning, laundry, meal preparation
- [Errands & transport](/services/errands): Groceries, pharmacy, rides to appointments
- [Respite care](/services/respite-care): Short-term relief for family caregivers

## Who it's for
- [For families](/for-families): Coordinate care for a parent from anywhere, with the senior in control
- [For caregivers](/for-caregivers): Join the verified helper network — set your own rate, keep your clients

## Resources
- [All resources](/resources): Full guide index
- [Cost of in-home care](/resources/cost-of-in-home-care): What in-home care costs and how it compares
- [Signs a parent needs help](/resources/signs-parent-needs-help): What to look for and what to do next
- [Medicare & Medicaid home care](/resources/medicare-medicaid-home-care): What each program does and doesn't cover
- [How to choose a caregiver](/resources/how-to-choose-a-caregiver): Questions to ask and red flags to walk away from
- [Aging-in-place checklist](/resources/aging-in-place-checklist): Room-by-room safety and planning guide

## Legal
- [State availability](/legal/state-availability): Where CompanionCare operates today
- [Scope of practice](/legal/scope-of-practice): What helpers can and cannot do
- [Privacy Policy](/legal/privacy)
- [Terms of Service](/legal/terms)

## Optional
- [Email support](mailto:support@getcompanioncare.com): Replies within one business day
`;

export const Route = createFileRoute("/llms.txt")({
  server: {
    handlers: {
      GET: async () => {
        const gated = isComingSoonEnabled(process.env.COMING_SOON);
        return new Response(gated ? GATED : LIVE, {
          headers: {
            "Content-Type": "text/plain; charset=utf-8",
            "Cache-Control": gated ? "public, max-age=300" : "public, max-age=3600",
          },
        });
      },
    },
  },
});
