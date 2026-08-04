// DRAFT — pending attorney review. Provider-only agreement.
//
// Deliberately framed as a pure marketplace-participation agreement, NOT an
// independent contractor agreement — CompanionCare does not engage, hire, or
// contract with Providers in any capacity. This is a meaningful legal
// distinction, not just wording: an "independent contractor agreement"
// implies CompanionCare is the one retaining the Provider to perform services
// (the exact framing that's exposed platforms like Uber to worker-
// misclassification claims). Here, CompanionCare is structured as a neutral
// technology platform — closer to how Airbnb or Etsy relate to hosts/sellers
// — and Providers are independent businesses who use the Service to find
// their own clients. Services are provided directly to the Care Recipient,
// never to or on behalf of CompanionCare.
//
// Mirrors the scope-of-practice language already shipped in
// provider-training-content.ts (Lesson 5 + the fall-prevention lesson) so the
// legal document and the actual training a Provider completes say the same
// thing — a mismatch between the two would be its own liability problem.

export const PROVIDER_AGREEMENT = {
  version: "1.0.0",
  effective_date: "2026-08-01",
  title: "Provider Agreement",
  body: `
# CompanionCare Provider Agreement

**Version 1.0.0 — Effective August 1, 2026**

This Provider Agreement ("Agreement") governs your use of the CompanionCare marketplace to offer companion care services and connect with Care Recipients, and applies to **Marketplace-tier companion care** specifically. By accepting this Agreement, you agree to the terms below in addition to CompanionCare's general Terms of Service.

*[Scoping note for the team, not the Provider: CompanionCare's existing marketing pages (/legal/independent-contractors, /legal/state-availability) describe a three-tier model where higher tiers ("Partners" for personal care, "Healthcare" for skilled/clinical) are delivered by W-2 employees of separate licensed partner agencies — while the product actually built treats every provider identically via Stripe Connect, regardless of credential tier. This Agreement is written for what's actually built today. If/when a real partner-agency referral model is built, those providers would need an entirely different legal relationship (a referral/vendor agreement between CompanionCare and the partner agency, not this document) — worth resolving which vision is the near-term real one.]*

## 1. CompanionCare Is a Marketplace, Not Your Employer or Client

CompanionCare operates a technology platform that helps you find, schedule, and get paid by Care Recipients. **CompanionCare does not engage, hire, retain, or contract with you to perform any services.** You are an independent business. Any care services you provide are provided directly to the Care Recipient who books you — never to CompanionCare, and never on CompanionCare's behalf.

CompanionCare does not direct or control how you perform care, does not supervise your work, and does not require exclusivity — you're free to offer your services through other platforms or directly to clients you find outside CompanionCare. Nothing in this Agreement creates an employment, agency, partnership, contractor, or joint-venture relationship between you and CompanionCare.

**If a family you meet through CompanionCare later hires you directly, outside the marketplace,** CompanionCare's verification, payment handling, and support no longer apply to that relationship — it's between you and that family. Depending on the arrangement, you may become that family's household employee under applicable law; understand the tax and legal implications of that before agreeing to it.

## 2. Scope of Services — Companion Care Only

Unless CompanionCare has verified you for a higher credential tier (such as PCA, HHA, CNA, or a clinical license) and you are matched for a booking requiring that credential, you provide **companion-tier care only**. This means:

**You may:** provide companionship and conversation, light housekeeping, meal preparation, transportation and errands, and *remind* a Care Recipient to take medication that they administer themselves.

**You may not:** administer medication, provide wound care, physically assist with bathing or toileting, or physically assist a transfer in or out of a bed, chair, or toilet — even if asked to by the Care Recipient or their family. If you are asked to do any of these things, decline and report it through the Service. Declining a request outside your scope is never grounds for a negative rating or account action against you.

Performing services outside your verified scope is a violation of this Agreement, and you assume personal responsibility and liability for doing so.

## 3. Verification and Training

You must complete CompanionCare's identity verification, background check, and required training modules (and keep them current) to remain visible on the marketplace and eligible for bookings. CompanionCare may restrict your access to the marketplace if your verification lapses or a background check reveals disqualifying information.

## 4. Payment

You are paid through CompanionCare's payment system (Stripe Connect) for completed, verified visits, at your disclosed hourly rate, less CompanionCare's platform fee. Payment is issued automatically after a visit is marked complete. CompanionCare processes this payment as the platform facilitating your marketplace transaction — not as compensation CompanionCare owes you for services rendered to CompanionCare.

## 5. Taxes

You are responsible for your own federal, state, and local taxes, including self-employment tax, on income you earn through the marketplace. CompanionCare (or its payment processor) will issue you the applicable IRS form (such as a 1099-NEC or 1099-K) for earnings that meet the reporting threshold, as required by law. CompanionCare does not withhold taxes from your payments.

## 6. Insurance

CompanionCare does not provide workers' compensation coverage, because you are not our employee and a Care Recipient's home is not a CompanionCare worksite. **We strongly recommend you obtain your own general liability and/or occupational accident insurance** to protect yourself against claims of accidental injury or property damage while providing services. This is a recommendation, not a requirement of this Agreement, but the financial risk of not carrying it is yours alone.

## 7. Code of Conduct

You agree to:

- Communicate with Care Recipients and Family members only through the CompanionCare app, not personal contact information
- Never accept cash, gifts of significant value, or off-platform payment for a booking made through CompanionCare
- Report safety concerns, falls, or requests to perform services outside your scope through the Service promptly
- Treat every Care Recipient with respect and patience, consistent with CompanionCare's caregiver training

## 8. Liability and Indemnification

You are personally responsible for your own conduct while providing services, including any injury, property damage, or other harm you cause. You agree to indemnify and hold CompanionCare harmless from any claim arising from your acts or omissions while providing services, including claims arising from services performed outside the scope described in Section 2.

## 9. Confidentiality

Information about a Care Recipient that you learn while providing services — their health, routines, home, and family — is confidential. You agree not to share it except as needed to provide care or as required by law.

## 10. Suspension and Removal

CompanionCare may restrict, suspend, or remove your access to the marketplace at any time for violation of this Agreement, CompanionCare's Terms of Service, or the Code of Conduct in Section 7. You may stop using the Service at any time.

## 11. Governing Law

This Agreement is governed by the laws of the Commonwealth of Virginia.

## 12. Acknowledgment

By accepting this Agreement, you confirm that you understand CompanionCare is a marketplace platform, that CompanionCare does not engage or contract with you to perform services, and that you have read and understood the scope-of-care limitations in Section 2.
`,
} as const;
