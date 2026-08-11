import { createFileRoute } from "@tanstack/react-router";
import { Heart, ShieldCheck, Users, Sparkles } from "lucide-react";
import { PageShell, PageHero, CTASection, marketingHead, SITE_URL } from "@/components/marketing/PageShell";

export const Route = createFileRoute("/about")({
  head: () =>
    marketingHead({
      path: "/about",
      title: "About CompanionCare — Trust-first in-home care for older adults",
      description:
        "CompanionCare is a trust-first marketplace where older adults find verified in-home help — companionship, personal care, housekeeping, errands — with family looped in on their terms.",
      jsonLd: {
        "@context": "https://schema.org",
        "@type": "Organization",
        name: "CompanionCare",
        url: SITE_URL,
        description:
          "CompanionCare matches older adults and their families with verified in-home helpers for companionship, personal care, housekeeping, and errands.",
        areaServed: { "@type": "Country", name: "United States" },
        contactPoint: {
          "@type": "ContactPoint",
          email: "support@getcompanioncare.com",
          contactType: "customer support",
          availableLanguage: ["English", "Spanish"],
        },
      },
    }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <PageShell>
      <PageHero
        eyebrow="About"
        title="Care built on trust, verified visit by visit."
        lead="CompanionCare was founded on a simple idea: families should never have to guess whether the person walking through their parent's door is who they said they'd be."
      />

      <section className="mx-auto max-w-4xl px-5 py-16 lg:px-10">
        <div className="prose prose-lg max-w-none">
          <h2 className="font-serif text-3xl tracking-tight">Our mission</h2>
          <p className="mt-3 text-lg text-muted-foreground">
            To make verified, dignified in-home care accessible to every older adult who
            wants to age at home. That means transparent pricing, real verification on
            every visit, and support threads answered by real people.
          </p>

          <h2 className="mt-12 font-serif text-3xl tracking-tight">What we believe</h2>
          <ul className="mt-6 grid gap-4 md:grid-cols-2">
            {[
              { icon: ShieldCheck, title: "Trust, shown not promised", body: "Every helper is re-checked continuously — at hire, monthly, and again at every visit." },
              { icon: Heart, title: "The older adult is in charge", body: "Family can suggest and support, but the senior always has the final say." },
              { icon: Users, title: "A real person reads every message", body: "Support is a tracked thread with the same small team, not a queue of strangers — and we reply within one business day." },
              { icon: Sparkles, title: "Clear prices, honest plans", body: "You see real hourly rates and weekly totals up front. If your budget doesn't cover what you'd like, we'll say so kindly." },
            ].map((v) => (
              <li key={v.title} className="surface-card p-6">
                <v.icon className="size-7 text-primary" aria-hidden />
                <h3 className="mt-3 text-xl font-semibold">{v.title}</h3>
                <p className="mt-2 text-base text-muted-foreground">{v.body}</p>
              </li>
            ))}
          </ul>

          <h2 className="mt-12 font-serif text-3xl tracking-tight">Where we are today</h2>
          <p className="mt-3 text-lg text-muted-foreground">
            CompanionCare is a new marketplace — we're just opening the doors. So instead of
            borrowed statistics, here is what is true today, and what we commit to before
            anyone books a visit.
          </p>
          <dl className="mt-6 grid gap-4 sm:grid-cols-3">
            {[
              { k: "5-stage", v: "verification, refreshed monthly, before any visit" },
              { k: "By the hour", v: "no long contracts, no hidden fees" },
              { k: "Phone-first", v: "a real person answers, 24 hours a day" },
            ].map((s) => (
              <div key={s.v} className="surface-card p-6 text-center">
                <p className="font-serif text-3xl text-primary">{s.k}</p>
                <p className="mt-2 text-base text-muted-foreground">{s.v}</p>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <CTASection />
    </PageShell>
  );
}
