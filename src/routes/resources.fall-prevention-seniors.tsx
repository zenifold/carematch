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

const path = "/resources/fall-prevention-seniors";
const title = "Fall Prevention at Home: A Room-by-Room Guide";
const description =
  "One in four older adults falls each year. A practical room-by-room guide to the fixes — grab bars, lighting, rugs, footwear — that reduce fall risk the most.";
const datePublished = "2026-06-09";
const category = "Safety";

const faq = [
  {
    q: "What is the number-one cause of falls in older adults?",
    a: "Multi-factor, but the top three drivers are muscle weakness (especially in the legs), medication side effects (dizziness, blood pressure drops), and environmental hazards — rugs, poor lighting, and clutter. Most falls happen at home, in familiar surroundings, in the daytime.",
  },
  {
    q: "Are grab bars enough?",
    a: "They help — but only in the bathroom, and only if properly anchored into studs, not drywall. A full fall-prevention plan combines grab bars, lighting, footwear, exercise (especially balance work), a medication review, and vision correction.",
  },
  {
    q: "Should we get rid of all rugs?",
    a: "Loose throw rugs are one of the highest-risk items in a home — yes, remove them. Larger rugs can stay if they're secured with non-slip pads or tape. Keep in mind: many older adults resist this change; framing it as 'keeps the rug from bunching up' works better than 'you might fall'.",
  },
  {
    q: "When should we consider a medical alert system?",
    a: "As soon as an older adult lives alone and has any fall risk — a history of falls, mobility issues, or a chronic condition. Modern systems include fall detection that calls for help automatically, so the person doesn't have to press a button while injured.",
  },
];

export const Route = createFileRoute("/resources/fall-prevention-seniors")({
  head: () =>
    articleHead({ path, title, description, datePublished, section: category, faq }),
  component: ArticlePage,
});

function ArticlePage() {
  return (
    <PageShell>
      <PageHero eyebrow={category} title={title} lead={description} />
      <ArticleBody>
        <ArticleMeta category={category} datePublished={datePublished} readMins={8} />

        <ArticleTLDR
          points={[
            "1 in 4 older adults falls each year; most falls happen at home.",
            "The highest-ROI fixes: bathroom grab bars, lighting, secured rugs, and clear paths.",
            "Medication review and balance exercises matter as much as the physical home.",
            "A single fall doubles the risk of another within a year — act before that first one.",
          ]}
        />

        <p>
          Falls are the leading cause of both fatal and non-fatal injuries among older
          adults — and they're one of the most preventable. Roughly two-thirds of the
          risk can be reduced by a small, boring list of home changes. Here's the
          walkthrough, room by room.
        </p>

        <KeyStats
          items={[
            { stat: "36M", label: "US adults 65+ who fall each year" },
            { stat: "$50B", label: "Annual US medical cost of older-adult falls" },
            { stat: "2×", label: "Increase in risk after a single fall" },
          ]}
        />

        <h2>Bathroom</h2>
        <p>The single highest-risk room. Slippery, hard surfaces, and awkward transitions.</p>
        <ul>
          <li>Install <strong>grab bars</strong> anchored into studs — inside the shower/tub, next to the toilet.</li>
          <li>Non-slip mat inside the tub; textured decal strips if a mat won't sit flat.</li>
          <li>A <strong>shower chair or bench</strong> for anyone who feels unsteady standing.</li>
          <li>Raised toilet seat with side arms if getting up is hard.</li>
          <li>Motion-activated night light between bed and bathroom.</li>
        </ul>

        <h2>Bedroom</h2>
        <ul>
          <li>Clear path from bed to bathroom — no cords, no shoes, no laundry piles.</li>
          <li>Bed height at or slightly above knee height — thighs parallel to floor when seated on edge.</li>
          <li>Bedside lamp reachable without getting up; a second motion light on the floor.</li>
          <li>Phone or medical-alert pendant within arm's reach.</li>
        </ul>

        <h2>Living room and hallways</h2>
        <ul>
          <li>Remove <strong>loose throw rugs</strong> or secure with non-slip pads.</li>
          <li>Route power cords along walls, not across paths.</li>
          <li>Rearrange furniture so there's a clear 36-inch path through every room.</li>
          <li>Increase bulb wattage; add lamps to dim corners. Older eyes need 2–3× more light.</li>
        </ul>

        <h2>Kitchen</h2>
        <ul>
          <li>Move daily-use items to <strong>waist-to-shoulder height</strong>. No stepping on chairs.</li>
          <li>Non-slip mat in front of the sink.</li>
          <li>Bright under-cabinet lighting — one of the highest-ROI upgrades.</li>
          <li>A sturdy step stool with a handle for the rare high-shelf reach.</li>
        </ul>

        <h2>Stairs and entryways</h2>
        <ul>
          <li>Handrails on <strong>both</strong> sides, running the full length.</li>
          <li>Contrast-color tape on the top and bottom step — depth perception drops with age.</li>
          <li>Motion-activated lighting at every entry.</li>
          <li>A bench inside the door for putting shoes on sitting down.</li>
        </ul>

        <h2>Beyond the home: the medical side</h2>
        <ol>
          <li><strong>Medication review.</strong> Ask a pharmacist to flag drugs that cause dizziness, drowsiness, or blood-pressure drops. This is free and takes 20 minutes.</li>
          <li><strong>Vision check every year.</strong> Update prescriptions; treat cataracts.</li>
          <li><strong>Vitamin D.</strong> Low D is linked to muscle weakness; ask the primary-care doctor.</li>
          <li><strong>Balance exercise.</strong> Tai chi and specific balance programs cut fall risk 30–50%.</li>
          <li><strong>Proper footwear.</strong> Firm sole, back, low heel. No slippers with smooth soles or bare feet.</li>
        </ol>

        <p>
          A caregiver doing weekly visits can spot new hazards before you can —{" "}
          <Link to="/services/companionship">that's a big part of what companion care is for</Link>.
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
              to: "/resources/signs-parent-needs-help",
              title: "Signs Your Parent Needs Help at Home",
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
