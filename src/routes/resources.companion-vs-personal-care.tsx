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

const path = "/resources/companion-vs-personal-care";
const title = "Companion Care vs Personal Care vs Skilled Nursing";
const description =
  "The three tiers of in-home care explained: what each covers, who provides it, what it costs, and how to know which one your family actually needs.";
const datePublished = "2026-05-25";
const category = "Guides";

const faq = [
  {
    q: "What's the difference between companion care and personal care?",
    a: "Companion care is non-medical support — company, errands, meals, light housekeeping, medication reminders. Personal care is 'hands-on' support with activities of daily living: bathing, dressing, toileting, transfers, and mobility. Personal care requires a trained CNA or HHA; companion care does not.",
  },
  {
    q: "Do I need skilled nursing at home?",
    a: "Only when there's a medical task that requires a licensed professional — wound care, injections, IV medication, catheter management, or complex disease management. If daily activities are the issue, companion or personal care is the right tier, not skilled nursing.",
  },
  {
    q: "Can one caregiver do all three?",
    a: "No. Skilled nursing must be done by a licensed RN or LPN. Personal care must be done by a certified CNA or HHA. Companion care can be done by any trained caregiver. Many older adults have a companion caregiver most days and a nurse for occasional medical visits.",
  },
  {
    q: "Which tier is right for early-stage dementia?",
    a: "Usually companion care with a dementia-experienced caregiver — the goal is safety, routine, and engagement. Personal care is added when bathing, dressing, or continence becomes hard. Skilled nursing enters if there's a medical event or complex medication needs.",
  },
];

export const Route = createFileRoute("/resources/companion-vs-personal-care")({
  head: () =>
    articleHead({ path, title, description, datePublished, section: category, faq }),
  component: ArticlePage,
});

function ArticlePage() {
  return (
    <PageShell>
      <PageHero eyebrow={category} title={title} lead={description} />
      <ArticleBody>
        <ArticleMeta category={category} datePublished={datePublished} readMins={9} />

        <ArticleTLDR
          points={[
            "Companion care = non-medical company, errands, meals — any trained helper.",
            "Personal care = hands-on ADLs — CNA or HHA required.",
            "Skilled nursing = medical tasks — licensed RN or LPN.",
            "Most families start with companion care and add tiers as needs change.",
          ]}
        />

        <p>
          "Home care" is really three different services with three different price
          points, credentials, and use cases. Getting the tier right is the single
          biggest cost lever families have — most people overbuy.
        </p>

        <h2>1. Companion care</h2>
        <p>
          <strong>What it is:</strong> non-medical support to keep an older adult
          engaged, safe, and independent at home.
        </p>
        <ul>
          <li>Conversation, walks, hobbies, games</li>
          <li>Meal prep and light cooking</li>
          <li>Light housekeeping and laundry</li>
          <li>Errands, grocery runs, pharmacy pickups</li>
          <li>Rides to appointments and social outings</li>
          <li>Medication <em>reminders</em> (not administration)</li>
          <li>Safety checks and family updates</li>
        </ul>
        <p>
          <strong>Who provides it:</strong> any trained caregiver. No license required
          in most states.
          <br />
          <strong>Cost (2026):</strong> $20–$28/hr on a marketplace, $28–$35/hr at an
          agency.
          <br />
          <strong>When it's the right fit:</strong> the older adult is mostly
          independent but lonely, forgetful, or slowing down.
        </p>

        <h2>2. Personal care (CNA / HHA)</h2>
        <p>
          <strong>What it is:</strong> hands-on help with activities of daily living
          (ADLs).
        </p>
        <ul>
          <li>Bathing, showering, hair and skin care</li>
          <li>Dressing and grooming</li>
          <li>Toileting and incontinence care</li>
          <li>Transfers (bed to chair, chair to toilet)</li>
          <li>Mobility support and safe ambulation</li>
          <li>Feeding assistance</li>
          <li>Everything companion care includes, too</li>
        </ul>
        <p>
          <strong>Who provides it:</strong> a Certified Nursing Assistant (CNA) or Home
          Health Aide (HHA). Trained and state-certified.
          <br />
          <strong>Cost (2026):</strong> $24–$36/hr marketplace, $32–$45/hr agency.
          <br />
          <strong>When it's the right fit:</strong> the older adult needs help with 1+
          ADLs, is recovering from a hospital stay, or has moderate dementia.
        </p>

        <h2>3. Skilled nursing at home</h2>
        <p>
          <strong>What it is:</strong> medical care delivered at home by a licensed
          nurse.
        </p>
        <ul>
          <li>Wound care and dressing changes</li>
          <li>Injections, IV therapy, infusions</li>
          <li>Catheter, ostomy, and feeding-tube management</li>
          <li>Medication administration and titration</li>
          <li>Post-surgical monitoring</li>
          <li>Chronic disease management (heart failure, COPD)</li>
        </ul>
        <p>
          <strong>Who provides it:</strong> a Registered Nurse (RN) or Licensed
          Practical Nurse (LPN), usually through a Medicare-certified home health
          agency.
          <br />
          <strong>Cost (2026):</strong> $45–$80/hr private pay. Often covered by
          Medicare for a short, doctor-ordered episode.
          <br />
          <strong>When it's the right fit:</strong> there's a specific medical task
          that requires clinical training.
        </p>

        <h2>How to pick the right tier</h2>
        <ol>
          <li>
            List what the older adult can't do <em>this week</em> without help. If
            most items are "keeping up with the house" and "getting out of the house",
            start with companion care.
          </li>
          <li>
            If bathing, dressing, or toileting are on that list, move to personal
            care.
          </li>
          <li>
            If a doctor's order names something medical (wound, IV, complex meds),
            layer in skilled nursing — usually a few hours a week alongside
            personal care.
          </li>
        </ol>

        <p>
          Not sure yet? A short intake with our concierge helps you triage in about
          ten minutes — no obligation.{" "}
          <Link to="/how-it-works">See how the intake works</Link>.
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
              to: "/resources/how-to-choose-a-caregiver",
              title: "How to Choose an In-Home Caregiver",
              category: "Guides",
              readMins: 10,
            },
            {
              to: "/resources/signs-parent-needs-help",
              title: "Signs Your Parent Needs Help at Home",
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
