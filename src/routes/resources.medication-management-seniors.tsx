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

const path = "/resources/medication-management-seniors";
const title = "Medication Management for Seniors: The System That Prevents ER Visits";
const description =
  "Older adults on 5+ medications have a 90% chance of a drug interaction. A step-by-step system for pill organization, refill tracking, and the pharmacist review that catches the most dangerous mistakes.";
const datePublished = "2026-07-12";
const category = "Health";

const faq = [
  {
    q: "What is polypharmacy and why is it dangerous?",
    a: "Polypharmacy is taking 5 or more medications regularly. It's the norm for adults over 65 — but every added drug multiplies the odds of interactions, side effects mistaken for new symptoms, and dosing mistakes. Polypharmacy is one of the top three drivers of preventable hospitalizations in older adults.",
  },
  {
    q: "How do I know if my parent is taking their medications correctly?",
    a: "The 'brown bag review' is the gold standard: gather every bottle in the house — prescription, over-the-counter, vitamins, supplements — and bring them to the pharmacist or primary-care doctor. Compare against the current prescribed list. Missing pills mean over-taking; extra pills mean under-taking. Both are red flags.",
  },
  {
    q: "Are pill organizers safe for someone with memory issues?",
    a: "A weekly pill box works for mild forgetfulness. For anyone with cognitive decline, upgrade to an automatic dispenser that locks and dispenses only at scheduled times, or hand medication management to a caregiver. Free access to a full bottle is the highest-risk pattern — accidental double-dosing is common.",
  },
  {
    q: "Can a non-medical caregiver handle medications?",
    a: "In most states, a companion or personal-care aide can 'remind' a client to take medication and hand them the prepared pill box, but cannot physically administer the medication from the bottle. Skilled nursing is required for injections, complex medication changes, or anyone who cannot self-administer. Rules vary — check your state.",
  },
];

export const Route = createFileRoute("/resources/medication-management-seniors")({
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
            "Adults 65+ on 5+ medications have a >90% chance of at least one drug interaction.",
            "The single highest-ROI intervention is a pharmacist-led medication review — it's free.",
            "A weekly pill organizer plus phone-alarm reminders solves most simple cases.",
            "For cognitive decline, upgrade to a locking automatic dispenser or bring in caregiver help.",
          ]}
        />

        <p>
          Medication errors send an estimated 350,000 older adults to the emergency
          room every year in the US. Almost all of them are preventable. This is the
          system geriatric care managers set up for their clients.
        </p>

        <KeyStats
          items={[
            { stat: "40%", label: "of adults 65+ take 5 or more prescriptions" },
            { stat: "350K", label: "ER visits/year from med errors in older adults" },
            { stat: "$30B", label: "Estimated annual US cost of med non-adherence" },
          ]}
        />

        <h2>Step 1 — The brown-bag review</h2>
        <p>
          Once a year, or whenever a new prescription is added, put every bottle in a
          bag and bring it to the pharmacist. Ask three questions:
        </p>
        <ul>
          <li>Which of these can be dropped or lowered?</li>
          <li>Which combinations cause dizziness, sleepiness, or blood-pressure drops?</li>
          <li>Which should be taken with food, on empty stomach, or spaced apart?</li>
        </ul>
        <p>
          Pharmacists are trained and legally allowed to flag issues and coordinate
          with the prescriber. This is a free service at most chains.
        </p>

        <h2>Step 2 — Consolidate the pharmacy</h2>
        <p>
          Using one pharmacy for every prescription is the single easiest way to catch
          interactions — the pharmacy computer flags them automatically. Move all
          scripts (including mail-order and specialty) to one place.
        </p>

        <h2>Step 3 — Physical organization</h2>
        <ol>
          <li>
            <strong>Weekly pill box</strong> with AM/PM slots for anyone taking more
            than three medications a day. Fill it Sunday night, always in the same
            spot.
          </li>
          <li>
            <strong>One central location</strong> for the pill box — kitchen counter
            near where breakfast happens works better than a bathroom (steam degrades
            pills, and bathrooms are a fall risk).
          </li>
          <li>
            <strong>A written med list</strong> on the fridge and in the wallet:
            drug, dose, purpose, prescriber. Update it every change.
          </li>
        </ol>

        <h2>Step 4 — Reminders that actually work</h2>
        <ul>
          <li>Phone alarms labeled with the medication name — not "med time."</li>
          <li>Anchor doses to daily rituals: coffee, dinner, bedtime tea.</li>
          <li>For families across the country, a shared reminder app (or a call at pill time) works when the older adult is reliable but forgetful.</li>
        </ul>

        <h2>Step 5 — When to upgrade</h2>
        <p>
          If a parent is skipping doses, doubling up, or asking the same question
          repeatedly, a simple pill box is no longer enough. Options in order of cost:
        </p>
        <ol>
          <li><strong>Automatic locking dispenser</strong> ($50–$150, monthly service optional). Dispenses on schedule, alerts family if a dose is missed.</li>
          <li><strong>Blister-pack pharmacy service</strong>. The pharmacy pre-fills a pack with every dose in the correct slot. Free to low-cost with most Part D plans.</li>
          <li><strong>Caregiver medication reminders</strong>. A companion or personal-care aide arrives at dose times and hands the pills. Non-medical caregivers can remind and prompt; they cannot administer.</li>
          <li><strong>Skilled nursing visit</strong>. Required for injections, complex regimens, or anyone who cannot self-administer.</li>
        </ol>

        <h2>The five most dangerous mistakes</h2>
        <ol>
          <li>Mixing prescription sedatives (opioids, benzos, sleep aids) — additive risk of falls and respiratory issues.</li>
          <li>Blood thinners plus common OTC pain relievers (NSAIDs) — bleeding risk.</li>
          <li>Blood pressure meds plus dehydration — dizziness and falls, especially in summer.</li>
          <li>Grapefruit juice with statins and some heart meds.</li>
          <li>Stopping antidepressants or steroids abruptly — always taper with the prescriber.</li>
        </ol>

        <p>
          If you'd rather have a professional set up the system,{" "}
          <Link to="/services/healthcare">a skilled-nursing visit</Link> can build the
          plan and hand off the daily execution to a companion caregiver.
        </p>

        <ArticleFAQ items={faq} />

        <RelatedPosts
          items={[
            {
              to: "/resources/hospital-to-home-transition",
              title: "Hospital-to-Home Discharge Checklist",
              category: "Health",
              readMins: 13,
            },
            {
              to: "/resources/fall-prevention-seniors",
              title: "Fall Prevention at Home",
              category: "Safety",
              readMins: 8,
            },
            {
              to: "/resources/signs-parent-needs-help",
              title: "Signs Your Parent Needs Help",
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
