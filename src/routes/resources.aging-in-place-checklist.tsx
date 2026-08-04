import { createFileRoute, Link } from "@tanstack/react-router";
import { PageShell, PageHero, CTASection, marketingHead, SITE_URL } from "@/components/marketing/PageShell";

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

          <h2>1. Every room: falls, lighting, and floor</h2>
          <ul>
            <li>Remove throw rugs or secure them with grippers.</li>
            <li>Add night lights on the path from bed to bathroom.</li>
            <li>Check that pathways are clear of cords and clutter.</li>
            <li>Confirm every room has a working smoke and CO alarm.</li>
          </ul>

          <h2>2. Bathroom: the #1 fall zone</h2>
          <ul>
            <li>Install grab bars beside the toilet and inside the shower.</li>
            <li>Add a non-slip bath mat and a shower chair if needed.</li>
            <li>Set the water heater below 120°F to prevent scalding.</li>
            <li>Keep a nightlight on 24/7.</li>
          </ul>

          <h2>3. Kitchen: safe cooking</h2>
          <ul>
            <li>Move everyday items to waist-height shelves.</li>
            <li>Add an automatic stove shutoff if there's any memory concern.</li>
            <li>Keep a fire extinguisher accessible.</li>
            <li>Check that expired food is cleared regularly.</li>
          </ul>

          <h2>4. Medications</h2>
          <ul>
            <li>Use a weekly pill organizer with alarms or reminders.</li>
            <li>Keep an updated medication list on the fridge.</li>
            <li>Schedule a pharmacist review every 12 months.</li>
          </ul>

          <h2>5. Emergency plan</h2>
          <ul>
            <li>Post emergency numbers by every phone.</li>
            <li>Set up a medical alert pendant.</li>
            <li>Add trusted neighbors to a "check-in call" list.</li>
            <li>Document advance directives and where they're kept.</li>
          </ul>

          <h2>6. Regular help before it's urgent</h2>
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
