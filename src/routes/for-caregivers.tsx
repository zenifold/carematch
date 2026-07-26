import { createFileRoute, Link } from "@tanstack/react-router";
import { DollarSign, Calendar, ShieldCheck, HeartHandshake, Check } from "lucide-react";
import { PageShell, PageHero, CTASection, marketingHead } from "@/components/marketing/PageShell";

export const Route = createFileRoute("/for-caregivers")({
  head: () =>
    marketingHead({
      path: "/for-caregivers",
      title: "For Caregivers — Join CareMatch's verified helper network",
      description:
        "Join CareMatch as a verified in-home caregiver: fair hourly pay, flexible schedule, consistent clients, and a platform that protects you as much as it protects families.",
      jsonLd: {
        "@context": "https://schema.org",
        "@type": "JobPosting",
        title: "In-home caregiver — CareMatch verified helper network",
        description:
          "Companionship, personal care, and household help roles across the U.S. Flexible hours, fair pay, and continuous re-verification that builds trust with families.",
        hiringOrganization: { "@type": "Organization", name: "CareMatch" },
        employmentType: ["PART_TIME", "FULL_TIME", "CONTRACTOR"],
        jobLocation: { "@type": "Place", address: { "@type": "PostalAddress", addressCountry: "US" } },
        baseSalary: {
          "@type": "MonetaryAmount",
          currency: "USD",
          value: { "@type": "QuantitativeValue", minValue: 18, maxValue: 34, unitText: "HOUR" },
        },
      },
    }),
  component: ForCaregiversPage,
});

const perks = [
  { icon: DollarSign, title: "Transparent pay from $18–$34/hr", body: "You see the full rate before you accept. No surprise cuts. Skilled care roles pay more." },
  { icon: Calendar, title: "You choose the schedule", body: "Set your availability, accept the shifts that fit your life, and keep the clients you love." },
  { icon: ShieldCheck, title: "Verified once, trusted everywhere", body: "Our 5-stage verification protects you too — no one can impersonate you at a client's door." },
  { icon: HeartHandshake, title: "Consistent clients, not one-offs", body: "CareMatch prioritizes long-term matches — so you build real relationships, not just book shifts." },
];

function ForCaregiversPage() {
  return (
    <PageShell>
      <PageHero
        eyebrow="For caregivers"
        title="Do the work you love. Get treated like the professional you are."
        lead="Join CareMatch's verified helper network. Fair pay, consistent clients, and a platform designed to build trust — not extract fees."
      >
        <div className="flex flex-wrap gap-3">
          <Link
            to="/auth"
            search={{ mode: "signup" }}
            className="inline-flex items-center rounded-full bg-primary px-6 py-3 text-base font-semibold text-primary-foreground"
          >
            Apply to join
          </Link>
          <Link
            to="/provider"
            className="inline-flex items-center rounded-full border-2 border-primary bg-card px-6 py-3 text-base font-semibold text-primary"
          >
            Provider sign in
          </Link>
        </div>
      </PageHero>

      <section className="mx-auto max-w-5xl px-5 py-16 lg:px-10">
        <ul className="grid gap-5 md:grid-cols-2">
          {perks.map((p) => (
            <li key={p.title} className="surface-card p-7">
              <p.icon className="size-7 text-primary" aria-hidden />
              <h2 className="mt-3 text-2xl font-semibold">{p.title}</h2>
              <p className="mt-2 text-lg text-muted-foreground">{p.body}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="border-y border-border bg-secondary/40">
        <div className="mx-auto max-w-4xl px-5 py-16 lg:px-10">
          <h2 className="font-serif text-3xl tracking-tight">How to join</h2>
          <ol className="mt-6 space-y-3">
            {[
              "Create your profile and upload your ID (takes 5 minutes).",
              "Complete verification — identity, background, and license check where applicable.",
              "Set your availability, services offered, and preferred hourly rate.",
              "Start accepting matches — CareMatch introduces you to families who fit your profile.",
            ].map((step, i) => (
              <li key={step} className="flex items-start gap-3 text-lg">
                <span className="grid size-8 shrink-0 place-items-center rounded-full bg-primary font-semibold text-primary-foreground">
                  {i + 1}
                </span>
                {step}
              </li>
            ))}
          </ol>
          <div className="mt-8 surface-card p-6">
            <h3 className="text-xl font-semibold">Who we hire</h3>
            <ul className="mt-3 space-y-2">
              {[
                "CNAs and HHAs with active state licenses",
                "Experienced companionship and homemaker helpers",
                "Drivers with insurance for errand & transport roles",
                "Nurses and skilled clinicians for our clinical partner network",
              ].map((i) => (
                <li key={i} className="flex items-start gap-2 text-base">
                  <Check className="mt-1 size-5 shrink-0 text-primary" /> {i}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <CTASection title="Ready to join the network?" lead="Apply today. Verification takes 3–5 business days once your paperwork is in." />
    </PageShell>
  );
}
