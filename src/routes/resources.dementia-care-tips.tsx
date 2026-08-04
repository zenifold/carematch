import { createFileRoute, Link } from "@tanstack/react-router";
import { PageShell, PageHero, CTASection, marketingHead, SITE_URL } from "@/components/marketing/PageShell";

const title = "10 Small Changes That Make Dementia Care at Home Easier";
const description =
  "Ten small, high-impact changes for dementia care at home: lighting, routine, language, and environment tweaks that reduce agitation and support daily function.";
const path = "/resources/dementia-care-tips";
const datePublished = "2026-04-27";

export const Route = createFileRoute("/resources/dementia-care-tips")({
  head: () =>
    marketingHead({
      path,
      title: `${title} — CompanionCare`,
      description,
      ogType: "article",
      extraMeta: [
        { property: "article:published_time", content: datePublished },
        { property: "article:section", content: "Dementia" },
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
      <PageHero eyebrow="Dementia" title={title} lead={description} />

      <article className="mx-auto max-w-3xl px-5 py-14 lg:px-10">
        <div className="prose prose-lg max-w-none">
          <p>
            None of these are cures. All of them are things families and geriatric care
            managers repeatedly report as high-value, low-effort improvements.
          </p>

          <ol>
            <li><strong>Increase daytime light.</strong> Open blinds early; add lamps. Bright mornings anchor the circadian rhythm and reduce sundowning.</li>
            <li><strong>Keep a predictable routine.</strong> Meals, walks, and rest at consistent times reduce anxiety and confusion.</li>
            <li><strong>Simplify the environment.</strong> Fewer objects on counters. Clear paths. Label drawers with words or pictures.</li>
            <li><strong>One instruction at a time.</strong> Break tasks into single steps. Wait for a response before the next.</li>
            <li><strong>Meet them where they are.</strong> Don't correct false memories. Redirect gently.</li>
            <li><strong>Reduce ambient noise.</strong> Turn off the TV during meals and conversations.</li>
            <li><strong>Use contrasting colors on the plate.</strong> White food on a white plate disappears. A colored plate helps.</li>
            <li><strong>Comfort clothing.</strong> Elastic waists, slip-on shoes, no small buttons.</li>
            <li><strong>Music that matters.</strong> Music from their teens and twenties reliably calms and re-engages.</li>
            <li><strong>Add a consistent helper.</strong> A familiar face visiting on a regular schedule reduces agitation more than almost any intervention.</li>
          </ol>

          <p>
            <Link to="/services/personal-care" className="text-primary font-semibold">
              Explore dementia-aware personal care →
            </Link>
          </p>
        </div>
      </article>

      <CTASection />
    </PageShell>
  );
}
