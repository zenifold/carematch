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

const path = "/resources/hospital-to-home-transition";
const title = "Hospital-to-Home Discharge: The 7-Day Checklist That Prevents Readmission";
const description =
  "One in five Medicare patients over 65 is readmitted within 30 days of discharge. A day-by-day, evidence-based checklist to make the first week home safe — medications, follow-up, home setup, and red flags.";
const datePublished = "2026-07-05";
const category = "Health" as const;

const faq = [
  {
    q: "Why is the first week after discharge so risky?",
    a: "The average older adult leaves the hospital with 5–10 new or changed medications, a follow-up appointment they may not fully remember, and a home that wasn't set up for their reduced strength. Errors and falls in the first 7 days drive most 30-day readmissions.",
  },
  {
    q: "What is a 'medication reconciliation' and why does it matter?",
    a: "It's a line-by-line comparison of what the person was taking before hospitalization, what the discharge summary lists, and what's actually in their pill bottles. Discrepancies happen in about 60% of discharges and cause a large share of readmissions. Ask the discharge nurse or pharmacist to walk through it with you.",
  },
  {
    q: "Should we hire home care right after discharge?",
    a: "For anyone over 75, or after any surgery, hospitalization for a fall, heart failure, or pneumonia — yes, at least for the first 1–2 weeks. Even 3–4 hours a day of a companion or personal-care aide dramatically reduces readmission risk. Medicare home health (skilled nursing + PT) is separate and often available for free short-term.",
  },
  {
    q: "What is Medicare home health, and how do we get it?",
    a: "If the physician certifies the patient is 'homebound' and needs skilled care (nursing, PT, OT, speech), Medicare Part A covers home health visits for a 60-day episode — no copay, no deductible. The hospital case manager arranges it before discharge. Ask specifically: 'Are they eligible for home health?' — don't wait for it to be offered.",
  },
  {
    q: "What are the red flags that mean 'call the doctor now'?",
    a: "New confusion, chest pain, shortness of breath, fever over 100.4°F, uncontrolled pain, a surgical wound that becomes red/hot/draining, weight gain of 3+ lbs in a day (heart failure), or a fall. When in doubt, call the on-call number on the discharge paperwork — that's what it's for.",
  },
];

export const Route = createFileRoute("/resources/hospital-to-home-transition")({
  head: () =>
    articleHead({ path, title, description, datePublished, section: category, faq }),
  component: ArticlePage,
});

function ArticlePage() {
  return (
    <PageShell>
      <PageHero eyebrow={category} title={title} lead={description} />
      <ArticleBody>
        <ArticleMeta category={category} datePublished={datePublished} readMins={13} />

        <ArticleTLDR
          points={[
            "1 in 5 Medicare patients 65+ is readmitted within 30 days — most within the first 7.",
            "The three drivers: medication errors, missed follow-ups, and an unprepared home.",
            "Ask for a 'medication reconciliation' before discharge — discrepancies happen in ~60% of cases.",
            "Book the follow-up appointment before leaving the hospital — within 7 days if possible.",
            "For anyone 75+ or post-surgery, 3–4 hours/day of home care in week one cuts readmission risk significantly.",
          ]}
        />

        <p>
          The single riskiest week of a hospitalized older adult's year is the week
          <em> after</em> they come home. Not the surgery, not the ICU stay — the
          transition. This checklist compresses what discharge planners, geriatricians,
          and home health nurses know into a plan a family can actually execute.
        </p>

        <KeyStats
          items={[
            { stat: "20%", label: "Medicare 65+ readmitted within 30 days" },
            { stat: "60%", label: "Discharges with a medication discrepancy" },
            { stat: "7 days", label: "When most preventable readmissions happen" },
          ]}
        />

        <h2>Before discharge — what to ask</h2>
        <ol>
          <li><strong>Medication reconciliation.</strong> Ask a pharmacist or nurse to compare the pre-hospital list, the discharge list, and the actual bottles. Highlight what's new, stopped, or changed dose.</li>
          <li><strong>Follow-up appointment on the calendar.</strong> Ideally within 7 days with the primary-care doctor, sooner with the specialist. Don't leave without it booked.</li>
          <li><strong>Home health eligibility.</strong> "Are they homebound? Do they need skilled care?" If yes, Medicare Part A pays. Get the agency name before you leave.</li>
          <li><strong>Equipment.</strong> Walker, commode, shower chair, oxygen, hospital bed — arranged and delivered <em>before</em> the person gets home, not after.</li>
          <li><strong>Written discharge instructions.</strong> Diagnosis, medications, activity restrictions, wound care, red-flag symptoms, whom to call. In plain language, in the family's hands, before the wheels leave the hospital.</li>
        </ol>

        <h2>Day 0 — coming home</h2>
        <ul>
          <li>Clear paths: no rugs, no cords, chairs pushed in. See our <Link to="/resources/fall-prevention-seniors">fall-prevention room-by-room guide</Link>.</li>
          <li>Bed on the main floor if stairs are an issue.</li>
          <li>Pill organizer filled for the next 7 days — one slot per dose.</li>
          <li>Groceries stocked; easy meals for 3 days.</li>
          <li>Phone with big font, emergency numbers on the fridge.</li>
        </ul>

        <h2>Days 1–3 — the highest-risk window</h2>
        <ul>
          <li>Someone in the home most of the day. Not "checking in" — <em>present</em>.</li>
          <li>Track: temperature, weight (daily, same time, same clothes), pain level 0–10, medications given.</li>
          <li>Push fluids unless restricted; watch for dehydration signs (dry mouth, dark urine, confusion).</li>
          <li>Get up and move a few times a day — walking to the bathroom counts. Immobility drives blood clots and pneumonia.</li>
        </ul>

        <h2>Days 4–7 — locking it in</h2>
        <ul>
          <li>Attend the follow-up appointment. Bring the medication list and the daily tracking log.</li>
          <li>Cancel or renew home health visits based on progress.</li>
          <li>Reassess: is more or less home care needed for weeks 2–4?</li>
          <li>Fill any new prescriptions the same day — pharmacy delays are a common readmission trigger.</li>
        </ul>

        <h2>Red flags — call the doctor</h2>
        <ul>
          <li>Temperature over 100.4°F, chills, or new confusion.</li>
          <li>Chest pain, shortness of breath at rest, or new leg swelling.</li>
          <li>Surgical wound that is red, hot, draining, or opening.</li>
          <li>Weight gain of 3+ lbs in 24 hours or 5+ lbs in a week (heart failure).</li>
          <li>Any fall, even without visible injury.</li>
          <li>Inability to keep down food, water, or medications.</li>
        </ul>

        <h2>Who should be doing what</h2>
        <p>
          Split the work up front. One person owns medications. One owns appointments
          and paperwork. One is on-call for nights. If the family can't cover the first
          week, that's what <Link to="/services/personal-care">post-hospital personal care</Link> is for
          — a vetted caregiver who has done this exact thing hundreds of times.
        </p>

        <ArticleFAQ items={faq} />

        <RelatedPosts
          items={[
            {
              to: "/resources/fall-prevention-seniors",
              title: "Fall Prevention at Home",
              category: "Safety",
              readMins: 8,
            },
            {
              to: "/resources/companion-vs-personal-care",
              title: "Companion vs Personal Care vs Skilled Nursing",
              category: "Guides",
              readMins: 9,
            },
            {
              to: "/resources/medicare-medicaid-home-care",
              title: "Does Medicare Pay for Home Care?",
              category: "Costs",
              readMins: 10,
            },
          ]}
        />
      </ArticleBody>
      <CTASection />
    </PageShell>
  );
}
