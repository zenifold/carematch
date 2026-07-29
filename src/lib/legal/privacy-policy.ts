// DRAFT — pending attorney review. See terms-of-service.ts for the same note.
// Grounded in what CareMatch actually collects/does today (Supabase, Stripe,
// background-check vendors, GPS check-in, the existing data-export feature),
// not generic boilerplate — but still needs legal review, particularly for
// Virginia's Consumer Data Protection Act (VCDPA) applicability and any
// state-specific health-adjacent data handling requirements.

export const PRIVACY_POLICY = {
  version: "1.0.0",
  effective_date: "2026-08-01",
  title: "Privacy Policy",
  body: `
# CareMatch Privacy Policy

**Version 1.0.0 — Effective August 1, 2026**

This Privacy Policy explains what information CareMatch collects, how we use it, and the choices you have. It applies to everyone who uses the CareMatch service — Seniors, Family members, and Providers.

## 1. Information We Collect

**Account information:** name, email, phone number, city, and (for Providers) additional identity details required for background checks and payouts.

**Care information:** for Seniors, the care needs, preferences, and budget you choose to share (for example: mobility needs, care notes, monthly budget). This information is shared only with Providers and Family members you've approved to see it, based on the permission levels described in our Terms of Service.

**Payment information:** CareMatch does not store your full card number. Payment details are collected and stored directly by our payment processor, Stripe, under its own privacy and security practices. We store enough information to identify which card is on file (card brand and last 4 digits) and process charges and payouts.

**Verification information:** for Providers, background check results and identity verification status are stored so that Care Recipients can see a Provider's verification tier. Underlying background-check report details are handled by our screening vendor and are not stored in full within CareMatch's own systems beyond a pass/fail status and relevant dates.

**Location information:** at the start and end of a visit, a Provider's location may be recorded to confirm they were present at the scheduled address ("check-in"). This is used for safety and billing accuracy, not ongoing location tracking outside of visit windows.

**Messages:** messages you send through CareMatch's in-app chat are stored so both parties can see conversation history. As described in our Terms of Service, messages may be automatically scanned for indicators of unsafe or off-platform conduct; this scanning is automated and reviewed by our trust & safety staff only when a message is flagged.

**Usage information:** standard technical information such as IP address, browser type, and pages visited, collected automatically when you use the Service.

## 2. How We Use Information

We use the information above to:

- Operate the marketplace: match Care Recipients with Providers, process bookings, and facilitate payments
- Verify Provider identity and eligibility
- Communicate with you about your account, bookings, and support requests
- Maintain safety and trust on the platform, including reviewing flagged messages
- Comply with legal obligations (for example, tax reporting for Provider earnings)
- Improve the Service

**We do not sell your personal information to third parties for their own advertising purposes.**

## 3. How We Share Information

We share information with:

- **Other users, as needed for the service** — e.g., a Provider sees a Care Recipient's care needs and address for a booking they've accepted; a Care Recipient sees a Provider's profile, verification status, and rating.
- **Service providers we use to operate CareMatch** — including Stripe (payments), our background-check and identity-verification vendors, and our cloud hosting and database providers, each bound to use your information only to provide their service to us.
- **Legal and safety purposes** — if required by law, or to protect the safety of a user or the public.

## 4. Data Security

We use industry-standard practices to protect your information, including encryption in transit, database-level access controls that restrict who can see what data, and role-based access for CareMatch staff. No system is perfectly secure, and we cannot guarantee absolute security.

## 5. Your Rights and Choices

You can access, update, or request deletion of your account information at any time by contacting support. CareMatch also provides a data export tool for account holders and, on request, for administrators assisting a user with a data request.

If you are a Virginia resident, the Virginia Consumer Data Protection Act (VCDPA) may give you additional rights to access, correct, delete, or obtain a copy of your personal data, and to opt out of certain processing. Contact us to exercise these rights.

## 6. Data Retention

We retain your information for as long as your account is active, and for a period after account closure as needed to comply with legal obligations (such as tax records for completed bookings) or resolve disputes.

## 7. Children's Privacy

CareMatch is not directed to, and does not knowingly collect information from, anyone under 18.

## 8. Changes to This Policy

We may update this Privacy Policy from time to time. If we make material changes, we will ask you to re-acknowledge the updated policy.

## 9. Contact Us

Questions about this Privacy Policy can be sent to [support email TBD].
`,
} as const;
