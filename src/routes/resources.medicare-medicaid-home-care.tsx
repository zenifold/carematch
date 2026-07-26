import { createFileRoute, Link } from "@tanstack/react-router";
import { PageShell, PageHero, CTASection } from "@/components/marketing/PageShell";
import {
  ArticleBody,
  ArticleMeta,
  ArticleTLDR,
  ArticleFAQ,
  RelatedPosts,
  articleHead,
} from "@/components/marketing/ArticleLayout";

const path = "/resources/medicare-medicaid-home-care";
const title = "Does Medicare Pay for Home Care? A Plain-English Guide";
const description =
  "What Medicare, Medicare Advantage, and Medicaid actually cover for home health and non-medical home care in 2026 — and where private pay picks up.";
const datePublished = "2026-06-16";
const category = "Costs";

const faq = [
  {
    q: "Does Medicare pay for a caregiver to come to my home?",
    a: "Original Medicare pays for a home health aide only as part of a short-term skilled home health episode — typically after a hospital stay and only alongside skilled nursing or therapy. It does not pay for ongoing non-medical caregivers, companionship, or long-term help with bathing and dressing.",
  },
  {
    q: "What is the difference between home health and home care?",
    a: "Home health is skilled medical care — nursing, physical therapy, occupational therapy — usually short-term and covered by Medicare when a doctor certifies it. Home care (also called non-medical or custodial care) is help with daily activities like bathing, meals, and companionship. It is almost always private pay or Medicaid, not Medicare.",
  },
  {
    q: "Does Medicaid cover long-term home care?",
    a: "Yes, for those who qualify financially and functionally. Every state runs a Home and Community-Based Services (HCBS) waiver program that pays for long-term in-home personal care as an alternative to nursing home placement. Income and asset limits vary by state; waitlists exist in many states.",
  },
  {
    q: "What about veterans?",
    a: "The VA Aid & Attendance benefit adds up to roughly $2,700/month (2026) to a wartime-era veteran's or surviving spouse's pension if they need help with daily activities. It can be used to pay any caregiver — including a family member in most states — and stacks with other benefits.",
  },
  {
    q: "Can Medicare Advantage plans cover more?",
    a: "Some Medicare Advantage plans include limited non-medical benefits — a few hours of homemaker services, meal delivery, transportation to appointments — under the CMS 'special supplemental benefits' rules. Coverage varies dramatically between plans; call the plan directly and ask about 'in-home support services'.",
  },
];

export const Route = createFileRoute("/resources/medicare-medicaid-home-care")({
  head: () =>
    articleHead({ path, title, description, datePublished, section: category, faq }),
  component: ArticlePage,
});

function ArticlePage() {
  return (
    <PageShell>
      <PageHero eyebrow={category} title={title} lead={description} />
      <ArticleBody>
        <ArticleMeta category={category} datePublished={datePublished} readMins={10} />

        <ArticleTLDR
          points={[
            "Medicare pays for short-term skilled home health, not long-term non-medical care.",
            "Medicaid HCBS waivers can pay for extensive in-home care — for those who qualify.",
            "VA Aid & Attendance can add up to $2,700/month for eligible veterans and spouses.",
            "Most day-to-day home care is private pay, marketplace, or a mix of these.",
          ]}
        />

        <p>
          "Won't Medicare cover this?" is the first question almost every family asks
          — and the answer surprises nearly all of them. Here's what each program
          actually pays for in 2026, in plain English.
        </p>

        <h2>Medicare (Parts A & B) — skilled, short-term, only</h2>
        <p>
          Original Medicare covers <strong>home health</strong>, which is different
          from home care. It pays for:
        </p>
        <ul>
          <li>Skilled nursing visits (wound care, injections, monitoring)</li>
          <li>Physical, occupational, or speech therapy at home</li>
          <li>
            A home health aide — but <em>only</em> as part of a skilled episode, not on
            its own
          </li>
          <li>Medical social work</li>
        </ul>
        <p>
          <strong>The conditions:</strong> a doctor must certify the patient is
          "homebound" and needs skilled care intermittently. The care must come from a
          Medicare-certified home health agency. Episodes are typically 60 days and
          are re-certified only while medical progress continues.
        </p>
        <p>
          <strong>What Medicare will not pay for:</strong> ongoing companion care,
          overnight sitters, 24-hour care, meal prep, laundry, or shopping when those
          are the only services needed.
        </p>

        <h2>Medicare Advantage — sometimes a little more</h2>
        <p>
          Since 2019, CMS has allowed Medicare Advantage plans to include limited
          "special supplemental benefits" — a handful of hours of in-home support,
          meal delivery after a hospital stay, transportation to appointments, or
          adult day care. Coverage is plan-specific and usually modest. Call the plan
          directly and ask for the "in-home support services" or "SSBCI" benefit.
        </p>

        <h2>Medicaid — the primary long-term care payer</h2>
        <p>
          Medicaid is where most long-term home care actually gets funded. Every
          state runs at least one <strong>Home and Community-Based Services (HCBS)
          waiver</strong> that pays for personal care, homemaker services, adult day
          programs, and case management — as an alternative to nursing home care.
        </p>
        <ul>
          <li>
            <strong>Who qualifies</strong> — depends on income, assets, and functional
            need. In most states, single-person income limits sit around $2,900/month
            (2026) and asset limits around $2,000, though many programs allow spousal
            protections and "Miller trusts".
          </li>
          <li>
            <strong>What it pays</strong> — often 20–40 hours a week of personal care,
            plus a case manager. Rates are set by the state.
          </li>
          <li>
            <strong>Waitlists</strong> — real in many states. Apply early.
          </li>
        </ul>

        <h2>VA Aid & Attendance — often missed</h2>
        <p>
          Wartime-era veterans (and surviving spouses) who need help with daily
          activities may qualify for an "Aid & Attendance" add-on to their VA pension —
          up to about <strong>$2,700/month</strong> in 2026 for a married veteran. The
          money is unrestricted — it can pay a private caregiver, a marketplace
          provider, or in most states an adult child providing care.
        </p>

        <h2>Private options that reduce the bill</h2>
        <ul>
          <li>
            <strong>Long-term care insurance</strong> — usually covers home care once
            the policyholder needs help with 2+ activities of daily living.
          </li>
          <li>
            <strong>Life insurance with LTC rider</strong>, or "life settlements" that
            convert a policy into an LTC benefit pool.
          </li>
          <li>
            <strong>HSA/FSA</strong> for qualified caregiver expenses.
          </li>
          <li>
            <strong>Reverse mortgage line of credit</strong>, if aging in place is the
            plan and there is significant home equity.
          </li>
        </ul>

        <p>
          For a full breakdown of hourly and monthly costs after benefits,{" "}
          <Link to="/resources/cost-of-in-home-care">
            see our 2026 cost guide
          </Link>
          .
        </p>

        <p className="text-sm italic text-muted-foreground">
          This article is general information, not legal or financial advice. Benefit
          rules change every year — verify eligibility with a licensed elder law
          attorney, benefits counselor, or your state Medicaid office.
        </p>

        <ArticleFAQ items={faq} />

        <RelatedPosts
          items={[
            {
              to: "/resources/cost-of-in-home-care",
              title: "How Much Does In-Home Care Cost in 2026?",
              category: "Costs",
              readMins: 11,
            },
            {
              to: "/resources/companion-vs-personal-care",
              title: "Companion vs Personal Care vs Skilled Nursing",
              category: "Guides",
              readMins: 9,
            },
            {
              to: "/resources/aging-in-place-checklist",
              title: "Aging-in-Place Checklist",
              category: "Planning",
              readMins: 8,
            },
          ]}
        />
      </ArticleBody>
      <CTASection />
    </PageShell>
  );
}
