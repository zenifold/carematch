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

const path = "/resources/respite-care-guide";
const title = "Respite Care: What It Is, Who Pays, and How to Actually Get a Break";
const description =
  "A plain-English guide to respite care for family caregivers — what it costs in 2026, what Medicare, Medicaid, and the VA cover, and how to arrange in-home, adult day, or short-stay respite without guilt.";
const datePublished = "2026-07-08";
const category = "Costs" as const;

const faq = [
  {
    q: "What is respite care, exactly?",
    a: "Respite care is short-term relief for the primary caregiver. It can be a few hours at home, an adult day program, or a several-day stay at an assisted-living or skilled-nursing facility. The care recipient is safe and looked after; the caregiver rests, works, travels, or handles a medical appointment of their own.",
  },
  {
    q: "Does Medicare pay for respite care?",
    a: "Only in one narrow case: if the person is enrolled in the Medicare hospice benefit, Medicare pays for up to 5 consecutive days of inpatient respite at a time, in an approved facility. Outside of hospice, traditional Medicare does not pay for respite. Some Medicare Advantage plans now cover a small annual respite benefit — check the plan's Evidence of Coverage.",
  },
  {
    q: "Does Medicaid cover respite?",
    a: "Yes — through Home & Community-Based Services (HCBS) waivers in every state, though the amount and rules vary. Waivers commonly include in-home respite hours, adult day care, and short institutional stays. There is often a waitlist. Start with your state's Area Agency on Aging.",
  },
  {
    q: "What does respite cost out-of-pocket?",
    a: "In-home respite runs about $30–$45 per hour nationally in 2026. Adult day programs are $80–$110 per day. Short facility stays are $250–$400 per day. Many families combine 4–8 hours a week of in-home respite with an occasional weekend facility stay.",
  },
  {
    q: "Are there free respite programs?",
    a: "Yes. The National Family Caregiver Support Program funds free or low-cost respite through Area Agencies on Aging. The VA's Respite Care benefit covers up to 30 days per year for veterans. Some Alzheimer's Association chapters and faith communities run free respite programs.",
  },
];

export const Route = createFileRoute("/resources/respite-care-guide")({
  head: () =>
    articleHead({ path, title, description, datePublished, section: category, faq }),
  component: ArticlePage,
});

function ArticlePage() {
  return (
    <PageShell>
      <PageHero eyebrow={category} title={title} lead={description} />
      <ArticleBody>
        <ArticleMeta category={category} datePublished={datePublished} readMins={12} />

        <ArticleTLDR
          points={[
            "Respite care = temporary relief for a family caregiver. In-home, adult day, or a short facility stay.",
            "Traditional Medicare only covers respite under the hospice benefit (up to 5 inpatient days at a time).",
            "Medicaid HCBS waivers cover respite in every state — often with a waitlist.",
            "Free options: Area Agency on Aging, VA respite (up to 30 days/year), Alzheimer's Association grants.",
            "Typical out-of-pocket: $30–$45/hr in-home, $80–$110/day adult day, $250–$400/day facility.",
          ]}
        />

        <p>
          Most family caregivers do not take a real break for the first two years. By
          year three, roughly 40% report clinical burnout symptoms. Respite care exists
          for exactly this reason — and it is dramatically under-used, mostly because
          families do not know it is a distinct, fundable service.
        </p>

        <KeyStats
          items={[
            { stat: "53M", label: "US family caregivers (AARP, 2024)" },
            { stat: "24 hrs/wk", label: "Median unpaid care per caregiver" },
            { stat: "40%", label: "Report clinical burnout by year 3" },
          ]}
        />

        <h2>The three formats of respite care</h2>
        <h3>1. In-home respite (most common)</h3>
        <p>
          A trained caregiver comes to the home for a set block — usually 3 to 8 hours,
          sometimes overnight. Best for people who are anxious about leaving home, who
          have dementia and rely on familiar surroundings, or whose primary caregiver
          just needs to leave the house.
        </p>
        <h3>2. Adult day programs</h3>
        <p>
          A community center or facility hosts older adults 6–8 hours a day, weekdays.
          Meals, activities, some medical monitoring. About $80–$110/day in 2026 — often
          less than in-home respite for a full day. Social benefits are real: adult day
          participants show measurable improvements in mood and sleep.
        </p>
        <h3>3. Short-stay facility respite</h3>
        <p>
          An assisted-living or skilled-nursing facility takes the person for a few days
          to a few weeks. This is what lets a caregiver actually take a vacation, have
          surgery, or handle a family crisis. Book early — good facilities fill up.
        </p>

        <h2>Who pays: the honest breakdown</h2>
        <h3>Medicare (traditional)</h3>
        <p>
          Traditional Medicare Parts A and B do <strong>not</strong> pay for respite —
          with one exception: the <strong>hospice benefit</strong> covers up to 5
          consecutive inpatient respite days at a time, as often as needed, for
          hospice-eligible patients.
        </p>
        <h3>Medicare Advantage</h3>
        <p>
          A growing number of Medicare Advantage plans now offer a modest respite
          benefit under the "expanded supplemental benefits" umbrella — typically 12–30
          hours per year of in-home relief. Check the plan's Evidence of Coverage or
          call the member line and ask specifically for "respite" or "in-home support."
        </p>
        <h3>Medicaid HCBS waivers</h3>
        <p>
          Every state's Medicaid program offers Home & Community-Based Services
          waivers that include respite. Amounts vary: some states cap at 30 days/year,
          others provide monthly in-home hours. There is almost always a waitlist —
          apply as soon as you think you'll need it, not when you're at the breaking
          point.{" "}
          <Link to="/resources/medicare-medicaid-home-care">Full Medicare vs Medicaid breakdown here.</Link>
        </p>
        <h3>VA</h3>
        <p>
          Veterans enrolled in VA health care can access up to 30 days of respite per
          calendar year — in-home, adult day, or facility. Ask the veteran's VA social
          worker or call the local VA Caregiver Support line.
        </p>
        <h3>Long-term care insurance</h3>
        <p>
          Most modern policies include a respite benefit, often 14–21 days per year at
          the policy's daily rate. Check the policy summary; it's frequently overlooked.
        </p>
        <h3>Private pay</h3>
        <p>
          If none of the above apply, private pay is straightforward. In-home respite
          typically runs $30–$45/hour depending on region and skill level. A weekly
          4-hour block ($120–$180/week) is enough to preserve the caregiver's health;
          it does not have to be a full day off.
        </p>

        <h2>How to arrange respite this month</h2>
        <ol>
          <li>Call your <strong>Area Agency on Aging</strong> (eldercare.acl.gov). They know every local program and can screen for waivers.</li>
          <li>If a veteran: call the <strong>VA Caregiver Support Line</strong> (1-855-260-3274).</li>
          <li>If in hospice: ask the <strong>hospice social worker</strong> to schedule the 5-day inpatient respite.</li>
          <li>Look up your state's <strong>Medicaid HCBS waiver</strong> and get on any waitlist even if you don't need it now.</li>
          <li>For flexible, on-demand hours, book vetted caregivers through a marketplace like <Link to="/services/respite-care">CareMatch respite care</Link>.</li>
        </ol>

        <h2>The guilt problem</h2>
        <p>
          Almost every family caregiver we work with first frames respite as "I can't
          leave them." The reframe that lands: <em>respite is what makes home care
          sustainable</em>. Caregivers who take regular breaks keep their loved one at
          home 2–3 years longer, on average, than caregivers who don't. The break is
          not the opposite of the care — it's part of it.
        </p>

        <ArticleFAQ items={faq} />

        <RelatedPosts
          items={[
            {
              to: "/resources/caregiver-burnout",
              title: "Caregiver Burnout: Signs and Recovery",
              category: "Health",
              readMins: 10,
            },
            {
              to: "/resources/medicare-medicaid-home-care",
              title: "Does Medicare Pay for Home Care?",
              category: "Costs",
              readMins: 10,
            },
            {
              to: "/resources/cost-of-in-home-care",
              title: "How Much Does In-Home Care Cost in 2026?",
              category: "Costs",
              readMins: 11,
            },
          ]}
        />
      </ArticleBody>
      <CTASection />
    </PageShell>
  );
}
