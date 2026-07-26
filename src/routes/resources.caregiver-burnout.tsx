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

const path = "/resources/caregiver-burnout";
const title = "Caregiver Burnout: The Warning Signs and a Realistic Recovery Plan";
const description =
  "Caregiver burnout is a clinical syndrome — not a character flaw. The nine early signs, the four evidence-based interventions that actually help, and how to build a sustainable caregiving routine.";
const datePublished = "2026-07-02";
const category = "Health" as const;

const faq = [
  {
    q: "Is caregiver burnout a real medical condition?",
    a: "It's not a formal DSM diagnosis, but it maps closely to clinical depression and anxiety, and researchers have measured it consistently for decades using validated tools like the Zarit Burden Interview. Long-term caregivers show elevated cortisol, poorer immune function, and 63% higher mortality risk than non-caregivers of the same age (Schulz & Beach, JAMA).",
  },
  {
    q: "How is burnout different from just being tired?",
    a: "Tired resolves with a night's sleep. Burnout doesn't. The hallmarks are emotional exhaustion that persists after rest, cynicism or numbness toward the person you're caring for, and a sense of ineffectiveness — feeling like nothing you do is enough. If a week off would not restore you, it's beyond ordinary fatigue.",
  },
  {
    q: "What actually helps? Not just 'take a bubble bath.'",
    a: "Four things have real evidence behind them: (1) structured respite — regular, scheduled breaks, not occasional ones; (2) a caregiver support group, in-person or online; (3) cognitive-behavioral therapy or a caregiver-specific counselor; (4) medication when depression or anxiety are clinical. Bubble baths do not fix chronic role overload.",
  },
  {
    q: "I feel guilty for wanting a break. Is that normal?",
    a: "Yes — and it's usually the thing keeping caregivers in the burnout trap. The reframe most caregivers find useful: your loved one needs a rested, healthy caregiver more than they need a martyred one. Caregivers who take regular respite keep loved ones at home longer, on average.",
  },
  {
    q: "When should I involve a doctor?",
    a: "If you have sleep disruption for more than 2 weeks, ongoing tearfulness, thoughts that everyone would be better off without you, physical symptoms without a clear cause, or you've started drinking more — book a visit with your own primary care doctor. Say the word 'caregiver' at check-in; it changes the visit.",
  },
];

export const Route = createFileRoute("/resources/caregiver-burnout")({
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
            "Burnout is emotional exhaustion + cynicism + a sense of ineffectiveness — and it doesn't resolve with a nap.",
            "Long-term caregivers face 63% higher mortality than non-caregiver peers (Schulz & Beach, JAMA).",
            "Four things have evidence: scheduled respite, support groups, CBT, and medication when clinical.",
            "The guilt is nearly universal. It's not proof you're doing something wrong — it's a symptom.",
            "If sleep, mood, or physical symptoms have shifted for 2+ weeks, see your own doctor.",
          ]}
        />

        <p>
          If you're reading this at 2am, you're the person this is written for. Caregiver
          burnout is one of the best-studied and least-talked-about health issues in
          older-adult care. It affects the caregiver's health, their relationships,
          their job — and their ability to keep giving good care.
        </p>

        <KeyStats
          items={[
            { stat: "40%", label: "Long-term caregivers with clinical depression symptoms" },
            { stat: "63%", label: "Increase in mortality vs non-caregivers (JAMA)" },
            { stat: "24 hrs/wk", label: "Median unpaid family caregiving in the US" },
          ]}
        />

        <h2>The nine early warning signs</h2>
        <ol>
          <li>Sleep changes — trouble falling asleep, waking at 3am, or sleeping too much.</li>
          <li>Weight or appetite shifts.</li>
          <li>Persistent irritability toward the person you're caring for.</li>
          <li>Withdrawing from friends, hobbies, and things you used to enjoy.</li>
          <li>Physical symptoms: headaches, back pain, stomach issues without clear cause.</li>
          <li>Increased alcohol, caffeine, or sedative use.</li>
          <li>Difficulty concentrating; forgetting appointments and tasks.</li>
          <li>Feeling numb — neither happy nor sad, just flat.</li>
          <li>Recurring thought: "I can't do this anymore."</li>
        </ol>
        <p>Three or more of these for two-plus weeks is the threshold to act.</p>

        <h2>Why willpower isn't the fix</h2>
        <p>
          Burnout is a structural problem — too much demand, not enough recovery — dressed
          up as a personal failing. Working harder makes it worse. The interventions that
          work all reduce total load or increase recovery, not "try harder."
        </p>

        <h2>The four things with real evidence</h2>
        <h3>1. Scheduled respite</h3>
        <p>
          Not "when I can get away." A recurring block on the calendar — 4 hours every
          Tuesday, a weekend a month, an adult day program three days a week. The
          predictability is the point; anticipating the break lowers cortisol before it
          happens. Read our <Link to="/resources/respite-care-guide">respite care guide</Link> for
          how to arrange and fund it.
        </p>
        <h3>2. A support group</h3>
        <p>
          Being in a room (or a Zoom) with people who get it moves the needle more than
          most caregivers expect. AARP, the Alzheimer's Association, and local Area
          Agencies on Aging run free groups. If you can't attend in person, r/AgingParents
          on Reddit is a surprisingly good asynchronous option.
        </p>
        <h3>3. CBT or caregiver-specific counseling</h3>
        <p>
          Cognitive-behavioral therapy targeted at caregivers has strong evidence for
          reducing burden and depression. Ask your primary-care doctor for a referral to
          a therapist who works with family caregivers, or search Psychology Today's
          directory with "caregiver stress" as a specialty.
        </p>
        <h3>4. Medication when it's clinical</h3>
        <p>
          When symptoms cross into clinical depression or anxiety, medication can be the
          difference between coping and drowning. This is a medical decision — start with
          your own primary-care doctor, not the internet.
        </p>

        <h2>The load-shedding audit</h2>
        <p>Sit down with a piece of paper and list everything you currently do for the person you care for. Then, honestly, mark each item:</p>
        <ul>
          <li><strong>Must be me.</strong> Emotional presence, key medical decisions, family relationships.</li>
          <li><strong>Could be someone else, if I let it.</strong> Bathing, meal prep, laundry, transportation, medication reminders, companionship visits.</li>
          <li><strong>Doesn't actually need to happen.</strong> Standards you're upholding out of guilt.</li>
        </ul>
        <p>
          Almost every burned-out caregiver has 6–10 items in the second column. That's
          the target list — those are the tasks a{" "}
          <Link to="/services/companionship">vetted caregiver</Link> can take on, freeing
          you for what actually has to be you.
        </p>

        <h2>What to say to yourself at 2am</h2>
        <p className="text-lg italic">
          "Getting help is part of the care, not the opposite of it. The person I love
          needs a well version of me more than they need a martyr."
        </p>

        <ArticleFAQ items={faq} />

        <RelatedPosts
          items={[
            {
              to: "/resources/respite-care-guide",
              title: "Respite Care: Who Pays, How to Get a Break",
              category: "Costs",
              readMins: 12,
            },
            {
              to: "/resources/how-to-talk-to-parent-about-care",
              title: "Talking to a Parent About Getting Help",
              category: "Planning",
              readMins: 9,
            },
            {
              to: "/resources/dementia-care-tips",
              title: "Dementia Care at Home",
              category: "Dementia",
              readMins: 7,
            },
          ]}
        />
      </ArticleBody>
      <CTASection />
    </PageShell>
  );
}
