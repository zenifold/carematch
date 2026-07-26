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

const path = "/resources/paying-family-caregiver";
const title = "Can I Get Paid to Care for My Parent? The 2026 Guide";
const description =
  "Adult children can be paid caregivers through Medicaid (in every state), the VA, long-term care insurance, and family caregiver agreements. What each program actually pays, who qualifies, and how to apply.";
const datePublished = "2026-07-04";
const category = "Costs";

const faq = [
  {
    q: "Does Medicare pay family members to provide care?",
    a: "No. Traditional Medicare does not pay family caregivers — it only pays for short-term skilled care after a hospital stay, delivered by a licensed home-health agency. Some Medicare Advantage plans have limited in-home support benefits, but they don't pay family. For family pay, look to Medicaid, the VA, or long-term care insurance.",
  },
  {
    q: "What are Medicaid 'consumer-directed' or 'self-directed' care programs?",
    a: "Every state now has a Medicaid program that lets an eligible older adult choose their own caregiver — including many family members — and Medicaid pays that person a wage. Names vary by state (Consumer Directed Personal Assistance, Cash & Counseling, Structured Family Caregiving, In-Home Supportive Services, etc.). Spouses can be paid in some states; adult children can be paid in most.",
  },
  {
    q: "How much do family caregivers actually earn through Medicaid?",
    a: "Typically $12–$25/hr depending on the state, capped by weekly hour limits based on the assessed level of need. It's rarely a replacement for a full-time salary, but for someone already providing 20+ hours of unpaid care, it can meaningfully offset lost income.",
  },
  {
    q: "What is a family caregiver agreement?",
    a: "A written contract between an older adult and a family member being paid for care, using the older adult's own funds. Important for two reasons: it makes the payments legitimate (not gifts), and it protects Medicaid eligibility down the road — without the agreement, payments can look like disqualifying transfers when Medicaid does its 5-year lookback. Always draft one with an elder-law attorney.",
  },
];

export const Route = createFileRoute("/resources/paying-family-caregiver")({
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
            "Medicare does not pay family caregivers. Medicaid does, in every state, through self-directed care programs.",
            "The VA's Aid & Attendance and Veteran-Directed Care programs pay family caregivers of qualifying veterans.",
            "Long-term care insurance policies sometimes cover family caregivers — check policy language.",
            "Use a family caregiver agreement any time private funds are involved — protect Medicaid eligibility.",
          ]}
        />

        <p>
          If you're already providing care unpaid, there's a decent chance you can be
          paid for it. Not always a lot — but often enough to matter, especially if
          you've had to cut back on work. Here are the four real paths in 2026.
        </p>

        <KeyStats
          items={[
            { stat: "53M", label: "US family caregivers" },
            { stat: "$470B", label: "Annual value of unpaid family caregiving" },
            { stat: "$7,200", label: "Average annual out-of-pocket cost per family" },
          ]}
        />

        <h2>Path 1 — Medicaid self-directed care</h2>
        <p>
          Every US state now has some version of a Medicaid program where the person
          receiving care chooses (and directs) their own caregiver — including many
          family members. The specific name varies:
        </p>
        <ul>
          <li><strong>California:</strong> In-Home Supportive Services (IHSS)</li>
          <li><strong>New York:</strong> Consumer Directed Personal Assistance Program (CDPAP)</li>
          <li><strong>Texas:</strong> Consumer Directed Services (CDS)</li>
          <li><strong>Florida:</strong> Long-Term Care program with self-direction option</li>
          <li><strong>Georgia:</strong> Structured Family Caregiving (SFC)</li>
        </ul>
        <p>
          <strong>Who qualifies:</strong> the older adult must be Medicaid-eligible
          (income and asset limits vary by state) and assessed as needing long-term
          care. In most states, adult children can be the paid caregiver. Spouses
          qualify in about half of states.
        </p>
        <p>
          <strong>What it pays:</strong> typically $12–$25/hr, with weekly hours
          capped by the assessed level of need.
        </p>
        <p>
          <strong>How to apply:</strong> contact the state Medicaid office or an
          Area Agency on Aging (call 1-800-677-1116). The process takes 60–120 days.
        </p>

        <h2>Path 2 — VA benefits</h2>
        <p>
          If your parent is a wartime veteran or a surviving spouse, two programs pay
          family caregivers:
        </p>
        <ul>
          <li>
            <strong>Aid &amp; Attendance</strong> — up to about $2,300/mo for a
            single veteran, $2,700/mo for a married veteran (2026), paid to the
            veteran, who can then pay a family member for care.
          </li>
          <li>
            <strong>Veteran-Directed Care</strong> — a monthly budget the veteran
            uses to hire and pay caregivers, including family. Available in most VA
            regions.
          </li>
          <li>
            <strong>Program of Comprehensive Assistance for Family Caregivers
            (PCAFC)</strong> — for post-9/11 veterans and, since 2020 expansion,
            eligible earlier eras. Pays a monthly stipend directly to the family
            caregiver.
          </li>
        </ul>

        <h2>Path 3 — Long-term care insurance</h2>
        <p>
          Many long-term care insurance policies cover in-home care, and some allow
          family members to be paid. Two things to check in the policy:
        </p>
        <ol>
          <li>Does it cover "informal" or "non-licensed" caregivers?</li>
          <li>Does it require the caregiver to work through a licensed agency?</li>
        </ol>
        <p>
          Policies vary widely. Some will pay a family member directly; some require
          you to be employed by an agency (a workaround is having the family member
          work through a marketplace or agency that handles payroll).
        </p>

        <h2>Path 4 — Family caregiver agreement (private pay)</h2>
        <p>
          When care is paid from the older adult's own funds, a written agreement is
          essential. It should specify:
        </p>
        <ul>
          <li>Hourly rate (market-based — usually $18–$30/hr in most regions)</li>
          <li>Hours per week</li>
          <li>Specific duties (bathing, meds, meals, transport, etc.)</li>
          <li>Payment schedule</li>
          <li>Effective date and termination terms</li>
        </ul>
        <p>
          Why it matters: without a formal agreement, payments look like gifts. If
          Medicaid is needed later, the 5-year lookback will treat those payments as
          disqualifying transfers unless there's a written contract, market-rate
          documentation, and paid taxes. Draft with an elder-law attorney — one
          hour of legal fees now saves months of Medicaid delays later.
        </p>

        <h2>The tax side</h2>
        <ul>
          <li>Payments from Medicaid or the VA are usually reported as W-2 or 1099 wages — the family caregiver files them as income.</li>
          <li>Some Medicaid caregiver payments to a family member <em>living with</em> the care recipient are exempt from federal income tax under IRS Notice 2014-7. Check with a tax preparer.</li>
          <li>Private-pay caregiver income is fully taxable — Social Security and Medicare tax may apply as household-employer.</li>
        </ul>

        <p>
          If you'd rather step back from hands-on care and use these funds for a{" "}
          <Link to="/services/personal-care">professional caregiver</Link>, the same
          Medicaid, VA, and LTC insurance programs typically pay for that too.
        </p>

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
              to: "/resources/cost-of-in-home-care",
              title: "How Much Does In-Home Care Cost?",
              category: "Costs",
              readMins: 11,
            },
            {
              to: "/resources/caregiver-burnout",
              title: "Caregiver Burnout Warning Signs",
              category: "Health",
              readMins: 10,
            },
          ]}
        />
      </ArticleBody>
      <CTASection />
    </PageShell>
  );
}
