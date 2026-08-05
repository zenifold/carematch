import { createFileRoute, Link } from "@tanstack/react-router";
import { PageShell, PageHero, CTASection, marketingHead, SITE_URL } from "@/components/marketing/PageShell";
import {
  InteractiveChecklist,
  type ChecklistSection,
} from "@/components/marketing/InteractiveChecklist";

const STORAGE_KEY = "companioncare:aging-in-place-checklist";

// Section keys are part of the saved progress — renaming one silently drops a
// family's ticks for that section, so treat them as stable identifiers.
const CHECKLIST: ChecklistSection[] = [
  {
    key: "every-room",
    title: "1. Every room: falls, lighting, and floor",
    items: [
      "Remove throw rugs or secure them with grippers.",
      "Add night lights on the path from bed to bathroom.",
      "Check that pathways are clear of cords and clutter.",
      "Confirm every room has a working smoke and CO alarm.",
    ],
  },
  {
    key: "bathroom",
    title: "2. Bathroom: the #1 fall zone",
    items: [
      "Install grab bars beside the toilet and inside the shower.",
      "Add a non-slip bath mat and a shower chair if needed.",
      "Set the water heater below 120°F to prevent scalding.",
      "Keep a nightlight on 24/7.",
    ],
  },
  {
    key: "kitchen",
    title: "3. Kitchen: safe cooking",
    items: [
      "Move everyday items to waist-height shelves.",
      "Add an automatic stove shutoff if there's any memory concern.",
      "Keep a fire extinguisher accessible.",
      "Check that expired food is cleared regularly.",
    ],
  },
  {
    key: "medications",
    title: "4. Medications",
    items: [
      "Use a weekly pill organizer with alarms or reminders.",
      "Keep an updated medication list on the fridge.",
      "Schedule a pharmacist review every 12 months.",
    ],
  },
  {
    key: "emergency",
    title: "5. Emergency plan",
    items: [
      "Post emergency numbers by every phone.",
      "Set up a medical alert pendant.",
      'Add trusted neighbors to a "check-in call" list.',
      "Document advance directives and where they're kept.",
    ],
  },
];

const title = "The Aging-in-Place Checklist Every Family Should Have";
const description =
  "A practical, room-by-room aging-in-place checklist: safety, mobility, medication, and emergency planning to help an older adult stay safely at home.";
const path = "/resources/aging-in-place-checklist";
const datePublished = "2026-06-02";

export const Route = createFileRoute("/resources/aging-in-place-checklist")({
  head: () =>
    marketingHead({
      path,
      title: `${title} — CompanionCare`,
      description,
      ogType: "article",
      extraMeta: [
        { property: "article:published_time", content: datePublished },
        { property: "article:section", content: "Planning" },
      ],
      jsonLd: {
        "@context": "https://schema.org",
        "@type": "Article",
        headline: title,
        description,
        datePublished,
        author: { "@type": "Organization", name: "CompanionCare" },
        publisher: {
          "@type": "Organization",
          name: "CompanionCare",
          logo: { "@type": "ImageObject", url: `${SITE_URL}/favicon.ico` },
        },
        mainEntityOfPage: `${SITE_URL}${path}`,
      },
    }),
  component: ArticlePage,
});

function ArticlePage() {
  return (
    <PageShell>
      <PageHero eyebrow="Planning" title={title} lead={description} />

      <article className="mx-auto max-w-3xl px-5 py-14 lg:px-10">
        <div className="prose prose-lg max-w-none">
          <p>
            Most families don't build an aging-in-place plan — they react to a fall or a
            hospital discharge. This checklist flips that. Work through it once a year
            with your parent (not <em>for</em> them), and you'll catch the small risks
            before they become emergencies.
          </p>

          <InteractiveChecklist storageKey={STORAGE_KEY} sections={CHECKLIST} />

          <h2>Regular help before it's urgent</h2>
          <p>
            The single strongest predictor of successful aging in place is a regular,
            verified helper visiting the home. Not because your parent can't do it alone
            — but because a familiar visitor catches the small changes (a bruise, a
            missed meal, a mood shift) that families miss over a Sunday phone call.
          </p>
          <p>
            <Link to="/services/companionship" className="text-primary font-semibold">
              Explore companionship care →
            </Link>
          </p>
        </div>
      </article>

      <CTASection />
    </PageShell>
  );
}
