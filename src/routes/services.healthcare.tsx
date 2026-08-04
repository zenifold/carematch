import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Stethoscope,
  Activity,
  Bandage,
  Brain,
  Building2,
  Check,
  Phone,
  MessageCircle,
  ClipboardList,
  Sparkles,
} from "lucide-react";
import { PageShell, PageHero, CTASection, marketingHead, PHONE, PHONE_HREF, SITE_URL } from "@/components/marketing/PageShell";

const services = [
  { icon: Stethoscope, name: "Skilled nursing visits", blurb: "RN and LPN visits ordered by a physician — assessments, injections, medication management, and clinical check-ins." },
  { icon: Bandage, name: "Wound care", blurb: "Dressing changes, wound assessment, and infection monitoring by trained nurses in the comfort of home." },
  { icon: Activity, name: "Physical therapy", blurb: "In-home PT sessions to rebuild strength, balance, and confidence after surgery, a fall, or a long illness." },
  { icon: Brain, name: "Occupational & speech therapy", blurb: "OT to reclaim daily activities. Speech therapy for language, cognition, and swallowing — right at the kitchen table." },
];

const steps = [
  { icon: Phone, title: "Tell us what's needed", body: "Call or fill in a short form. Tell us the clinical need, the ZIP code, and any hospital or physician already involved." },
  { icon: ClipboardList, title: "We prepare the introduction", body: "Our concierge picks the Medicare-certified home health agency in your area with the right specialty and availability." },
  { icon: MessageCircle, title: "The agency takes over clinical care", body: "They coordinate physician orders, staff the clinicians, and handle Medicare, Medicaid, or insurance billing directly." },
  { icon: Sparkles, title: "We stay involved with everything else", body: "Your CompanionCare dashboard still holds marketplace helpers, personal care, family messages, and the phone we always answer." },
];

const scenarios = [
  {
    title: "Home from the hospital, on the mend",
    body: "A nurse for the first few visits, a therapist to rebuild balance — and a marketplace helper for groceries and rides, all in one place.",
  },
  {
    title: "A wound that won't heal on its own",
    body: "A skilled nurse for regular dressing changes and infection watch, with a family app that shows every visit and note.",
  },
  {
    title: "A stroke recovery at home",
    body: "Physical, occupational, and speech therapy coordinated by the agency — layered with companionship and personal care from CompanionCare.",
  },
];

const faqs = [
  {
    q: "Does CompanionCare send the nurse or therapist?",
    a: "No. Skilled nursing and therapy are provided by a Medicare-certified home health agency in your area. The agency employs the clinicians, holds the licenses, and handles physician orders and billing. CompanionCare introduces you, then keeps everything else at home in one place.",
  },
  {
    q: "Will Medicare or insurance cover it?",
    a: "For most patients with a qualifying physician order, home health visits are covered by Medicare, Medicaid, or private insurance — billed directly by the agency. Our concierge will help you check what's likely covered before the first visit.",
  },
  {
    q: "How quickly can it start?",
    a: "In most metro areas, an initial nursing or therapy visit can be arranged within 24–72 hours of a physician's referral. Rural areas can take a little longer — we'll be honest about timing before you commit.",
  },
  {
    q: "What if we already have a doctor or discharge planner involved?",
    a: "Even better. Share their information when you call and our concierge will coordinate the referral directly with them, so nobody's chasing paperwork on their own.",
  },
  {
    q: "Can this be layered with a marketplace helper or personal care aide?",
    a: "Yes, and most families do exactly that. Skilled clinical visits are typically a few hours a week — a marketplace helper for errands and a personal care aide for daily routines round out the picture.",
  },
];

export const Route = createFileRoute("/services/healthcare")({
  head: () =>
    marketingHead({
      path: "/services/healthcare",
      title: "CompanionCare Healthcare — Skilled nursing and therapy at home",
      description:
        "Skilled nursing, wound care, and physical, occupational, and speech therapy at home — delivered by Medicare-certified home health agencies introduced by CompanionCare. One dashboard, one concierge, one phone number.",
      jsonLd: [
        {
          "@context": "https://schema.org",
          "@type": "Service",
          name: "CompanionCare Healthcare",
          serviceType: "Home health referral concierge",
          areaServed: { "@type": "Country", name: "United States" },
          provider: { "@type": "Organization", name: "CompanionCare", url: SITE_URL },
          url: `${SITE_URL}/services/healthcare`,
          description:
            "Concierge referrals to Medicare-certified home health agencies for skilled nursing, wound care, and physical, occupational, and speech therapy at home.",
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
  component: HealthcarePage,
});

function HealthcarePage() {
  return (
    <PageShell>
      <PageHero
        eyebrow="CompanionCare Healthcare"
        title="Skilled nursing and therapy at home — we make the introduction."
        lead="When clinical care comes home, the last thing a family needs is a scramble. CompanionCare introduces you to a Medicare-certified home health agency in your area — and keeps the rest of home life together in one place."
      >
        <div className="flex flex-col gap-3 sm:flex-row">
          <a
            href={PHONE_HREF}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-base font-semibold text-primary-foreground shadow-soft hover:bg-primary/90"
          >
            <Phone className="size-5" /> Call {PHONE}
          </a>
          <Link
            to="/contact"
            className="inline-flex items-center justify-center rounded-full border-2 border-primary bg-card px-6 py-3 text-base font-semibold text-primary hover:bg-secondary"
          >
            Request a referral
          </Link>
        </div>
      </PageHero>

      {/* Services */}
      <section className="mx-auto max-w-6xl px-5 py-16 lg:px-10">
        <h2 className="font-serif text-3xl sm:text-4xl">What healthcare partners provide</h2>
        <p className="mt-3 max-w-3xl text-lg text-muted-foreground">
          Clinical care delivered at home, by state-licensed nurses and therapists — with a physician's plan of care behind every visit.
        </p>
        <ul className="mt-8 grid gap-5 md:grid-cols-2">
          {services.map((t) => (
            <li key={t.name} className="surface-card p-6">
              <span className="grid size-12 place-items-center rounded-2xl bg-primary/10 text-primary">
                <t.icon className="size-6" aria-hidden />
              </span>
              <h3 className="mt-4 text-xl font-semibold">{t.name}</h3>
              <p className="mt-2 text-base text-muted-foreground">{t.blurb}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* How the referral works */}
      <section className="border-y border-border bg-warm-cream">
        <div className="mx-auto max-w-6xl px-5 py-16 lg:px-10">
          <h2 className="font-serif text-3xl sm:text-4xl">How a healthcare referral works</h2>
          <ol className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {steps.map((s, i) => (
              <li key={s.title} className="surface-card p-6">
                <div className="flex items-center gap-3">
                  <span className="grid size-9 place-items-center rounded-full bg-primary text-primary-foreground text-sm font-semibold">{i + 1}</span>
                  <span className="grid size-10 place-items-center rounded-2xl bg-primary/10 text-primary">
                    <s.icon className="size-5" aria-hidden />
                  </span>
                </div>
                <h3 className="mt-4 text-lg font-semibold">{s.title}</h3>
                <p className="mt-2 text-base text-muted-foreground">{s.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Scenarios */}
      <section className="mx-auto max-w-6xl px-5 py-16 lg:px-10">
        <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-semibold text-primary">
          <Sparkles className="size-4" /> When healthcare belongs at home
        </span>
        <h2 className="mt-4 font-serif text-3xl sm:text-4xl">Clinical care, layered into home life</h2>
        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {scenarios.map((s) => (
            <div key={s.title} className="surface-card p-6">
              <h3 className="text-xl font-semibold">{s.title}</h3>
              <p className="mt-3 text-base text-muted-foreground">{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Details */}
      <section className="border-y border-border bg-secondary/40">
        <div className="mx-auto max-w-6xl px-5 py-16 lg:px-10">
          <div className="grid gap-10 lg:grid-cols-2">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-semibold text-primary">
                <Building2 className="size-4" /> Medicare-certified partners
              </span>
              <h2 className="mt-4 font-serif text-3xl sm:text-4xl">Held to a clinical standard</h2>
              <p className="mt-4 text-lg text-muted-foreground">
                We only refer to Medicare-certified home health agencies — the same standard your hospital's discharge planner would use, but with the added benefit of a concierge who keeps track of everything else at home.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link to="/services/partners" className="inline-flex items-center gap-1 text-base font-semibold text-primary hover:underline">
                  Personal care partners →
                </Link>
                <Link to="/services/marketplace" className="inline-flex items-center gap-1 text-base font-semibold text-primary hover:underline">
                  Marketplace helpers →
                </Link>
              </div>
            </div>
            <ul className="grid gap-3">
              {[
                "Medicare-certified home health agencies only",
                "State-licensed RNs, LPNs, PTs, OTs, and SLPs",
                "Physician-ordered plan of care",
                "Agency handles Medicare, Medicaid, and insurance billing directly",
                "HIPAA-compliant clinical records held by the agency",
                "CompanionCare is not the provider of clinical services",
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
        <h2 className="font-serif text-3xl sm:text-4xl">Common questions about healthcare referrals</h2>
        <dl className="mt-8 space-y-4">
          {faqs.map((f) => (
            <div key={f.q} className="surface-card p-6">
              <dt className="text-lg font-semibold">{f.q}</dt>
              <dd className="mt-2 text-base text-muted-foreground">{f.a}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* Legal note */}
      <section className="mx-auto max-w-4xl px-5 py-4 lg:px-10">
        <div className="surface-card p-6 text-sm text-muted-foreground">
          <p>
            <span className="font-semibold text-foreground">CompanionCare does not provide clinical services.</span>{" "}
            Skilled nursing and therapy are provided by Medicare-certified home health agencies. CompanionCare is a
            referral platform and is not a health care provider, insurer, or Medicare-certified entity. In an
            emergency, dial 911.
          </p>
        </div>
      </section>

      <CTASection
        title="Need a clinical referral at home?"
        lead="Call our concierge or send a note. We'll make the introduction and stay by your side for everything else at home."
      />
    </PageShell>
  );
}
