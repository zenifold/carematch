import { Link } from "@tanstack/react-router";
import { Check, ShieldCheck, Phone } from "lucide-react";
import { PageShell, PageHero, CTASection, PHONE, PHONE_HREF } from "./PageShell";
import type { ReactNode } from "react";

export type ServiceDetailProps = {
  eyebrow?: string;
  title: string;
  lead: string;
  intro: ReactNode;
  includes: string[];
  whoItsFor: string[];
  verificationTier: string;
  faqs: { q: string; a: string }[];
};

export function ServiceDetail(p: ServiceDetailProps) {
  return (
    <PageShell>
      <PageHero eyebrow={p.eyebrow ?? "Services"} title={p.title} lead={p.lead}>
        <div className="flex flex-wrap gap-3">
          <Link
            to="/auth"
            search={{ mode: "signup" }}
            className="inline-flex items-center rounded-full bg-primary px-6 py-3 text-base font-semibold text-primary-foreground"
          >
            Start with this service
          </Link>
          <a
            href={PHONE_HREF}
            className="inline-flex items-center gap-2 rounded-full border-2 border-primary bg-card px-6 py-3 text-base font-semibold text-primary"
          >
            <Phone className="size-5" /> Call {PHONE}
          </a>
        </div>
      </PageHero>

      <section className="mx-auto max-w-4xl px-5 py-14 lg:px-10">
        <div className="prose prose-lg max-w-none">{p.intro}</div>
      </section>

      <section className="border-y border-border bg-secondary/40">
        <div className="mx-auto max-w-5xl px-5 py-14 lg:px-10">
          <div className="grid gap-8 md:grid-cols-2">
            <div>
              <h2 className="font-serif text-2xl tracking-tight">What's included</h2>
              <ul className="mt-4 space-y-2">
                {p.includes.map((i) => (
                  <li key={i} className="flex items-start gap-2 text-lg">
                    <Check className="mt-1 size-5 shrink-0 text-primary" /> <span>{i}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h2 className="font-serif text-2xl tracking-tight">Who it's for</h2>
              <ul className="mt-4 space-y-2">
                {p.whoItsFor.map((i) => (
                  <li key={i} className="flex items-start gap-2 text-lg">
                    <Check className="mt-1 size-5 shrink-0 text-primary" /> <span>{i}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-8 surface-card flex items-start gap-3 p-6">
            <ShieldCheck className="mt-1 size-6 text-primary" aria-hidden />
            <div>
              <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Verification
              </p>
              <p className="mt-1 text-base">{p.verificationTier}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-5 py-14 lg:px-10">
        <h2 className="font-serif text-3xl tracking-tight">Common questions</h2>
        <div className="mt-6 space-y-4">
          {p.faqs.map((f) => (
            <details key={f.q} className="surface-card p-5 [&_summary::-webkit-details-marker]:hidden">
              <summary className="cursor-pointer text-xl font-semibold">{f.q}</summary>
              <p className="mt-3 text-lg text-muted-foreground">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      <CTASection />
    </PageShell>
  );
}

export function serviceJsonLd({
  name,
  path,
  description,
  faqs,
}: {
  name: string;
  path: string;
  description: string;
  faqs: { q: string; a: string }[];
}) {
  return [
    {
      "@context": "https://schema.org",
      "@type": "Service",
      name,
      serviceType: name,
      provider: { "@type": "Organization", name: "CompanionCare" },
      areaServed: { "@type": "Country", name: "United States" },
      description,
      url: `https://getcompanioncare.com${path}`,
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faqs.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a },
      })),
    },
  ];
}
