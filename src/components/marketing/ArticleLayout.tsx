import { Link } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import { Sparkles, ChevronDown, ArrowRight } from "lucide-react";
import { marketingHead, SITE_URL } from "./PageShell";

/** Article "TL;DR" summary — helps Google + AI answer engines quote you. */
export function ArticleTLDR({
  points,
  title = "The short answer",
}: {
  points: string[];
  title?: string;
}) {
  return (
    <aside
      aria-label={title}
      className="not-prose my-8 rounded-3xl border border-primary/20 bg-primary/5 p-6 md:p-7"
    >
      <div className="mb-3 flex items-center gap-2">
        <Sparkles className="size-4 text-primary" aria-hidden />
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">
          {title}
        </p>
      </div>
      <ul className="space-y-2">
        {points.map((p) => (
          <li key={p} className="flex gap-2 text-base leading-relaxed">
            <span className="mt-2 size-1.5 shrink-0 rounded-full bg-primary" />
            <span>{p}</span>
          </li>
        ))}
      </ul>
    </aside>
  );
}

/** Key stat / callout box for scannable numbers — loved by AI answer engines. */
export function KeyStats({ items }: { items: { stat: string; label: string }[] }) {
  return (
    <div className="not-prose my-8 grid gap-4 rounded-3xl border border-border bg-secondary/30 p-6 md:grid-cols-3 md:p-8">
      {items.map((i) => (
        <div key={i.label}>
          <p className="font-serif text-3xl text-primary md:text-4xl">{i.stat}</p>
          <p className="mt-1 text-sm text-muted-foreground">{i.label}</p>
        </div>
      ))}
    </div>
  );
}

export type FAQItem = { q: string; a: string };

export function ArticleFAQ({ items }: { items: FAQItem[] }) {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section
      aria-label="Frequently asked questions"
      className="not-prose my-10 border-t border-border pt-10"
    >
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary/70">
        FAQ
      </p>
      <h2 className="mt-2 font-serif text-3xl tracking-tight">
        Frequently asked questions
      </h2>
      <ul className="mt-6 divide-y divide-border border-y border-border">
        {items.map((f, i) => {
          const active = open === i;
          return (
            <li key={f.q}>
              <button
                onClick={() => setOpen(active ? null : i)}
                aria-expanded={active}
                className="flex w-full items-start justify-between gap-6 py-5 text-left"
              >
                <span className="font-serif text-lg md:text-xl">{f.q}</span>
                <ChevronDown
                  className={`mt-1.5 size-5 shrink-0 text-primary transition-transform ${
                    active ? "rotate-180" : ""
                  }`}
                />
              </button>
              <div
                className={`grid overflow-hidden transition-[grid-template-rows] duration-300 ${
                  active ? "grid-rows-[1fr] pb-5" : "grid-rows-[0fr]"
                }`}
              >
                <div className="min-h-0">
                  <p className="max-w-3xl text-base leading-relaxed text-muted-foreground">
                    {f.a}
                  </p>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export type RelatedPost = {
  to: string;
  title: string;
  category: string;
  readMins: number;
};

export function RelatedPosts({ items }: { items: RelatedPost[] }) {
  if (!items.length) return null;
  return (
    <section
      aria-label="Related reading"
      className="not-prose my-10 border-t border-border pt-10"
    >
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary/70">
        Keep reading
      </p>
      <h2 className="mt-2 font-serif text-3xl tracking-tight">Related guides</h2>
      <ul className="mt-6 grid gap-4 md:grid-cols-3">
        {items.map((r) => (
          <li key={r.to}>
            <Link
              to={r.to}
              className="group flex h-full flex-col justify-between rounded-2xl border border-border bg-card p-5 transition-colors hover:border-primary/40 hover:bg-secondary/40"
            >
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-primary">
                  {r.category}
                </p>
                <p className="mt-2 font-serif text-lg leading-snug">{r.title}</p>
              </div>
              <p className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary">
                {r.readMins} min read
                <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function ArticleMeta({
  category,
  datePublished,
  readMins,
}: {
  category: string;
  datePublished: string;
  readMins: number;
}) {
  const d = new Date(datePublished).toLocaleDateString(undefined, {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  return (
    <p className="not-prose mb-8 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
      <span className="rounded-full bg-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.15em] text-primary">
        {category}
      </span>
      <span>Updated {d}</span>
      <span aria-hidden>·</span>
      <span>{readMins} min read</span>
      <span aria-hidden>·</span>
      <span>Reviewed by the CompanionCare care team</span>
    </p>
  );
}

/** Builds head() output for an article route with Article + FAQPage JSON-LD. */
export function articleHead(opts: {
  path: string;
  title: string;
  description: string;
  datePublished: string;
  dateModified?: string;
  section: string;
  faq?: FAQItem[];
}) {
  const jsonLd: unknown[] = [
    {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: opts.title,
      description: opts.description,
      datePublished: opts.datePublished,
      dateModified: opts.dateModified ?? opts.datePublished,
      author: { "@type": "Organization", name: "CompanionCare" },
      publisher: {
        "@type": "Organization",
        name: "CompanionCare",
        logo: { "@type": "ImageObject", url: `${SITE_URL}/favicon.ico` },
      },
      mainEntityOfPage: `${SITE_URL}${opts.path}`,
      articleSection: opts.section,
    },
  ];
  if (opts.faq?.length) {
    jsonLd.push({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: opts.faq.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a },
      })),
    });
  }
  return marketingHead({
    path: opts.path,
    title: `${opts.title} — CompanionCare`,
    description: opts.description,
    ogType: "article",
    extraMeta: [
      { property: "article:published_time", content: opts.datePublished },
      {
        property: "article:modified_time",
        content: opts.dateModified ?? opts.datePublished,
      },
      { property: "article:section", content: opts.section },
    ],
    jsonLd,
  });
}

export function ArticleBody({ children }: { children: ReactNode }) {
  return (
    <article className="mx-auto max-w-3xl px-5 py-14 lg:px-10">
      <div className="prose prose-lg max-w-none prose-headings:font-serif prose-headings:tracking-tight prose-h2:mt-12 prose-h2:text-3xl prose-h3:text-xl prose-a:text-primary prose-a:font-semibold hover:prose-a:underline">
        {children}
      </div>
    </article>
  );
}
