import { createFileRoute, Link } from "@tanstack/react-router";
import { PageShell, PageHero, CTASection, marketingHead, SITE_URL } from "@/components/marketing/PageShell";

const title = "Home Health vs Home Care: A Family's Guide to the Difference";
const description =
  "Home Health is clinical, Medicare-eligible skilled care. Home Care is non-clinical companionship and personal help. How to tell which one your parent actually needs.";
const path = "/resources/home-health-vs-home-care";
const datePublished = "2026-07-14";

export const Route = createFileRoute("/resources/home-health-vs-home-care")({
  head: () =>
    marketingHead({
      path,
      title: `${title} — CompanionCare`,
      description,
      ogType: "article",
      extraMeta: [
        { property: "article:published_time", content: datePublished },
        { property: "article:section", content: "Guides" },
      ],
      jsonLd: {
        "@context": "https://schema.org",
        "@type": "Article",
        headline: title,
        description,
        datePublished,
        author: { "@type": "Organization", name: "CompanionCare" },
        publisher: {
          "@type": "Organization",
          name: "CompanionCare",
          logo: { "@type": "ImageObject", url: `${SITE_URL}/favicon.ico` },
        },
        mainEntityOfPage: `${SITE_URL}${path}`,
      },
    }),
  component: ArticlePage,
});

function ArticlePage() {
  return (
    <PageShell>
      <PageHero eyebrow="Guides" title={title} lead={description} />

      <article className="mx-auto max-w-3xl px-5 py-14 lg:px-10">
        <div className="prose prose-lg max-w-none">
          <p>
            Families searching for help at home run into two terms that sound almost
            identical — "home health" and "home care" — and often use them
            interchangeably. They're different services, delivered by different people,
            paid for by different sources. Getting the distinction right is the
            fastest way to stop wasting phone calls on the wrong kind of agency.
          </p>

          <h2>The one-sentence version</h2>
          <p>
            <strong>Home Health is clinical.</strong> It's short-term, doctor-ordered
            skilled care — a nurse changing a wound dressing, a physical therapist
            after a hip replacement — usually covered by Medicare.{" "}
            <strong>Home Care is non-clinical.</strong> It's ongoing help with
            everyday life — companionship, bathing, meals, errands — usually paid
            privately or by Medicaid / long-term care insurance.
          </p>

          <h2>Home Health: skilled, short, and covered by Medicare</h2>
          <ul>
            <li><strong>Who provides it:</strong> registered nurses, licensed physical / occupational / speech therapists, medical social workers, and home health aides — all working under a physician's plan of care.</li>
            <li><strong>What it does:</strong> wound care, IV therapy, injections, catheter care, disease-specific teaching, rehab after surgery or a hospital stay, medication management assessments.</li>
            <li><strong>How long it lasts:</strong> weeks, not years. Medicare requires the person to be "homebound" and to need skilled care intermittently. Once they've recovered, the benefit ends.</li>
            <li><strong>Who pays:</strong> Medicare Part A/B pays 100% of covered home health when eligibility is met. Medicare Advantage and most private insurance cover it too. Medicaid covers it for lower-income beneficiaries.</li>
            <li><strong>Who delivers it:</strong> a Medicare-certified home health agency. CompanionCare introduces families to one in their state through our{" "}
              <Link to="/services/healthcare" className="text-primary font-semibold">Healthcare rail</Link>.
            </li>
          </ul>

          <h2>Home Care: non-clinical, ongoing, mostly private-pay</h2>
          <ul>
            <li><strong>Who provides it:</strong> caregivers, companions, and — for hands-on personal care — certified nursing assistants (CNAs) and home health aides (HHAs).</li>
            <li><strong>What it does:</strong> companionship, meal prep, light housekeeping, errands, transportation, bathing, dressing, toileting, mobility help, reminders. No clinical tasks.</li>
            <li><strong>How long it lasts:</strong> as long as it's needed — a few hours a week, daily visits, or live-in support that goes on for years.</li>
            <li><strong>Who pays:</strong> mostly private pay. Medicaid covers non-medical home care in every state (rules vary). The VA's Aid & Attendance benefit and long-term care insurance often help. Original Medicare almost never pays for standalone home care.</li>
            <li><strong>Who delivers it:</strong> either an independent caregiver you hire directly (CompanionCare's{" "}
              <Link to="/services/marketplace" className="text-primary font-semibold">Marketplace</Link>) or a licensed home care agency ({" "}
              <Link to="/services/partners" className="text-primary font-semibold">Partners</Link>).
            </li>
          </ul>

          <h2>Which one does my parent need?</h2>
          <p>Two questions get you almost all the way there:</p>
          <ol>
            <li><strong>Is there a medical event driving this?</strong> A hospital stay, a new diagnosis, wounds, IVs, rehab needs — that's Home Health. Ask the discharge planner for a referral before your parent leaves the hospital; Medicare will cover it.</li>
            <li><strong>Is the daily rhythm slipping?</strong> Missed meals, lonely afternoons, unopened mail, unsafe bathing, no rides — that's Home Care. It won't be covered by Medicare, but a few hours a week often prevents the medical event that would trigger Home Health later.</li>
          </ol>
          <p>Most families end up needing both — sometimes at the same time. Home Health handles the recovery; Home Care fills the other 165 hours of the week the nurse isn't there.</p>

          <h2>Side-by-side</h2>
          <div className="overflow-x-auto rounded-2xl border border-border">
            <table className="w-full text-left text-base">
              <thead className="bg-secondary">
                <tr>
                  <th className="p-4 font-semibold">&nbsp;</th>
                  <th className="p-4 font-semibold">Home Health</th>
                  <th className="p-4 font-semibold">Home Care</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border bg-card">
                <tr><td className="p-4 font-medium">Clinical?</td><td className="p-4">Yes</td><td className="p-4">No</td></tr>
                <tr><td className="p-4 font-medium">Doctor's order?</td><td className="p-4">Required</td><td className="p-4">Not required</td></tr>
                <tr><td className="p-4 font-medium">Typical duration</td><td className="p-4">Weeks</td><td className="p-4">Months to years</td></tr>
                <tr><td className="p-4 font-medium">Medicare pays?</td><td className="p-4">Yes, if eligible</td><td className="p-4">Almost never</td></tr>
                <tr><td className="p-4 font-medium">Provider</td><td className="p-4">Certified home health agency</td><td className="p-4">Marketplace or licensed home care agency</td></tr>
              </tbody>
            </table>
          </div>

          <h2>What CompanionCare does</h2>
          <p>
            CompanionCare is one app for both sides of the line. When you need Home Health,
            we introduce you to a Medicare-certified agency in your state. When you
            need Home Care, you can hire an independent helper directly through the
            Marketplace, or work with a licensed agency partner for hands-on
            personal care.{" "}
            <Link to="/services" className="text-primary font-semibold">See all three service rails →</Link>
          </p>
        </div>
      </article>

      <CTASection />
    </PageShell>
  );
}
