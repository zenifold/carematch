import { createFileRoute, Link } from "@tanstack/react-router";
import { PageShell, PageHero, CTASection, marketingHead, SITE_URL } from "@/components/marketing/PageShell";

const title = "How to Choose an In-Home Caregiver (Without Losing Sleep)";
const description =
  "How to choose a trustworthy in-home caregiver for a parent: the seven questions to ask, the red flags to walk away from, and how to spot real verification.";
const path = "/resources/how-to-choose-a-caregiver";
const datePublished = "2026-05-18";

export const Route = createFileRoute("/resources/how-to-choose-a-caregiver")({
  head: () =>
    marketingHead({
      path,
      title: `${title} — CareMatch`,
      description,
      ogType: "article",
      extraMeta: [
        { property: "article:published_time", content: datePublished },
        { property: "article:section", content: "Guides" },
      ],
      jsonLd: {
        "@context": "https://schema.org",
        "@type": "Article",
        headline: title,
        description,
        datePublished,
        author: { "@type": "Organization", name: "CareMatch" },
        publisher: {
          "@type": "Organization",
          name: "CareMatch",
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
      <PageHero eyebrow="Guides" title={title} lead={description} />

      <article className="mx-auto max-w-3xl px-5 py-14 lg:px-10">
        <div className="prose prose-lg max-w-none">
          <p>
            Hiring an in-home caregiver is one of the most consequential decisions a
            family makes. Here's a compact framework that cuts through the marketing.
          </p>

          <h2>The seven questions to ask every candidate or agency</h2>
          <ol>
            <li><strong>What does verification actually cover?</strong> A "background check" can mean anything from one county to full national + registry. Ask.</li>
            <li><strong>How often is it re-checked?</strong> Once at hire isn't enough. Look for monthly re-verification.</li>
            <li><strong>How is identity confirmed at the door?</strong> Live selfie + GPS at every visit is the modern standard.</li>
            <li><strong>Who is on the hook if something goes wrong?</strong> Get insurance details in writing.</li>
            <li><strong>Can we keep the same helper every visit?</strong> Rotating strangers is a red flag.</li>
            <li><strong>What's the cancellation policy?</strong> 4-hour, fee-free cancellation is reasonable.</li>
            <li><strong>Can I speak to a human at 3 a.m.?</strong> 24/7 phone support is non-negotiable.</li>
          </ol>

          <h2>Red flags to walk away from</h2>
          <ul>
            <li>Vague answers about background checks.</li>
            <li>Pressure to sign a long-term contract.</li>
            <li>No insurance, or unclear insurance coverage.</li>
            <li>Payments off-platform, in cash, or via personal apps.</li>
            <li>No way to see who's actually assigned to each visit.</li>
          </ul>

          <h2>Real verification vs. marketing verification</h2>
          <p>
            Any service can put "vetted" on a badge. Real verification is <em>continuous</em>:
            checked at hire, re-checked every 30 days, and confirmed at the door of every
            visit with a live identity match. Anything less is marketing.
          </p>
          <p>
            <Link to="/trust" className="text-primary font-semibold">
              See CareMatch's 5-stage verification →
            </Link>
          </p>
        </div>
      </article>

      <CTASection />
    </PageShell>
  );
}
