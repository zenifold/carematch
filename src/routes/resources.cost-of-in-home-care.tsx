import { createFileRoute, Link } from "@tanstack/react-router";
import { PageShell, PageHero, CTASection } from "@/components/marketing/PageShell";
import {
  ArticleBody,
  ArticleMeta,
  ArticleTLDR,
  KeyStats,
  ArticleFAQ,
  RelatedPosts,
  articleHead,
} from "@/components/marketing/ArticleLayout";
import { CostEstimator } from "@/components/marketing/CostEstimator";

const path = "/resources/cost-of-in-home-care";
const title = "How Much Does In-Home Care Cost in 2026?";
const description =
  "What in-home care actually costs in 2026: companion care vs personal care vs skilled nursing, agency vs marketplace vs private hire, and what Medicare and Medicaid cover.";
const datePublished = "2026-07-01";
const category = "Costs";

const faq = [
  {
    q: "What is the average hourly cost of in-home care in 2026?",
    a: "Nationally, non-medical in-home care runs about $28–$35 an hour through a traditional agency, $20–$28 an hour through a caregiver marketplace like CompanionCare, and $18–$24 an hour when hiring privately (before payroll taxes and insurance). Skilled nursing at home is $45–$80 an hour. Rates vary by state — coastal metros run 25–40% higher than the national average.",
  },
  {
    q: "Is in-home care cheaper than assisted living?",
    a: "Yes, up to roughly 30–40 hours of care a week. Assisted living averages about $5,500 a month in 2026. In-home companion care at 20 hours a week runs about $2,400 a month. Past 40 hours a week, assisted living or memory care usually becomes the cheaper option.",
  },
  {
    q: "Does Medicare pay for in-home care?",
    a: "Original Medicare pays for short-term skilled home health (nursing, PT, OT) when ordered by a doctor after a hospital stay, not ongoing custodial care. Some Medicare Advantage plans include limited non-medical support hours. Long-term non-medical home care is almost always private pay or Medicaid.",
  },
  {
    q: "What's the difference between agency, marketplace, and private hire?",
    a: "An agency employs the caregiver and charges a full hourly rate that covers wages, insurance, and overhead. A marketplace like CompanionCare connects you directly with verified independent providers who set their own rates; you pay the provider plus a 15–18% platform fee. Private hire (Craigslist, word of mouth) is cheapest hourly but you are the employer — responsible for payroll taxes, insurance, and liability.",
  },
  {
    q: "How can families reduce the cost of home care?",
    a: "Book blocks of 3–4 hours instead of 1-hour visits (fewer minimums), keep the same caregiver each week (no re-training discount), use a marketplace rather than an agency for non-medical hours, check whether the older adult qualifies for Medicaid HCBS waivers or VA Aid & Attendance, and use flex spending or long-term care insurance where eligible.",
  },
];

export const Route = createFileRoute("/resources/cost-of-in-home-care")({
  head: () =>
    articleHead({ path, title, description, datePublished, section: category, faq }),
  component: ArticlePage,
});

function ArticlePage() {
  return (
    <PageShell>
      <PageHero eyebrow={category} title={title} lead={description} />
      <ArticleBody>
        <ArticleMeta category={category} datePublished={datePublished} readMins={11} />

        <ArticleTLDR
          points={[
            "In-home care in 2026 runs about $20–$35 an hour depending on how you hire.",
            "Marketplaces like CompanionCare save families 20–35% vs traditional agencies.",
            "Medicare rarely pays for ongoing non-medical care; Medicaid and VA benefits may.",
            "Below ~40 hours a week, home care is cheaper than assisted living.",
          ]}
        />

        <p>
          If you're pricing in-home care for a parent in 2026, the number you'll hear
          most often is <em>"it depends"</em>. That's not wrong — but it isn't very
          useful. Here's the honest, national breakdown, plus the levers you can pull
          to cut the bill without cutting corners.
        </p>

        <KeyStats
          items={[
            { stat: "$28/hr", label: "Median marketplace rate for companion care" },
            { stat: "$5,500", label: "Average monthly assisted living (2026)" },
            { stat: "1 in 4", label: "Older adults who fall each year — a leading care trigger" },
          ]}
        />

        <h2>The three ways families hire in-home care</h2>
        <p>
          The single biggest driver of your hourly rate isn't the caregiver — it's the
          <strong> business model</strong> you buy through.
        </p>

        <h3>1. Traditional home care agency</h3>
        <p>
          The agency is the employer. They handle recruiting, background checks,
          payroll, workers' comp, and scheduling. In 2026, expect{" "}
          <strong>$28–$35 an hour</strong> for non-medical companion or personal care,
          with 2–4 hour visit minimums. Simple, but the caregiver only keeps 40–55% of
          what you pay — the rest is overhead.
        </p>

        <h3>2. Caregiver marketplace (e.g. CompanionCare)</h3>
        <p>
          Independent, verified providers set their own hourly rate; the platform
          handles vetting, insurance, and payment. Rates typically run{" "}
          <strong>$20–$28 an hour</strong> plus a 15–18% service fee. Same verification
          rigor as a good agency, 20–35% cheaper, and the caregiver keeps 82–85% of
          their rate — which usually means better retention and continuity.
        </p>

        <h3>3. Private hire</h3>
        <p>
          Craigslist, Care.com, a neighbor's recommendation. Sticker price is lowest
          ($18–$24/hr) but you become the household employer — responsible for payroll
          taxes, workers' comp, and liability if anything goes wrong. Great when a
          trusted person is already in your life; expensive and risky otherwise.
        </p>

        <h2>What does home care actually cost per month?</h2>
        <p>
          Rather than give you three made-up families, work it out for your own
          situation. Pick the kind of help you need, set the hours, and slide the rate
          within the band providers actually charge.
        </p>

        <CostEstimator />

        <p>
          The figures come straight from the rate bands on our{" "}
          <Link to="/pricing">pricing page</Link>, so they move if the market does. The
          crossover point against assisted living is calculated from whatever rate you
          set — for most families it lands somewhere around 35–45 hours a week.
        </p>

        <h2>Costs by care type</h2>
        <ul>
          <li>
            <strong>Companion care</strong> — $20–$28/hr. Conversation, light
            housekeeping, errands.
          </li>
          <li>
            <strong>Personal care (CNA / HHA)</strong>: $24–$36/hr. Bathing, dressing,
            transfers, mobility.
          </li>
          <li>
            <strong>Skilled nursing at home (RN / LPN)</strong>: $45–$80/hr. Wound
            care, injections, IV, complex medication.
          </li>
          <li>
            <strong>Live-in care</strong>: $250–$400/day where legal. Cheaper per hour
            than shift care once you cross ~50 hours/week.
          </li>
        </ul>

        <h2>What Medicare and Medicaid cover</h2>
        <p>
          Most families are surprised here.{" "}
          <Link to="/resources/medicare-medicaid-home-care">
            Read the full plain-English guide
          </Link>
          , but the short version: <strong>Medicare</strong> covers short-term skilled
          home health after a qualifying event — not ongoing custodial care.{" "}
          <strong>Medicaid</strong> and its HCBS waivers can cover extensive home care
          for those who qualify financially. <strong>VA Aid & Attendance</strong> can
          add $1,500–$2,700/month for eligible veterans and surviving spouses.
        </p>

        <h2>Five ways to reduce your bill without cutting quality</h2>
        <ol>
          <li>
            <strong>Book longer visits.</strong> Two 4-hour visits usually cost less
            than four 2-hour visits — fewer minimums, less commute overhead.
          </li>
          <li>
            <strong>Keep the same caregiver.</strong> Continuity cuts re-training,
            builds trust, and reduces missed visits.
          </li>
          <li>
            <strong>Right-size the tier.</strong> Companion care is half the price of
            skilled nursing. Match the tier to the actual need, not the fear.
          </li>
          <li>
            <strong>Use a marketplace, not an agency</strong>, for non-medical hours.
          </li>
          <li>
            <strong>Check every benefit.</strong> Medicaid HCBS, VA Aid & Attendance,
            long-term care insurance, LTC riders on life insurance, HSA/FSA where
            eligible.
          </li>
        </ol>

        <ArticleFAQ items={faq} />

        <RelatedPosts
          items={[
            {
              to: "/resources/medicare-medicaid-home-care",
              title: "Does Medicare Pay for Home Care?",
              category: "Costs",
              readMins: 10,
            },
            {
              to: "/resources/companion-vs-personal-care",
              title: "Companion vs Personal Care vs Skilled Nursing",
              category: "Guides",
              readMins: 9,
            },
            {
              to: "/resources/how-to-choose-a-caregiver",
              title: "How to Choose an In-Home Caregiver",
              category: "Guides",
              readMins: 10,
            },
          ]}
        />

        <p>
          <Link to="/pricing">See CompanionCare's live pricing estimator →</Link>
        </p>
      </ArticleBody>
      <CTASection />
    </PageShell>
  );
}
