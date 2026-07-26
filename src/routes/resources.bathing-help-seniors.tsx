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

const path = "/resources/bathing-help-seniors";
const title = "When a Parent Refuses to Bathe: A Compassionate Playbook";
const description =
  "Bathing refusal is one of the most common — and most misunderstood — flashpoints in senior care. Why it happens, what to say, and the equipment and routines that turn a fight into a 10-minute task.";
const datePublished = "2026-07-10";
const category = "Guides";

const faq = [
  {
    q: "Why do older adults suddenly refuse to bathe?",
    a: "Almost never vanity or stubbornness. The usual causes: fear of falling, being cold, embarrassment about being seen naked, pain from arthritis when moving in the tub, sensory changes from dementia, or depression. Each cause has a different fix — start by asking what specifically feels bad about the shower.",
  },
  {
    q: "How often does an older adult actually need to bathe?",
    a: "Two to three full showers or baths a week is medically sufficient for most sedentary older adults, plus daily washing of the face, hands, underarms, and perineal area. Daily full showering can dry out aging skin and is not required. Reset your expectations before the negotiation.",
  },
  {
    q: "Is it easier if a family member or a professional caregiver helps?",
    a: "Almost always a professional. Adult children helping with intimate care creates role reversal, embarrassment, and preserved dignity issues on both sides. A trained caregiver is emotionally neutral, uses proven techniques, and — because it's their job — the older adult is often less resistant.",
  },
  {
    q: "What if my parent has dementia and can't cooperate?",
    a: "Shift from 'shower' to 'towel bath' or 'bed bath' with warm washcloths in a warm room, one body part at a time, always covered elsewhere. Task-based dementia care is more tolerable than transitions. If refusal is escalating, a dementia-trained caregiver on a consistent schedule is the highest-yield change.",
  },
];

export const Route = createFileRoute("/resources/bathing-help-seniors")({
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
            "Bathing refusal is almost always about fear, cold, or pain — not vanity.",
            "Two or three full showers per week is medically sufficient for most older adults.",
            "The right equipment (shower chair, handheld sprayer, grab bars) resolves most cases.",
            "A trained caregiver is usually far more effective — and better tolerated — than family.",
          ]}
        />

        <p>
          If you're negotiating with your parent about the shower, you're in the
          majority. It's the single most common flashpoint in senior care — and one of
          the most solvable, once you understand what's actually driving it.
        </p>

        <h2>What refusal really means</h2>
        <p>
          Ask the specific question: <em>What about the shower feels bad?</em> The
          answers cluster into five buckets, and each has a different playbook.
        </p>
        <ol>
          <li><strong>Fear of falling.</strong> By far the most common. Fix the environment first, argue about hygiene never.</li>
          <li><strong>Being cold.</strong> Aging bodies lose heat fast. Pre-warm the bathroom to 78°F+; have towels warming.</li>
          <li><strong>Pain.</strong> Joints hate stepping over a tub wall. A walk-in shower or transfer bench solves it.</li>
          <li><strong>Embarrassment.</strong> Being naked in front of an adult child feels different than in front of a paid professional. Consider who's doing the helping.</li>
          <li><strong>Dementia.</strong> Water on the face, sensation of undressing, and unfamiliar routines can feel threatening. Task-based, slow, covered.</li>
        </ol>

        <h2>The equipment that ends the fight</h2>
        <ul>
          <li><strong>Non-slip mat</strong> or textured decal strips inside the tub/shower.</li>
          <li><strong>Grab bars</strong> anchored to studs — inside the shower, next to the toilet, at the entrance.</li>
          <li><strong>Shower chair or transfer bench</strong>. Sitting eliminates 80% of the fear.</li>
          <li><strong>Handheld shower head</strong>. Total game-changer — the older adult stays in control and can avoid the face.</li>
          <li><strong>Heated bathroom</strong>. A small space heater running 15 minutes before is worth every dollar.</li>
          <li><strong>Warm towel on the shoulders</strong> during the whole process for anyone who feels exposed.</li>
        </ul>

        <h2>The routine that works</h2>
        <ol>
          <li>Same time, same days — predictability lowers resistance.</li>
          <li>Right after coffee or a favorite show — pair with a positive anchor.</li>
          <li>10 minutes total. Not 30. A quick task feels less like a project.</li>
          <li>Lay clothes out ahead of time so the whole thing has an obvious end.</li>
          <li>End with something they like — coffee, a snack, going out. The reward matters.</li>
        </ol>

        <h2>When family isn't the right helper</h2>
        <p>
          Intimate care from an adult child breaks role dynamics on both sides. If
          you're finding that Mom is fine with a stranger and impossible with you,
          that's normal — and the fix is a{" "}
          <Link to="/services/personal-care">trained personal-care aide</Link>. Two
          visits a week, at consistent times, resolves most bathing standoffs within a
          month.
        </p>

        <h2>For dementia specifically</h2>
        <ul>
          <li>Rename it: "let's get you freshened up" instead of "time for a shower."</li>
          <li>Use a <strong>towel bath</strong>: warm, damp washcloths, one section at a time, always covered elsewhere.</li>
          <li>No arguing. If today is a no, tomorrow is fine. Refusal is not defiance — it's confusion or fear.</li>
          <li>Consistent caregiver — a familiar face doubles cooperation rates.</li>
          <li>Distraction: music from their youth, a hand to hold, a running conversation about anything else.</li>
        </ul>

        <p>
          A companion caregiver with dementia training will often accomplish in one
          visit what family has struggled with for months — because they've done it a
          thousand times and it isn't personal.
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
              to: "/resources/companion-vs-personal-care",
              title: "Companion vs Personal Care vs Skilled Nursing",
              category: "Guides",
              readMins: 9,
            },
            {
              to: "/resources/fall-prevention-seniors",
              title: "Fall Prevention: Room-by-Room",
              category: "Safety",
              readMins: 8,
            },
          ]}
        />
      </ArticleBody>
      <CTASection />
    </PageShell>
  );
}
