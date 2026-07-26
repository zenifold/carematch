import { createFileRoute, Link } from "@tanstack/react-router";
import {
  HandHeart,
  BadgeCheck,
  Building2,
  ShieldCheck,
  Check,
  Heart,
  Moon,
  Users,
  Sparkles,
} from "lucide-react";
import { PageShell, PageHero, CTASection, marketingHead, SITE_URL } from "@/components/marketing/PageShell";

const tasks = [
  { icon: Heart, name: "Bathing, dressing, and grooming", body: "Warm, unhurried help with the daily routines that keep dignity and comfort intact." },
  { icon: HandHeart, name: "Toileting and incontinence care", body: "Discreet, respectful assistance from aides trained specifically for elder care." },
  { icon: Users, name: "Transfers and mobility support", body: "Safe help moving between bed, chair, walker, and shower — with fall-prevention as a priority." },
  { icon: Sparkles, name: "Feeding and meal assistance", body: "Meals prepared, portioned, and enjoyed together — including modified diets and swallowing precautions." },
  { icon: Moon, name: "Overnight and 24-hour coverage", body: "A steady presence through the night for peace of mind — including dementia-informed overnights." },
  { icon: Building2, name: "Dementia-informed personal care", body: "Aides trained in redirection, routine, and calm communication for loved ones living with dementia." },
];

const whyPartners = [
  { icon: BadgeCheck, title: "State-licensed home care agencies", body: "We only match you with agencies verified against the state licensing board — nothing off-the-books." },
  { icon: ShieldCheck, title: "Professional liability & workers' comp", body: "Every partner agency carries active malpractice and workers' compensation insurance. You're never the employer." },
  { icon: HandHeart, title: "Certified CNAs and HHAs", body: "Every aide's certification is checked against the state nurse aide registry — and re-checked every 30 days." },
  { icon: Building2, title: "RN clinical oversight", body: "A Registered Nurse from the partner agency oversees the care plan and steps in when the situation changes." },
];

const scenarios = [
  {
    title: "Recovering from a hip replacement",
    body: "Daily help with bathing, dressing, and safe transfers for the first six weeks — so healing happens at home, not in a rehab facility.",
  },
  {
    title: "A parent living with dementia",
    body: "Consistent aides who follow the same gentle routines, so mornings stay calm and familiar even when memory fades.",
  },
  {
    title: "A tired family caregiver",
    body: "An aide who takes the personal care shift so a spouse or adult child can rest, work, or simply breathe.",
  },
];

const faqs = [
  {
    q: "Who employs the caregiver — CareMatch or the agency?",
    a: "The caregiver is an employee of the licensed home care agency, not CareMatch. That agency holds the state license, carries the insurance, and provides clinical supervision. CareMatch is the technology and concierge layer that makes the whole experience feel like one.",
  },
  {
    q: "Can I keep the same aide over time?",
    a: "Yes — consistency is one of the most important things we ask our partner agencies to protect. We work with them to keep the primary aide the same, and to introduce a familiar backup for time-off coverage.",
  },
  {
    q: "How is this different from calling an agency directly?",
    a: "You get one dashboard for all care in your home, transparent pricing before you commit, and a concierge who compares partner agencies for you. You also keep the same CareMatch phone number and family app whether it's a Tuesday cleaning or a Sunday overnight.",
  },
  {
    q: "Does insurance cover any of this?",
    a: "Personal care is generally private pay, though long-term care insurance and some Medicaid waivers cover part or all of it depending on your state. Our concierge will help you check what's eligible in your area.",
  },
  {
    q: "What if we need to change the plan?",
    a: "Call us — we'll adjust hours, aides, or scope with the partner agency. Care needs change, and the plan should change with them.",
  },
];

export const Route = createFileRoute("/services/partners")({
  head: () =>
    marketingHead({
      path: "/services/partners",
      title: "CareMatch Partners — Personal care from licensed home care agencies",
      description:
        "Personal care — bathing, dressing, transfers, dementia-informed care, and overnights — delivered by licensed home care agencies partnered with CareMatch. One dashboard, one phone number, real oversight.",
      jsonLd: [
        {
          "@context": "https://schema.org",
          "@type": "Service",
          name: "CareMatch Partners",
          serviceType: "Non-medical personal care coordination",
          areaServed: { "@type": "Country", name: "United States" },
          provider: { "@type": "Organization", name: "CareMatch", url: SITE_URL },
          url: `${SITE_URL}/services/partners`,
          description:
            "Personal care — bathing, dressing, transfers, feeding, dementia-informed and overnight care — delivered by state-licensed home care agencies partnered with CareMatch.",
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
      ],
    }),
  component: PartnersPage,
});

function PartnersPage() {
  return (
    <PageShell>
      <PageHero
        eyebrow="CareMatch Partners"
        title="Hands-on personal care, delivered by licensed local agencies."
        lead="When care means bathing, dressing, transfers, or overnight help, we match you with a licensed home care agency in your state — and stay on the line to make sure it feels right."
      >
        <div className="flex flex-col gap-3 sm:flex-row">
          <Link
            to="/auth"
            search={{ mode: "signup" }}
            className="inline-flex items-center justify-center rounded-full bg-primary px-6 py-3 text-base font-semibold text-primary-foreground shadow-soft hover:bg-primary/90"
          >
            Request personal care
          </Link>
          <Link
            to="/contact"
            className="inline-flex items-center justify-center rounded-full border-2 border-primary bg-card px-6 py-3 text-base font-semibold text-primary hover:bg-secondary"
          >
            Talk to a concierge
          </Link>
        </div>
      </PageHero>

      {/* What partners provide */}
      <section className="mx-auto max-w-6xl px-5 py-16 lg:px-10">
        <h2 className="font-serif text-3xl sm:text-4xl">What partner care looks like</h2>
        <p className="mt-3 max-w-3xl text-lg text-muted-foreground">
          Certified aides (CNAs and HHAs) who arrive on time, follow a shared care plan, and treat your loved one with the patience they deserve.
        </p>
        <ul className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {tasks.map((t) => (
            <li key={t.name} className="surface-card p-6">
              <span className="grid size-12 place-items-center rounded-2xl bg-primary/10 text-primary">
                <t.icon className="size-6" aria-hidden />
              </span>
              <h3 className="mt-4 text-xl font-semibold">{t.name}</h3>
              <p className="mt-2 text-base text-muted-foreground">{t.body}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* Why partners */}
      <section className="border-y border-border bg-warm-cream">
        <div className="mx-auto max-w-6xl px-5 py-16 lg:px-10">
          <h2 className="font-serif text-3xl sm:text-4xl">The oversight behind every visit</h2>
          <p className="mt-3 max-w-3xl text-lg text-muted-foreground">
            Personal care is intimate work. We only match you with agencies that meet a high bar — and we re-check that bar every month.
          </p>
          <ul className="mt-8 grid gap-4 md:grid-cols-2">
            {whyPartners.map((c) => (
              <li key={c.title} className="surface-card p-6">
                <span className="grid size-12 place-items-center rounded-2xl bg-primary/10 text-primary">
                  <c.icon className="size-6" aria-hidden />
                </span>
                <h3 className="mt-4 text-xl font-semibold">{c.title}</h3>
                <p className="mt-2 text-base text-muted-foreground">{c.body}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Scenarios */}
      <section className="mx-auto max-w-6xl px-5 py-16 lg:px-10">
        <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-semibold text-primary">
          <Sparkles className="size-4" /> When partners are the right fit
        </span>
        <h2 className="mt-4 font-serif text-3xl sm:text-4xl">The right care at the right moment</h2>
        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {scenarios.map((s) => (
            <div key={s.title} className="surface-card p-6">
              <h3 className="text-xl font-semibold">{s.title}</h3>
              <p className="mt-3 text-base text-muted-foreground">{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* One roof */}
      <section className="border-y border-border bg-secondary/40">
        <div className="mx-auto max-w-6xl px-5 py-16 lg:px-10">
          <div className="grid gap-10 lg:grid-cols-2">
            <div>
              <h2 className="font-serif text-3xl sm:text-4xl">One dashboard for the whole home</h2>
              <p className="mt-4 text-lg text-muted-foreground">
                Keep the marketplace helper who does Tuesday errands. Add a licensed aide for morning routines. Bring in a nurse when it's time. Everything lives in one place — for you, for your family, and for the older adult who's finally in charge again.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link to="/services/marketplace" className="inline-flex items-center gap-1 text-base font-semibold text-primary hover:underline">
                  Marketplace helpers →
                </Link>
                <Link to="/services/healthcare" className="inline-flex items-center gap-1 text-base font-semibold text-primary hover:underline">
                  Healthcare referrals →
                </Link>
              </div>
            </div>
            <ul className="grid gap-3">
              {[
                "Licensed agencies, verified monthly",
                "CNA/HHA aides, checked against the state registry",
                "RN supervision built into every care plan",
                "One shared family dashboard for visits and notes",
                "24/7 phone concierge for schedule or plan changes",
                "Private pay, long-term care insurance, and Medicaid waivers where eligible",
              ].map((point) => (
                <li key={point} className="flex items-start gap-3 rounded-2xl bg-card p-4 border border-border">
                  <Check className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden />
                  <span className="text-base">{point}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-4xl px-5 py-16 lg:px-10">
        <h2 className="font-serif text-3xl sm:text-4xl">Common questions about partner care</h2>
        <dl className="mt-8 space-y-4">
          {faqs.map((f) => (
            <div key={f.q} className="surface-card p-6">
              <dt className="text-lg font-semibold">{f.q}</dt>
              <dd className="mt-2 text-base text-muted-foreground">{f.a}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* Availability note */}
      <section className="mx-auto max-w-4xl px-5 py-4 lg:px-10">
        <div className="surface-card p-6 text-sm text-muted-foreground">
          <p>
            <span className="font-semibold text-foreground">Availability varies by state.</span> Partner agency coverage
            depends on local licensing and network density.{" "}
            <Link to="/legal/state-availability" className="font-medium text-primary hover:underline">Check your state</Link>{" "}
            or <Link to="/contact" className="font-medium text-primary hover:underline">talk to a concierge</Link> to see
            what's available in your area.
          </p>
        </div>
      </section>

      <CTASection
        title="Ready to arrange personal care?"
        lead="Tell us where you are and what would help most. We'll match you with a licensed partner agency and stay involved from the first visit onward."
      />
    </PageShell>
  );
}
