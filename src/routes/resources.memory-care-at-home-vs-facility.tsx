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

const path = "/resources/memory-care-at-home-vs-facility";
const title = "Memory Care at Home vs Memory Care Facility: Which Is Right?";
const description =
  "Should someone with Alzheimer's or dementia stay home, or move to a memory care facility? A decision framework based on stage, safety, cost, and quality of life — with the questions to ask before either.";
const datePublished = "2026-06-13";
const category = "Dementia" as const;

const faq = [
  {
    q: "At what stage of dementia does home stop being a good option?",
    a: "There's no single stage. The trigger is usually one of: unsafe wandering that can't be secured; aggression that puts the caregiver at risk; incontinence combined with mobility issues; or a primary caregiver who is physically or mentally unable to continue. Stage matters less than whether the home environment can meet current needs safely.",
  },
  {
    q: "How much does memory care cost vs. home?",
    a: "In 2026, memory care facilities average $7,000–$10,000/month nationally (higher in major metros). In-home dementia care ranges widely: 20 hrs/week at $35/hr is ~$3,000/month; live-in is $10,500–$15,000/month; 24-hour is $18,000–$27,000/month. Home is cheaper below ~40 hours/week of paid help; facilities become cheaper above that.",
  },
  {
    q: "Does Medicare pay for memory care?",
    a: "No — Medicare does not pay for the room-and-board or custodial-care portion of memory care, at home or in a facility. It covers doctor visits, some rehab, and hospice. Long-term dementia care is paid privately, through long-term care insurance, or by Medicaid for those who qualify.",
  },
  {
    q: "What quality-of-life outcomes are better at home vs facility?",
    a: "Research is mixed. People with mild-to-moderate dementia usually do better at home — familiar environment reduces confusion and agitation. In moderate-to-severe stages, well-run memory care facilities can offer better socialization, safer environments, and more consistent staff coverage than a single exhausted family caregiver.",
  },
  {
    q: "What should we look for when touring a memory care facility?",
    a: "Staff-to-resident ratio (aim for 1:6 or better during the day), consistent staff assignments (not rotating), a secure but not clinical layout, meaningful daily activities, and how staff interact with residents when they don't know you're watching. Visit unannounced at least once.",
  },
];

export const Route = createFileRoute("/resources/memory-care-at-home-vs-facility")({
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
            "The trigger isn't stage — it's whether the home can be made safe and the caregiver can keep going.",
            "Memory care facilities: $7,000–$10,000/month. In-home varies from $3,000 (part-time) to $27,000 (24-hour).",
            "Home is typically better for mild-to-moderate dementia; facilities become viable in moderate-to-severe.",
            "Medicare does not pay for long-term dementia care at home OR in a facility. Medicaid HCBS waivers and long-term care insurance can.",
            "Half of families delay the move too long. A third move too early. The decision framework below helps.",
          ]}
        />

        <p>
          There is no universally right answer to this question — but there is a right
          answer for each family, and it usually becomes clear when you separate the
          medical question ("what does this person need?") from the human question
          ("what can we sustain?"). Both matter.
        </p>

        <KeyStats
          items={[
            { stat: "7M+", label: "Americans living with Alzheimer's (2026 est.)" },
            { stat: "80%", label: "Of dementia care given by family at home" },
            { stat: "$7–10K", label: "Monthly memory care facility cost" },
          ]}
        />

        <h2>The decision framework</h2>
        <p>Score each of the five factors below 1–5. A total of 20+ usually indicates a facility conversation is time. Under 15, home is likely still the right setting with more support.</p>

        <h3>1. Safety at home</h3>
        <p>Can the home be secured against wandering? Is the person a fall risk? Is there a stove/appliance danger? (1 = fully secured, 5 = daily near-miss.)</p>
        <h3>2. Caregiver capacity</h3>
        <p>Is the primary caregiver rested, healthy, and able to continue for another year? (1 = sustainable, 5 = burnt out.) See our <Link to="/resources/caregiver-burnout">burnout signs and recovery guide</Link>.</p>
        <h3>3. Behavior and needs</h3>
        <p>Are there aggression, sundowning, or incontinence issues that a facility handles better? (1 = calm, 5 = daily crises.)</p>
        <h3>4. Socialization</h3>
        <p>Is the person isolated at home? Facilities can offer structured social interaction. (1 = rich social life at home, 5 = alone most of the day.)</p>
        <h3>5. Cost sustainability</h3>
        <p>Is the current setup financially viable for the next 2–3 years? (1 = fully sustainable, 5 = will exhaust savings within a year.)</p>

        <h2>When home is usually the better choice</h2>
        <ul>
          <li>Mild-to-moderate dementia — the person still recognizes home and family.</li>
          <li>Behavior is manageable; sleep is mostly through the night.</li>
          <li>Home can be modified (locks, cameras, secured yard).</li>
          <li>Family can support 20–40 hours/week of paid help.</li>
          <li>The person has clearly stated a preference to age in place.</li>
        </ul>

        <h2>When memory care usually becomes the better choice</h2>
        <ul>
          <li>Wandering that can't be prevented despite door alarms and locks.</li>
          <li>Aggression toward the primary caregiver — this is a safety and dignity issue.</li>
          <li>Sundowning that requires an awake overnight caregiver.</li>
          <li>Incontinence plus mobility issues that require two people to transfer.</li>
          <li>Primary caregiver is in clinical burnout, has their own health crisis, or must return to work.</li>
        </ul>

        <h2>The cost comparison in real numbers</h2>
        <p>Rough monthly comparisons at 2026 rates:</p>
        <ul>
          <li><strong>Home, 20 hrs/wk paid help:</strong> $2,800–$3,600/month.</li>
          <li><strong>Home, 40 hrs/wk paid help:</strong> $5,600–$7,200/month.</li>
          <li><strong>Home, live-in:</strong> $10,500–$15,000/month.</li>
          <li><strong>Home, 24-hour:</strong> $18,000–$27,000/month.</li>
          <li><strong>Memory care facility:</strong> $7,000–$10,000/month (metro: $10,000–$14,000).</li>
        </ul>
        <p>
          For families needing more than about 40 hours a week of paid home help, memory
          care facilities are often the cheaper option. Below that threshold, home is
          typically cheaper. See our{" "}
          <Link to="/resources/live-in-vs-24-hour-care">live-in vs 24-hour breakdown</Link> for
          the finer detail on home care levels.
        </p>

        <h2>Making the home work longer</h2>
        <p>If you're leaning toward home, the highest-leverage upgrades:</p>
        <ol>
          <li>Door alarms and, if wandering is real, GPS-tracked shoes or a pendant.</li>
          <li>Simplified environment — one plate, one cup, one remote. Cognitive load compounds.</li>
          <li>Consistent daily routine, ideally the same caregivers each day.</li>
          <li>Enroll in an <strong>adult day program</strong> 2–3 days/week — huge quality-of-life boost and gives the primary caregiver structured breaks.</li>
          <li>Read our <Link to="/resources/dementia-care-tips">10 small changes that make dementia care easier</Link>.</li>
        </ol>

        <h2>If moving to memory care: how to choose</h2>
        <ol>
          <li>Visit at least three facilities. Tour unannounced at least once.</li>
          <li>Ask staff turnover rate; anything above 60%/year is a red flag.</li>
          <li>Ask about staff-to-resident ratio during day, evening, and overnight.</li>
          <li>Observe residents: engaged or parked in front of a TV?</li>
          <li>Ask what happens if care needs increase — do they escalate or discharge?</li>
          <li>Read state inspection reports (each state's health department publishes them).</li>
        </ol>

        <h2>The transition itself</h2>
        <p>
          Moves are hard on people with dementia. Two evidence-informed tips: bring
          familiar objects to make the new room look like home before day one, and keep
          the first few visits short, positive, and end them on a high note. Discomfort
          in weeks 1–3 is normal; if it persists past 6 weeks, something's wrong and
          you should escalate to the facility director.
        </p>

        <ArticleFAQ items={faq} />

        <RelatedPosts
          items={[
            {
              to: "/resources/dementia-care-tips",
              title: "10 Small Changes That Make Dementia Care Easier",
              category: "Dementia",
              readMins: 7,
            },
            {
              to: "/resources/caregiver-burnout",
              title: "Caregiver Burnout: Signs and Recovery",
              category: "Health",
              readMins: 10,
            },
            {
              to: "/resources/live-in-vs-24-hour-care",
              title: "Live-In vs 24-Hour Care",
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
