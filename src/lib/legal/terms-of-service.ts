// DRAFT — pending attorney review. Grounded in the Virginia companion-care
// legal research already done for this project (hands-off scope, 1099
// independent-contractor classification, marketplace liability disclaiming),
// but this is not legal advice and should not be published without review by
// a Virginia-licensed attorney.
//
// version/effective_date drive the acceptance-tracking system — bump version
// (and hash will change automatically) whenever the text changes materially,
// so re-acceptance can be required.

export const TERMS_OF_SERVICE = {
  version: "1.1.0",
  effective_date: "2026-08-01",
  title: "Terms of Service",
  body: `
# CareMatch Terms of Service

**Version 1.1.0 — Effective August 1, 2026**

Please read these Terms of Service ("Terms") carefully. They govern your use of the CareMatch website, mobile experience, and related services (collectively, the "Service"), operated by [CareMatch Legal Entity Name TBD] ("CareMatch," "we," "us," or "our"). By creating an account or using the Service, you agree to these Terms.

## 1. What CareMatch Is

CareMatch is an online marketplace that connects older adults and their families ("Care Recipients") with independent, self-employed companion caregivers ("Providers") for non-medical companion care services.

**CareMatch is a marketplace, not a care provider, home care agency, or employer.** We do not employ, engage, or contract with Providers, supervise their work, or provide care ourselves. We facilitate introductions, scheduling, communication, and payment between Care Recipients and Providers. Providers are independent businesses who set their own rates (within the marketplace's tools), decide which bookings to accept, and provide services directly to the Care Recipient who books them — never to CareMatch or on CareMatch's behalf.

## 2. Eligibility

You must be at least 18 years old and capable of forming a binding contract to create an account. If you are creating or managing an account on behalf of a Care Recipient who has authorized you to do so (a "Family" account), you represent that you have that authority.

Providers must be legally authorized to work in the United States and must complete the identity verification and background check steps required by CareMatch before accepting bookings.

## 3. Account Types

CareMatch supports three account types, each with different capabilities:

- **Senior** — the person receiving care. A Senior account owner controls their own profile, care preferences, and who may be linked to their account.
- **Family** — a family member or trusted contact linked to a Senior's account by mutual invitation. Family members are granted one of three permission levels by the Senior: *View* (see visits, care plan, and budget), *Modify* (request changes for the Senior to approve), or *Financial* (manage payment methods and budget directly). CareMatch does not decide these permissions — the Senior does, and may revoke them at any time.
- **Provider** — an independent companion caregiver offering services through the marketplace.

## 4. The Scope of Companion Care — What Providers Do and Do Not Do

CareMatch providers who have not been separately verified for a higher credential tier are **companion-tier caregivers**. Companion care is **non-medical, hands-off support**. Depending on applicable state law, this generally includes:

- Companionship and conversation
- Light housekeeping
- Meal preparation
- Transportation and errands
- Medication *reminders* (not administration)

It **does not** include, and companion-tier Providers are not permitted to perform:

- Administering medication
- Wound care or any medical task
- Hands-on bathing or toileting assistance
- Physically assisting a transfer in or out of a bed, chair, or toilet

Providers who hold additional, verified credentials (such as PCA, HHA, CNA, or clinical licensure) may be matched for services requiring that credential, and the scope of their permitted services is governed by that credential and applicable law, not this section.

**If a Care Recipient or Family member asks a Provider to perform a service outside the Provider's verified scope, the Provider should decline and report it through the Service.** CareMatch is not responsible for services performed outside a Provider's verified scope, whether or not requested by a Care Recipient or Family member.

## 5. Verification and Background Checks

CareMatch requires Providers to complete identity verification and a background check before their profile becomes visible to Care Recipients, and displays a verification status on each Provider's profile reflecting what has actually been completed.

**Verification reduces risk but does not eliminate it.** Background checks reflect records available at the time they were run and are only as accurate and complete as the records maintained by government agencies and our screening vendors. CareMatch does not guarantee the accuracy, safety, or suitability of any Provider, and encourages every Care Recipient and Family member to exercise their own judgment, ask questions, and trust their instincts before and during any engagement.

## 6. Fees and Payment

CareMatch does not charge a subscription or membership fee to browse Providers, message a Provider, or request a booking. **Your payment method is charged once a Provider accepts your visit request**, for the Provider's disclosed hourly rate times the requested duration, plus a platform fee (disclosed before you book) that CareMatch retains for operating the marketplace, verification, and support. If the actual visit runs a different length than requested, any difference is reconciled after the visit.

Payments are processed by our payment processor, Stripe. CareMatch does not store your full payment card details.

Providers are paid automatically, minus the platform fee, once a visit is checked out as complete.

## 7. Cancellations

You may cancel or reschedule a visit at no charge up to 24 hours before it is scheduled to begin, and your payment method will be fully refunded. Cancellations made within 24 hours of the scheduled start are charged 50% of the visit cost — split evenly between the Provider (for their reserved time) and CareMatch — with the remaining 50% refunded. Recurring visits can be paused at any time with no penalty.

## 8. Conduct on the Platform

You agree not to:

- Ask another user to move scheduling or payment for a CareMatch booking off the platform in order to avoid fees, verification, or platform protections
- Harass, threaten, or discriminate against another user
- Provide false information about yourself, your caregiving needs, or your qualifications
- Use the Service for any unlawful purpose

CareMatch's in-app messaging may be automatically reviewed for indicators of the conduct described above (for example, phone numbers, payment app references, or phrases suggesting a move off-platform). This automated review exists to protect the safety and integrity of the marketplace, not to monitor the content of your conversations for any other purpose.

## 9. Family Account Relationships

A Senior may link one or more Family members to their account and assign each a permission level as described in Section 3. A Senior may revoke a Family member's access at any time. CareMatch acts on the instructions given through the Service by whichever account holder has the applicable permission; CareMatch is not responsible for disputes between a Senior and their Family members about who is authorized to make a given decision.

## 10. Disclaimers

THE SERVICE IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND. CAREMATCH DOES NOT WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED, ERROR-FREE, OR THAT ANY PROVIDER WILL MEET YOUR EXPECTATIONS OR REQUIREMENTS. CAREMATCH IS NOT A MEDICAL PROVIDER, HOME HEALTH AGENCY, OR HIPAA-COVERED ENTITY, AND NOTHING ON THE SERVICE IS MEDICAL ADVICE.

## 11. No Employment or Engagement Relationship; Limitation of Liability

Providers are independent businesses, not employees, contractors, partners, or agents of CareMatch. CareMatch does not engage or retain Providers to perform services, and does not direct or control the manner in which a Provider performs services for a Care Recipient.

TO THE MAXIMUM EXTENT PERMITTED BY LAW, CAREMATCH IS NOT LIABLE FOR THE ACTS OR OMISSIONS OF ANY PROVIDER OR CARE RECIPIENT, INCLUDING BUT NOT LIMITED TO PERSONAL INJURY, PROPERTY DAMAGE, OR ANY HARM ARISING FROM A VISIT ARRANGED THROUGH THE SERVICE. CAREMATCH'S TOTAL LIABILITY TO YOU FOR ANY CLAIM ARISING FROM THE SERVICE WILL NOT EXCEED THE PLATFORM FEES YOU PAID CAREMATCH IN THE THREE MONTHS BEFORE THE CLAIM AROSE.

## 12. Indemnification

You agree to indemnify and hold harmless CareMatch from any claim arising from your use of the Service, your violation of these Terms, or your violation of any rights of another person, including another user.

## 13. Dispute Resolution

*[Placeholder — whether to include a binding arbitration clause and class-action waiver, and the specific arbitration provider/rules, is a decision for counsel. If included, this section will require its own careful drafting and a clear, conspicuous opt-out mechanism in some jurisdictions.]*

## 14. Governing Law

These Terms are governed by the laws of the Commonwealth of Virginia, without regard to its conflict of law principles.

## 15. Changes to These Terms

We may update these Terms from time to time. If we make material changes, we will ask you to re-accept the updated Terms before continuing to use the Service.

## 16. Termination

CareMatch may suspend or terminate your account for violation of these Terms, at our discretion, with or without notice.

## 17. Contact Us

Questions about these Terms can be sent to [support email TBD].
`,
} as const;
