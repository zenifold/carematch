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

const path = "/resources/long-distance-caregiving";
const title = "Long-Distance Caregiving: The Playbook for Managing Care From 1,000 Miles Away";
const description =
  "7 million Americans provide care to a parent who lives more than an hour away. The systems, checklists, and boots-on-the-ground help that make it sustainable — without moving.";
const datePublished = "2026-07-06";
const category = "Planning";

const faq = [
  {
    q: "How do I know if my parent is really okay when I visit?",
    a: "The visit itself is unreliable — people rally for company. Ask the doctor, the pharmacist, and one neighbor for their read. Check the fridge, the mail pile, the pill bottles, and the car. Look at how many friends have called recently. The environmental clues are more honest than the conversation.",
  },
  {
    q: "What is a geriatric care manager and do I need one?",
    a: "A geriatric care manager (GCM) or 'Aging Life Care Manager' is a licensed professional — usually a social worker or nurse — who assesses your parent's situation, builds a care plan, and manages the day-to-day. Rates run $100–$250/hr, and most families use them 5–10 hours a month. Worth it if you're managing care from a distance and drowning in logistics.",
  },
  {
    q: "How often should I visit in person?",
    a: "There's no single answer, but the pattern that works: one longer visit every 3 months plus one 'crisis-ready' plan for the phone call that changes everything. Between visits, weekly video calls, a shared calendar, and one boots-on-the-ground helper (paid or family) doing regular check-ins.",
  },
  {
    q: "Should I move my parent to me, or move to them?",
    a: "Moving an older adult across the country is riskier than most families realize — they lose their doctors, community, and cognitive anchors. Try in this order: (1) more paid help in their home, (2) you traveling more often, (3) sibling rotation, (4) moving closer to them, (5) moving them to you. Skip to the end only when the earlier steps fail.",
  },
];

export const Route = createFileRoute("/resources/long-distance-caregiving")({
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
            "Roughly 7M Americans provide care from more than an hour away.",
            "Boots on the ground beats more visits — one reliable helper changes everything.",
            "Build a five-person 'circle' before the crisis, not during it.",
            "Moving a parent to you is a last resort, not a default.",
          ]}
        />

        <p>
          Long-distance caregiving is one of the fastest-growing family situations in
          America — and one of the hardest to do well. The good news: the families
          who make it work don't visit more. They build better systems.
        </p>

        <KeyStats
          items={[
            { stat: "7M", label: "US long-distance family caregivers" },
            { stat: "450 mi", label: "Average distance from parent" },
            { stat: "$8,700", label: "Average yearly out-of-pocket cost" },
          ]}
        />

        <h2>Build the circle before the crisis</h2>
        <p>Five people, named on paper, before you need any of them.</p>
        <ol>
          <li><strong>Primary-care doctor.</strong> Introduce yourself by phone; leave your number in the chart.</li>
          <li><strong>Pharmacist.</strong> One pharmacy for every script; they'll flag interactions.</li>
          <li><strong>One neighbor or friend.</strong> The person who'd notice if the mail piled up. Give them your number.</li>
          <li><strong>Paid helper.</strong> A companion caregiver doing at least one weekly visit — your eyes on the ground.</li>
          <li><strong>Backup family.</strong> The sibling or cousin who lives closest, even if it's still far.</li>
        </ol>

        <h2>The regular rhythm</h2>
        <ul>
          <li><strong>Weekly video call</strong> at a set time. Face-to-face reveals what phone doesn't — grooming, mood, weight.</li>
          <li><strong>Weekly caregiver visit</strong> with a written check-in note you can read.</li>
          <li><strong>Monthly medication check</strong> — the pharmacist or caregiver does a count.</li>
          <li><strong>Quarterly in-person visit</strong> long enough to check the fridge, the pills, the car, and the mail.</li>
          <li><strong>Annual full review</strong> with the doctor — meds, vision, hearing, driving, cognition.</li>
        </ul>

        <h2>The tools that pay for themselves</h2>
        <ul>
          <li><strong>Medical alert with fall detection</strong> ($30–$50/mo). Non-negotiable for anyone living alone with any fall risk.</li>
          <li><strong>Shared calendar</strong> for appointments and caregiver visits — Google Calendar works, so do dedicated caregiver apps.</li>
          <li><strong>Video doorbell + smart lock</strong> so caregivers can get in reliably and you can see who's coming and going.</li>
          <li><strong>Automatic pill dispenser</strong> that alerts you if a dose is missed.</li>
          <li><strong>Financial monitoring</strong> — a shared bank alert for large or unusual transactions catches elder fraud early.</li>
        </ul>

        <h2>The visit that actually helps</h2>
        <p>
          When you fly in, don't spend the whole visit on the couch. Do the annual
          walkthrough:
        </p>
        <ol>
          <li>Open the fridge and pantry.</li>
          <li>Look at every pill bottle — count them.</li>
          <li>Walk the house looking for fall hazards.</li>
          <li>Check the car for new scratches or dents.</li>
          <li>Look at the mail pile and mail from the last month.</li>
          <li>Ride along on one appointment.</li>
          <li>Meet the caregiver, neighbor, and one friend in person.</li>
        </ol>

        <h2>When to bring in a geriatric care manager</h2>
        <p>
          If you're on the phone with pharmacies, doctors, insurance, and neighbors
          more than a couple hours a week, a GCM pays for itself. They assess the
          situation, build a plan, and — importantly — go to appointments with your
          parent. Rates: $100–$250/hr. Most families use 5–10 hours a month.
        </p>

        <h2>The hardest question: is it time to move?</h2>
        <p>
          Try in order: more paid help, more visits, sibling rotation, you moving
          closer, parent moving to you. The last option is riskier than most families
          expect — cognitive decline typically accelerates in the six months after a
          major move. Skip to it only when the earlier steps have genuinely failed.
        </p>

        <p>
          The single change that helps most long-distance families is adding{" "}
          <Link to="/services/companionship">a weekly companion caregiver</Link> — the
          reliable pair of local eyes that turns 1,000 miles into a manageable
          distance.
        </p>

        <ArticleFAQ items={faq} />

        <RelatedPosts
          items={[
            {
              to: "/resources/signs-parent-needs-help",
              title: "Signs Your Parent Needs Help",
              category: "Planning",
              readMins: 9,
            },
            {
              to: "/resources/how-to-choose-a-caregiver",
              title: "How to Choose a Caregiver",
              category: "Guides",
              readMins: 10,
            },
            {
              to: "/resources/how-to-talk-to-parent-about-care",
              title: "Talking to Your Parent About Care",
              category: "Planning",
              readMins: 9,
            },
          ]}
        />
      </ArticleBody>
      <CTASection />
    </PageShell>
  );
}
