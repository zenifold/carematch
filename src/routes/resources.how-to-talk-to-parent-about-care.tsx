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

const path = "/resources/how-to-talk-to-parent-about-care";
const title = "How to Talk to Your Parent About Getting Help at Home";
const description =
  "The conversation adult children dread. A therapist- and geriatric-care-manager-vetted script for talking to an aging parent about accepting help — how to frame it, what to avoid, and how to handle 'no.'";
const datePublished = "2026-06-28";
const category = "Planning" as const;

const faq = [
  {
    q: "Why is my parent so resistant, even when they clearly need help?",
    a: "For their generation, accepting help usually means admitting a loss — of independence, of identity, of the role of provider. Resistance is almost never about the specific task ('I don't need a shower aide'). It's about what the help represents. Naming the fear ('I know this feels like the beginning of losing your independence') moves the conversation more than arguing about facts.",
  },
  {
    q: "Should siblings be part of the conversation?",
    a: "Yes — but aligned first, then together. Talk with siblings before talking with the parent. Nothing derails this conversation faster than a sibling contradicting you mid-discussion. Pick one primary voice; others support.",
  },
  {
    q: "What if they flatly refuse?",
    a: "Unless they lack capacity, they have the right to refuse. Push once, don't push twice. Instead: keep the door open, agree on a specific 'if this happens, we revisit' trigger (a fall, a hospital stay, a lost bill), and start smaller — a cleaner, a grocery service, a companion visit framed as a friend. Most parents accept care in stages, not in one big yes.",
  },
  {
    q: "How do I know if they lack capacity to decide?",
    a: "Capacity is decision-specific and legally defined. Signs of lost capacity include not understanding the consequences of refusing help, inability to weigh risks, or fluctuating awareness. If you suspect this, a geriatrician can perform a formal capacity assessment. Don't try to make the call yourself.",
  },
  {
    q: "What if my parent has dementia?",
    a: "The rules change. Long explanations rarely work. Frame help concretely and in the present tense: 'Maria is coming over on Tuesdays to help.' Avoid asking their permission for the abstract idea. See our dementia care tips guide for language patterns that work.",
  },
];

export const Route = createFileRoute("/resources/how-to-talk-to-parent-about-care")({
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
            "Resistance is almost never about the task — it's about what accepting help represents.",
            "Align with siblings first. One primary voice, others support.",
            "Ask questions before making statements. Curiosity opens; announcements close.",
            "Start small — a housekeeper, a grocery service, a 'friend' who visits — before hiring a full caregiver.",
            "Unless capacity is lost, they have the right to refuse. Keep the door open with a specific 'if X, we revisit.'",
          ]}
        />

        <p>
          This is the conversation adult children lose the most sleep over. It's rarely
          a single conversation — more often it's five or six, spread over months, with
          the same theme in different forms. Here's what geriatric care managers and
          therapists who specialize in this actually recommend.
        </p>

        <h2>Before you say anything: prepare</h2>
        <ol>
          <li><strong>Pick the setting.</strong> Not the holiday dinner. Not the car. A calm afternoon at their home, no siblings interrupting.</li>
          <li><strong>Align with siblings first.</strong> One person leads. Others don't contradict mid-conversation.</li>
          <li><strong>Know what you're asking for.</strong> "Some help" is easier to refuse than "Maria comes Tuesdays and Thursdays, 10 to 2."</li>
          <li><strong>Have options ready but not on the table yet.</strong> Save specifics for after they've been heard.</li>
        </ol>

        <h2>Open with a question, not a verdict</h2>
        <p>
          The instinct is to lay out your evidence — the unopened mail, the expired
          food, the fall. Resist. Start by asking how <em>they</em> think things are
          going.
        </p>
        <p className="text-lg italic">
          "Dad, I've been thinking about how you're doing at home. I'd love to hear
          how you feel it's going — what's easy, what's hard right now."
        </p>
        <p>
          Then <em>listen</em>. You'll usually hear one of two things: (a) an honest
          admission that some things are hard, which opens the door directly, or (b)
          "everything's fine," which tells you the fear of losing independence is
          driving the conversation. Both are useful.
        </p>

        <h2>Name the fear</h2>
        <p>
          If they deflect, name what you think is underneath. This lands harder than any
          argument about facts:
        </p>
        <p className="text-lg italic">
          "I know part of what makes this hard is that accepting help can feel like
          admitting things are changing. That's a big deal. I'm not trying to take
          anything away from you — I want to keep you here, at home, for as long as
          possible. That's the whole point."
        </p>

        <h2>Reframe help as staying independent, not losing it</h2>
        <p>
          The reframe that unlocks the most conversations: <em>help is what keeps them
          in their home</em>. Without it, the next fall or hospital stay is the trigger
          for a much bigger, less-chosen move. This is not a scare tactic — it's the
          data. It just needs to be said gently, once.
        </p>

        <h2>Start smaller than you think</h2>
        <p>
          Most parents accept care in stages. Order for lowest to highest friction:
        </p>
        <ol>
          <li>A cleaner every two weeks.</li>
          <li>Grocery delivery.</li>
          <li>A yard service or handyman.</li>
          <li>A "friend" who visits — a companion caregiver framed as company, not care.</li>
          <li>A few hours a week of personal-care support (bathing, dressing).</li>
          <li>Daily visits or live-in.</li>
        </ol>
        <p>
          Skipping steps is the single most common reason these conversations blow up.
          Nobody goes straight from "I'm fine" to "someone helps me shower." See our{" "}
          <Link to="/resources/companion-vs-personal-care">breakdown of companion vs personal care</Link> for
          which category fits where.
        </p>

        <h2>The "trial" framing</h2>
        <p>
          If they're on the fence, propose a time-boxed trial: "Let's try Tuesdays for a
          month, and then we'll decide together." A trial is much easier to say yes to
          than a permanent decision, and almost every family we've worked with reports
          the parent quietly asking to add hours by month three.
        </p>

        <h2>When they say no</h2>
        <p>Don't push twice. Do these instead:</p>
        <ul>
          <li>Reflect their concern back: "It sounds like this feels premature — I hear you."</li>
          <li>Agree on a specific trigger to revisit: "If you have another fall, or if the doctor recommends it, can we talk about this again?"</li>
          <li>Ask their permission to keep watching: "Would it be okay if I check in about this every couple months?"</li>
          <li>Follow up in writing, gently — a short letter often lands better than more talking.</li>
        </ul>

        <h2>What not to do</h2>
        <ul>
          <li>Don't ambush them with all the siblings at once. It reads as an intervention.</li>
          <li>Don't hire someone and surprise them with it.</li>
          <li>Don't argue with denial — restate concerns calmly and move on.</li>
          <li>Don't threaten with "then we'll have to move you somewhere." It ends the conversation and the trust.</li>
        </ul>

        <p>
          When they're ready — often after one small yes — the practical part is
          straightforward: our{" "}
          <Link to="/resources/how-to-choose-a-caregiver">guide to choosing a caregiver</Link> covers
          the seven questions to ask, and{" "}
          <Link to="/how-it-works">how CompanionCare works</Link> walks through matching in
          your area.
        </p>

        <ArticleFAQ items={faq} />

        <RelatedPosts
          items={[
            {
              to: "/resources/signs-parent-needs-help",
              title: "10 Signs Your Parent Needs Help",
              category: "Planning",
              readMins: 9,
            },
            {
              to: "/resources/how-to-choose-a-caregiver",
              title: "How to Choose an In-Home Caregiver",
              category: "Guides",
              readMins: 10,
            },
            {
              to: "/resources/caregiver-burnout",
              title: "Caregiver Burnout: Signs and Recovery",
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
