import { createFileRoute, Link } from "@tanstack/react-router";
import { Eye, ShieldCheck, MessageCircle, Wallet, Check } from "lucide-react";
import { PageShell, PageHero, CTASection, marketingHead } from "@/components/marketing/PageShell";

export const Route = createFileRoute("/for-families")({
  head: () =>
    marketingHead({
      path: "/for-families",
      title: "For Families — Coordinate verified care for a parent from anywhere",
      description:
        "CompanionCare gives adult children a shared view of a parent's care: verified helpers, live visit check-ins, budget transparency, and messaging routed through the platform — with the senior's consent.",
      jsonLd: {
        "@context": "https://schema.org",
        "@type": "WebPage",
        name: "CompanionCare for families",
        description:
          "How adult children coordinate verified in-home care for an aging parent using CompanionCare.",
      },
    }),
  component: ForFamiliesPage,
});

const features = [
  { icon: Eye, title: "See the visit, not just the invoice", body: "Live check-ins, visit notes, and (with senior consent) photos — so you don't have to wonder if Tuesday's visit happened." },
  { icon: ShieldCheck, title: "Trust that doesn't decay", body: "Every helper is re-verified every 30 days. New charges or license changes surface within days." },
  { icon: MessageCircle, title: "On-platform messaging", body: "Coordinate through CompanionCare, never through a caregiver's personal phone. The senior stays in control of who sees what." },
  { icon: Wallet, title: "Budget transparency", body: "Family and senior see the same numbers. No hidden fees, no surprise bills, no 'call for pricing.'" },
];

function ForFamiliesPage() {
  return (
    <PageShell>
      <PageHero
        eyebrow="For families"
        title="Is Mom okay? Answered in 3 seconds."
        lead="CompanionCare gives adult children a shared, reassurance-first view of a parent's care — with the senior always in control of what family can see and do."
      >
        <div className="flex flex-wrap gap-3">
          <Link
            to="/auth"
            search={{ mode: "signup" }}
            className="inline-flex items-center rounded-full bg-primary px-6 py-3 text-base font-semibold text-primary-foreground"
          >
            Set up a family account
          </Link>
          <Link
            to="/family"
            className="inline-flex items-center rounded-full border-2 border-primary bg-card px-6 py-3 text-base font-semibold text-primary"
          >
            Sign in to family portal
          </Link>
        </div>
      </PageHero>

      <section className="mx-auto max-w-5xl px-5 py-16 lg:px-10">
        <ul className="grid gap-5 md:grid-cols-2">
          {features.map((f) => (
            <li key={f.title} className="surface-card p-7">
              <f.icon className="size-7 text-primary" aria-hidden />
              <h2 className="mt-3 text-2xl font-semibold">{f.title}</h2>
              <p className="mt-2 text-lg text-muted-foreground">{f.body}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="border-y border-border bg-secondary/40">
        <div className="mx-auto max-w-4xl px-5 py-16 lg:px-10">
          <h2 className="font-serif text-3xl tracking-tight">The senior always approves.</h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Family members propose. Seniors decide. CompanionCare never lets a family member
            book a visit, change a caregiver, or view messages without the senior's
            explicit approval — every single time.
          </p>
          <ul className="mt-6 space-y-2">
            {[
              "View-only, propose changes, or full financial access — the senior picks",
              "Consent can be revoked in one tap, anytime",
              "Every family action is logged and visible to the senior",
              "No 'shadow bookings' or hidden edits, ever",
            ].map((i) => (
              <li key={i} className="flex items-start gap-2 text-lg">
                <Check className="mt-1 size-5 shrink-0 text-primary" /> {i}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <CTASection title="Ready to bring the family into care?" />
    </PageShell>
  );
}
