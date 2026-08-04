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

const path = "/resources/live-in-vs-24-hour-care";
const title = "Live-In Care vs 24-Hour Care: The Real Cost Difference (2026)";
const description =
  "Live-in care and 24-hour shift care sound similar and cost very differently. A plain-English comparison — what each includes, what each costs in 2026, and which one your situation actually needs.";
const datePublished = "2026-06-20";
const category = "Costs" as const;

const faq = [
  {
    q: "What's the actual difference between live-in and 24-hour care?",
    a: "Live-in care is one caregiver who lives in the home, works roughly a 16-hour day, and gets 8 hours of sleep (with 5+ uninterrupted). 24-hour care is two or three caregivers rotating in 8- or 12-hour shifts, each fully awake and working. The person's need for overnight help is the deciding factor.",
  },
  {
    q: "Which one is cheaper?",
    a: "Live-in is roughly 30–45% cheaper than 24-hour shift care. In 2026, live-in averages $350–$500 per day nationally; 24-hour care runs $600–$900 per day. The gap is because live-in caregivers sleep on-site rather than actively working through the night.",
  },
  {
    q: "Is live-in care legal? I've heard mixed things.",
    a: "Live-in arrangements exist under Fair Labor Standards Act rules that require adequate sleep time and duty-free breaks. Some states — notably California, New York, Massachusetts — have stricter rules that effectively require 24-hour shift care or higher pay. Always confirm with an agency or attorney familiar with your state's home-care wage laws.",
  },
  {
    q: "How do we know if we need 24-hour care?",
    a: "If the person needs help more than twice per night, wanders, has severe dementia with sundowning, is on IV or complex medications through the night, or is at high fall risk unattended — you need awake overnight care, which means 24-hour shift care.",
  },
  {
    q: "Can we mix models — live-in weekdays, shifts on weekends?",
    a: "Yes, and many families do. A common configuration: one live-in caregiver Monday–Friday, with a weekend caregiver or family member covering Saturday and Sunday. This can cut monthly costs meaningfully vs. pure 24-hour care.",
  },
];

export const Route = createFileRoute("/resources/live-in-vs-24-hour-care")({
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
            "Live-in care = one caregiver in the home; sleeps 8 hrs at night with breaks. ~$350–$500/day.",
            "24-hour care = two or three caregivers rotating shifts, all awake. ~$600–$900/day.",
            "The overnight need is the deciding factor. Sleeps through the night? Live-in works. Needs help >2x/night? 24-hour.",
            "Some states (CA, NY, MA) restrict true live-in arrangements — check local law.",
            "Hybrid models (live-in weekdays + shifts weekends) often reduce monthly cost by 15–25%.",
          ]}
        />

        <p>
          Families almost always start by asking for "24-hour care" — and about half the
          time, what they actually need is live-in. The distinction is worth
          understanding because the annual cost gap can exceed $100,000.
        </p>

        <KeyStats
          items={[
            { stat: "$350–500", label: "Live-in care per day (2026)" },
            { stat: "$600–900", label: "24-hour shift care per day (2026)" },
            { stat: "30–45%", label: "Cost savings of live-in vs 24-hour" },
          ]}
        />

        <h2>Live-in care — how it actually works</h2>
        <ul>
          <li>One caregiver lives in the home, typically for 3–5 day stretches.</li>
          <li>Works roughly 16 hours per day.</li>
          <li>Sleeps in a designated bed for 8 hours overnight, with at least 5 uninterrupted hours.</li>
          <li>Gets duty-free meal breaks during the day.</li>
          <li>Is available for emergencies overnight but not "on duty."</li>
          <li>Best for people who sleep through the night and need day-time supervision, cueing, meals, personal care, and companionship.</li>
        </ul>

        <h2>24-hour shift care — how it actually works</h2>
        <ul>
          <li>Two caregivers on 12-hour shifts (7am–7pm and 7pm–7am) or three caregivers on 8-hour shifts.</li>
          <li>Every caregiver is fully awake and working the entire shift.</li>
          <li>Best for people who need help multiple times per night, wander, have severe dementia, or are medically complex.</li>
        </ul>

        <h2>Which situation calls for which</h2>
        <h3>Live-in is usually right when…</h3>
        <ul>
          <li>The person sleeps through the night with minimal wake-ups.</li>
          <li>Day-time needs are moderate to high: meals, bathing, mobility, cueing.</li>
          <li>Cost matters and the family wants to avoid moving to a facility.</li>
          <li>There's a bedroom the caregiver can use.</li>
        </ul>
        <h3>24-hour is required when…</h3>
        <ul>
          <li>The person wakes 3+ times per night for help.</li>
          <li>Wandering / exit-seeking dementia — someone must be awake at night.</li>
          <li>Medical complexity: overnight tube feeds, IV meds, oxygen management, frequent repositioning.</li>
          <li>Recent hospital discharge with high fall risk.</li>
          <li>Terminal illness requiring hourly comfort care.</li>
        </ul>

        <h2>What the money actually looks like</h2>
        <p>National 2026 averages, roughly:</p>
        <ul>
          <li><strong>Live-in:</strong> $350–$500/day → about $10,500–$15,000/month.</li>
          <li><strong>24-hour (12-hour shifts):</strong> $600–$900/day → about $18,000–$27,000/month.</li>
          <li><strong>Memory care facility (comparison):</strong> $7,000–$10,000/month, but private-pay only in most states.</li>
        </ul>
        <p>
          Adjustments: California, NY metro, and Boston add 20–30% to both. Rural markets
          can be 20–25% less. Marketplace models like{" "}
          <Link to="/pricing">CompanionCare</Link> typically fall 15–30% below agency prices
          because caregivers get most of the hourly rate directly.
        </p>

        <h2>The legal wrinkle</h2>
        <p>
          The Fair Labor Standards Act allows true live-in arrangements as long as
          adequate sleep and off-duty time are provided. Several states — California,
          New York, Massachusetts, and a few others — have stricter overtime and sleep
          rules that make "pure" live-in effectively impossible or push it into
          higher-cost territory. Always confirm with an agency or attorney familiar with
          your state's home-care wage rules before signing a contract.
        </p>

        <h2>Hybrid models to consider</h2>
        <ul>
          <li><strong>Live-in + weekend relief:</strong> Live-in Monday–Friday, a weekend caregiver or family Saturday–Sunday.</li>
          <li><strong>Day shifts + overnight companion:</strong> Two day caregivers rotating, plus one lighter-duty overnight companion — often cheaper than three full shifts.</li>
          <li><strong>Adult day + evening care:</strong> Adult day program 6 hours, then a caregiver 4pm to bedtime.</li>
        </ul>

        <h2>Practical next steps</h2>
        <ol>
          <li>Do a 7-day journal of when help was needed, especially overnight.</li>
          <li>Match the pattern to the model — the journal tells you which one fits.</li>
          <li>Get two or three quotes before deciding; costs vary widely.</li>
          <li>Ask about the caregiver's schedule and sleeping arrangements up front.</li>
        </ol>

        <p>
          For related pricing detail, see our full{" "}
          <Link to="/resources/cost-of-in-home-care">cost of in-home care guide</Link>, or
          jump to <Link to="/pricing">CompanionCare pricing</Link> for marketplace rates in
          your area.
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
              to: "/resources/respite-care-guide",
              title: "Respite Care: Who Pays, How to Get a Break",
              category: "Costs",
              readMins: 12,
            },
          ]}
        />
      </ArticleBody>
      <CTASection />
    </PageShell>
  );
}
