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

const path = "/resources/signs-parent-needs-help";
const title = "10 Signs Your Aging Parent Needs Help at Home";
const description =
  "The quiet signals — unopened mail, weight loss, expired food, missed medications — that adult children notice first, and how to move from worry to a plan.";
const datePublished = "2026-06-24";
const category = "Planning";

const faq = [
  {
    q: "At what age do most parents start needing help at home?",
    a: "There is no fixed age — the honest answer is 'when function starts slipping'. Most families notice the first signs somewhere between 75 and 82, but health events (a fall, a hospitalization, a spouse's death) can move that timeline forward by years overnight.",
  },
  {
    q: "How do I bring up the topic without offending my parent?",
    a: "Lead with what you're observing, not what you're deciding. 'I noticed the mail piling up — is that overwhelming lately?' invites a conversation. 'You need help' shuts one down. Frame help as making their independence sustainable, not as a step toward losing it.",
  },
  {
    q: "What should I do if my parent refuses help?",
    a: "Start smaller than you think. One 3-hour visit a week for companionship or errands is easier to accept than daily personal care. Let them meet the helper before committing. Involve them in choosing. Refusal usually softens once they experience the help as a relief rather than a takeover.",
  },
  {
    q: "When should I stop trying to manage this alone?",
    a: "If you're driving over daily, missing work, or losing sleep — that is the sign. Family caregivers who wait until they're burned out end up making rushed placement decisions. Bring in a few hours of paid help before the crisis, not after.",
  },
];

export const Route = createFileRoute("/resources/signs-parent-needs-help")({
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
            "The earliest signs are usually environmental — mail, food, laundry, hygiene.",
            "Weight loss, medication mistakes, and unexplained bruises are the highest-priority signals.",
            "Adult children usually notice something is off 6–12 months before they act.",
            "Starting with a few hours of paid help a week is easier to accept than a big change.",
          ]}
        />

        <p>
          Most families don't wake up one morning to a crisis. They notice small things
          over months — a stack of unopened mail, a fridge with expired yogurt, a
          parent wearing the same sweater on three visits — and quietly wonder if it's
          time. Here's the checklist care managers use.
        </p>

        <h2>The 10 signs, in rough priority order</h2>
        <ol>
          <li>
            <strong>Unexplained weight loss.</strong> Clothes hanging looser, meals
            skipped, groceries not restocked. A 5% drop in body weight over 6 months is
            clinically meaningful.
          </li>
          <li>
            <strong>Medication mistakes.</strong> Bottles with too many pills left. New
            prescriptions never filled. Double-dosing. This is the fastest-moving risk
            on the list.
          </li>
          <li>
            <strong>Unopened mail and unpaid bills.</strong> Especially utility
            shut-off notices, tax letters, or a full inbox of insurance mail. Often
            the first visible sign of executive-function decline.
          </li>
          <li>
            <strong>Expired food and empty staples.</strong> Milk two weeks past date,
            no bread, freezer full of the same TV dinner. A fridge audit is one of the
            most honest indicators of daily function.
          </li>
          <li>
            <strong>Hygiene changes.</strong> Body odor, unbrushed hair, wearing the
            same clothes across visits — usually not about vanity, usually about
            mobility, fear of falling in the shower, or fatigue.
          </li>
          <li>
            <strong>New bruises or scrapes.</strong> Often from unreported falls or
            near-falls. Ask; parents rarely volunteer these.
          </li>
          <li>
            <strong>Withdrawal from activities.</strong> Missed church, quit bridge
            night, stopped calling old friends. Isolation accelerates cognitive
            decline.
          </li>
          <li>
            <strong>Driving concerns.</strong> New scratches on the car, getting lost
            on familiar routes, other drivers honking. A single at-fault accident
            usually means it's time.
          </li>
          <li>
            <strong>A messier home than usual.</strong> Not clutter — <em>neglect</em>.
            Trash overflowing, laundry piled, plants dying. Change from their baseline
            matters more than any absolute standard.
          </li>
          <li>
            <strong>Confusion or repetition.</strong> Repeating the same story within
            an hour, forgetting recent conversations, calling you at odd times.
            Distinct from normal age-related forgetting.
          </li>
        </ol>

        <h2>What to do this week</h2>
        <ol>
          <li>
            <strong>Do a "fridge and pill" check next visit.</strong> Open both without
            fanfare.
          </li>
          <li>
            <strong>Ask, don't announce.</strong> "What's been feeling harder lately?"
            beats "You can't live alone."
          </li>
          <li>
            <strong>Start small.</strong> Three hours a week of companion care or
            errands is a low bar to clear and usually welcome.
          </li>
          <li>
            <strong>Loop in siblings before, not after, you act.</strong> Aligned
            families move faster.
          </li>
          <li>
            <strong>Book the annual physical.</strong> Ask the doctor to screen for
            depression and do a mini-mental status exam.
          </li>
        </ol>

        <p>
          If you're seeing three or more of these,{" "}
          <Link to="/resources/how-to-choose-a-caregiver">
            here's how to pick the right kind of help
          </Link>
          .
        </p>

        <ArticleFAQ items={faq} />

        <RelatedPosts
          items={[
            {
              to: "/resources/aging-in-place-checklist",
              title: "The Aging-in-Place Checklist",
              category: "Planning",
              readMins: 8,
            },
            {
              to: "/resources/companion-vs-personal-care",
              title: "Companion vs Personal Care vs Skilled Nursing",
              category: "Guides",
              readMins: 9,
            },
            {
              to: "/resources/fall-prevention-seniors",
              title: "Fall Prevention at Home",
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
