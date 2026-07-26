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

const path = "/resources/sundowning-strategies";
const title = "Sundowning: Why Late Afternoon Gets Hard, and What Actually Helps";
const description =
  "Sundowning affects up to 66% of people with dementia. The evidence-based routine — light, meals, activity, and environment — that reduces late-day confusion, agitation, and wandering.";
const datePublished = "2026-07-01";
const category = "Dementia";

const faq = [
  {
    q: "What is sundowning exactly?",
    a: "Sundowning (or 'late-day confusion') is a pattern of increased confusion, agitation, restlessness, or anxiety that shows up in the late afternoon and evening in people with dementia. It's not a separate disease — it's a symptom cluster tied to circadian-rhythm disruption, fatigue, and diminished ability to process a busy environment as the day winds down.",
  },
  {
    q: "How common is it?",
    a: "Sundowning affects an estimated 20-66% of people with Alzheimer's and other dementias, depending on how it's measured. It's more common in the middle stages of the disease and often lessens in late stage.",
  },
  {
    q: "Is medication the answer?",
    a: "It's a last resort. Non-drug interventions — light, routine, activity, and environment — outperform medication for most people, and antipsychotics carry a black-box warning for older adults with dementia. If medication is being considered, ask specifically about melatonin (safer) before benzodiazepines or antipsychotics.",
  },
  {
    q: "Can a caregiver help specifically with the sundowning window?",
    a: "Yes — and it's one of the highest-value uses of paid care. A consistent caregiver arriving mid-afternoon, staying through dinner and the transition to evening, prevents the exact conditions that trigger sundowning: fatigue, isolation, and unstructured time. Same caregiver, same time, same routine.",
  },
];

export const Route = createFileRoute("/resources/sundowning-strategies")({
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
            "Sundowning is late-day confusion and agitation in dementia — affects up to 66% of people with the disease.",
            "The four biggest levers: morning light, a predictable schedule, activity earlier in the day, and a calm environment at dusk.",
            "Medication is a last resort. Non-drug approaches work better and are safer.",
            "A caregiver present during the 3–7 PM window is the single most effective intervention.",
          ]}
        />

        <p>
          If afternoons in your house have started to feel like walking on eggshells,
          you're not imagining it. Sundowning is real, common, and — mostly —
          manageable without medication. Here's the routine that works.
        </p>

        <h2>What triggers it</h2>
        <ul>
          <li>Fatigue from a full day of processing input.</li>
          <li>Falling light levels — the circadian rhythm signals confusion.</li>
          <li>Hunger or low blood sugar as dinner approaches.</li>
          <li>Increased household activity: kids home from school, TV on, cooking noise.</li>
          <li>End-of-shift changes for paid caregivers — new face, new energy.</li>
          <li>Unmet physical needs the person can't articulate: pain, need to use the bathroom, cold.</li>
        </ul>

        <h2>The morning sets the afternoon</h2>
        <p>
          What happens between 7 AM and 11 AM often determines what happens at 5 PM.
        </p>
        <ol>
          <li><strong>Bright light within 30 minutes of waking.</strong> Open every blind, sit by a window, or use a light-therapy box (10,000 lux for 20–30 minutes). This is the single most-supported intervention.</li>
          <li><strong>Consistent wake time</strong> — same time every day.</li>
          <li><strong>Physical activity in the morning.</strong> A walk, chair exercises, gardening. Late-day activity often backfires.</li>
          <li><strong>Cognitive engagement early.</strong> Puzzles, music, conversation, a task. Save the demanding stuff for AM.</li>
        </ol>

        <h2>The afternoon environment</h2>
        <ul>
          <li>Keep the house well-lit as natural light drops. Turn lamps on <em>before</em> dusk, not after.</li>
          <li>Reduce noise and stimulation from 3 PM on. TV off or on a calm channel.</li>
          <li>Limit visitors during the sundowning window — save them for morning.</li>
          <li>Move the biggest meal of the day earlier; a light dinner is easier to process.</li>
          <li>Cap caffeine at noon; no sugar spikes late.</li>
        </ul>

        <h2>The 3–7 PM playbook</h2>
        <ol>
          <li><strong>Snack at 3 PM.</strong> Low blood sugar drives a lot of afternoon agitation.</li>
          <li><strong>Toilet check.</strong> A full bladder that they can't identify shows up as restlessness.</li>
          <li><strong>Structured, calm activity.</strong> Folding towels, sorting objects, brushing the dog, looking through old photos, listening to familiar music from their youth.</li>
          <li><strong>One trusted person.</strong> Not a rotating cast. Sundowning gets worse with unfamiliar faces.</li>
          <li><strong>Redirect, don't correct.</strong> If they say "I need to go home" — even when they're home — don't argue. Offer a snack, a walk, a task. The feeling passes.</li>
        </ol>

        <h2>Nighttime setup</h2>
        <ul>
          <li>Consistent bedtime routine — same order, same time.</li>
          <li>Warm room, weighted blanket if welcomed.</li>
          <li>Motion-activated night lights between bed and bathroom.</li>
          <li>Door alarm or motion sensor if wandering is a concern.</li>
        </ul>

        <h2>Medication — the honest picture</h2>
        <ul>
          <li><strong>Melatonin</strong> (0.3–1 mg): supported by studies, low risk, worth trying first with the doctor's okay.</li>
          <li><strong>Cholinesterase inhibitors</strong> (already commonly prescribed for Alzheimer's) can modestly reduce behavioral symptoms.</li>
          <li><strong>Antipsychotics</strong>: black-box warning for increased stroke and death risk in older adults with dementia. Reserved for severe cases where safety is at risk.</li>
          <li><strong>Benzodiazepines</strong>: usually make sundowning worse, plus fall risk. Almost never the right answer.</li>
        </ul>

        <p>
          The single change that helps most families is bringing in{" "}
          <Link to="/services/companionship">a consistent caregiver for the 3–7 PM
          window</Link>. Same person, same routine, three or four afternoons a week —
          it stabilizes the hardest hours of the day and gives the family caregiver a
          reliable break exactly when they need one.
        </p>

        <ArticleFAQ items={faq} />

        <RelatedPosts
          items={[
            {
              to: "/resources/dementia-care-tips",
              title: "Dementia Care at Home",
              category: "Dementia",
              readMins: 7,
            },
            {
              to: "/resources/memory-care-at-home-vs-facility",
              title: "Memory Care at Home vs Facility",
              category: "Dementia",
              readMins: 12,
            },
            {
              to: "/resources/bathing-help-seniors",
              title: "When a Parent Refuses to Bathe",
              category: "Guides",
              readMins: 9,
            },
          ]}
        />
      </ArticleBody>
      <CTASection />
    </PageShell>
  );
}
