// DRAFT — pending attorney review. Provider-only agreement. Deliberately
// mirrors the scope-of-practice language already shipped in
// provider-training-content.ts (Lesson 5 + the fall-prevention lesson) so the
// legal document and the actual training a Provider completes say the same
// thing — a mismatch between the two would be its own liability problem.

export const INDEPENDENT_CONTRACTOR_AGREEMENT = {
  version: "1.0.0",
  effective_date: "2026-08-01",
  title: "Independent Contractor Agreement",
  body: `
# CareMatch Independent Contractor Agreement

**Version 1.0.0 — Effective August 1, 2026**

This Independent Contractor Agreement ("Agreement") is between you (the "Provider") and CareMatch, and applies to **Marketplace-tier companion care** specifically. By accepting this Agreement, you agree to the terms below in addition to CareMatch's general Terms of Service.

*[Scoping note for the team, not the Provider: CareMatch's existing marketing pages (/legal/independent-contractors, /legal/state-availability) describe a three-tier model where higher tiers ("Partners" for personal care, "Healthcare" for skilled/clinical) are delivered by W-2 employees of separate licensed partner agencies, not CareMatch contractors at all — while the product actually built treats every provider identically as a direct independent contractor via Stripe Connect, regardless of credential tier. This Agreement is written for what's actually built today. If/when a real partner-agency referral model is built, those providers would need an entirely different legal relationship (a referral/vendor agreement between CareMatch and the partner agency, not this document) — worth resolving which vision is the near-term real one before this goes further.]*

## 1. Independent Contractor Relationship

You are an **independent contractor**, not an employee, agent, or partner of CareMatch. CareMatch does not control the manner or means by which you perform companion care services — you decide which bookings to accept, and (within the marketplace's tools) your own rate. Nothing in this Agreement creates an employment, partnership, or joint-venture relationship.

You are free to offer your services through other platforms or directly to clients you find outside CareMatch, and this Agreement does not require exclusivity.

**If a family you meet through CareMatch later hires you directly, outside the CareMatch marketplace,** you are no longer providing services as a CareMatch Provider for that engagement, and CareMatch's verification, payment protection, and support no longer apply to that relationship. You may, depending on the arrangement, become that family's household employee under applicable law rather than remaining an independent contractor — you should understand the tax and legal implications of that change before agreeing to it.

## 2. Scope of Services — Companion Care Only

Unless CareMatch has verified you for a higher credential tier (such as PCA, HHA, CNA, or a clinical license) and you are matched for a booking requiring that credential, you provide **companion-tier care only**. This means:

**You may:** provide companionship and conversation, light housekeeping, meal preparation, transportation and errands, and *remind* a Care Recipient to take medication that they administer themselves.

**You may not:** administer medication, provide wound care, physically assist with bathing or toileting, or physically assist a transfer in or out of a bed, chair, or toilet — even if asked to by the Care Recipient or their family. If you are asked to do any of these things, decline and report it through the Service. Declining a request outside your scope is never grounds for a negative rating or account action against you.

Performing services outside your verified scope is a violation of this Agreement, and you assume personal responsibility and liability for doing so.

## 3. Verification and Training

You must complete CareMatch's identity verification, background check, and required training modules (and keep them current) before accepting bookings. CareMatch may suspend your ability to accept bookings if your verification lapses or a background check reveals disqualifying information.

## 4. Compensation and Payment

You are paid through CareMatch's payment system (Stripe Connect) for completed, verified visits, at your disclosed hourly rate, less CareMatch's platform fee. Payment is issued automatically after a visit is marked complete.

## 5. Taxes

As an independent contractor, you are responsible for your own federal, state, and local taxes, including self-employment tax. CareMatch will issue you a Form 1099-NEC for earnings that meet the applicable reporting threshold. CareMatch does not withhold taxes from your payments.

## 6. Insurance

CareMatch does not provide workers' compensation coverage for you, because you are not our employee, and the Care Recipient's home is not a CareMatch worksite. **We strongly recommend you obtain your own general liability and/or occupational accident insurance** to protect yourself against claims of accidental injury or property damage while providing services. This is a recommendation, not a requirement of this Agreement, but the financial risk of not carrying it is yours alone.

## 7. Code of Conduct

You agree to:

- Communicate with Care Recipients and Family members only through the CareMatch app, not personal contact information
- Never accept cash, gifts of significant value, or off-platform payment for a booking made through CareMatch
- Report safety concerns, falls, or requests to perform services outside your scope through the Service promptly
- Treat every Care Recipient with respect and patience, consistent with CareMatch's caregiver training

## 8. Liability and Indemnification

You are personally responsible for your own conduct while providing services, including any injury, property damage, or other harm you cause. You agree to indemnify and hold CareMatch harmless from any claim arising from your acts or omissions while providing services, including claims arising from services performed outside the scope described in Section 2.

## 9. Confidentiality

Information about a Care Recipient that you learn while providing services — their health, routines, home, and family — is confidential. You agree not to share it except as needed to provide care or as required by law.

## 10. Termination

Either you or CareMatch may end this Agreement at any time. CareMatch may deactivate your account for violation of this Agreement, CareMatch's Terms of Service, or the Code of Conduct in Section 7.

## 11. Governing Law

This Agreement is governed by the laws of the Commonwealth of Virginia.

## 12. Acknowledgment

By accepting this Agreement, you confirm that you understand you are an independent contractor, not a CareMatch employee, and that you have read and understood the scope-of-care limitations in Section 2.
`,
} as const;
