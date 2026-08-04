import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  ShieldCheck,
  Phone,
  Sparkles,
  Clock,
  Wallet,
  BadgeCheck,
  FileCheck2,
  Repeat,
  MapPin,
  UserCheck,
  Home,
  Users,
  HandHeart,
  Stethoscope,
  Ear,
  Eye,
  Mic,
  Smartphone,
  ChevronDown,
  Check,
  X,
  Heart,
  ArrowRight,
  Quote,
} from "lucide-react";
import heroImage from "@/assets/hero.jpg";
import caregiverPlants from "@/assets/caregiver-plants.jpg";
import handsTea from "@/assets/hands-tea.jpg";
import caregiverJames from "@/assets/caregiver-james.jpg";
import caregiverMaria from "@/assets/caregiver-maria.jpg";
import caregiverLinda from "@/assets/caregiver-linda.jpg";
import {
  SiteHeader,
  SiteFooter,
  FloatingCall,
  PHONE,
  PHONE_HREF,
  SITE_URL,
  marketingHead,
} from "@/components/marketing/PageShell";

export const Route = createFileRoute("/")({
  head: () =>
    marketingHead({
      path: "/",
      title: "CompanionCare — A marketplace to find in-home help you can trust",
      description:
        "A marketplace where older adults find verified in-home help — companionship, personal care, housekeeping, errands. You stay in charge; family can be looped in when you invite them.",
      jsonLd: {
        "@context": "https://schema.org",
        "@type": "WebSite",
        name: "CompanionCare",
        url: SITE_URL,
        potentialAction: {
          "@type": "SearchAction",
          target: `${SITE_URL}/services?q={search_term_string}`,
          "query-input": "required name=search_term_string",
        },
      },
    }),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-dvh bg-background text-foreground">
      <SiteHeader />
      <Hero />
      <CareTypeTiles />
      <HowItWorks />
      <MeetNeighbors />
      <TrustLayer />
      <RateExplorer />
      <OldWayVsCompanionCare />
      <ServiceSpectrum />
      <SocialProof />
      <AccessibilitySupport />
      <FAQ />
      <LocalDirectory />
      <FooterCTA />
      <SiteFooter />
      <FloatingCall />
    </div>
  );
}

/* ---------- Care Type Tiles ---------- */

function CareTypeTiles() {
  const tiles = [
    {
      to: "/services/companionship" as const,
      icon: Users,
      title: "Companionship",
      blurb: "Visits, walks, hobbies, appointment company.",
    },
    {
      to: "/services/personal-care" as const,
      icon: HandHeart,
      title: "Personal Care",
      blurb: "Bathing, dressing, mobility, meds reminders.",
    },
    {
      to: "/services/housekeeping" as const,
      icon: Home,
      title: "Household Help",
      blurb: "Cleaning, laundry, meal prep, tidy-ups.",
    },
    {
      to: "/resources/dementia-care-tips" as const,
      icon: Heart,
      title: "Dementia Care",
      blurb: "Trained helpers for memory-loss support.",
    },
    {
      to: "/services/respite-care" as const,
      icon: Repeat,
      title: "Respite Care",
      blurb: "Short breaks for family caregivers.",
    },
    {
      to: "/services/healthcare" as const,
      icon: Stethoscope,
      title: "Skilled Care",
      blurb: "RN / LPN visits through licensed partners.",
    },
  ];
  return (
    <section className="mx-auto max-w-7xl px-5 py-16 lg:px-10 lg:py-20">
      <div className="max-w-3xl">
        <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-base font-semibold text-primary">
          <HandHeart className="size-5" /> What kind of help do you need?
        </span>
        <h2 className="mt-4 font-serif text-4xl tracking-tight sm:text-5xl">
          Start with the care type that fits today.
        </h2>
        <p className="mt-4 text-xl text-muted-foreground">
          Each tile links to a plain-language guide — no signup needed to look.
        </p>
      </div>

      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {tiles.map((t) => (
          <Link
            key={t.title}
            to={t.to}
            className="group surface-card flex items-start gap-4 p-6 transition-all hover:-translate-y-1 hover:shadow-lifted"
          >
            <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
              <t.icon className="size-7" />
            </span>
            <div className="min-w-0 flex-1">
              <h3 className="text-xl font-semibold">{t.title}</h3>
              <p className="mt-1 text-base text-muted-foreground">{t.blurb}</p>
              <p className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-primary">
                Learn more <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

/* ---------- Local Directory (state SEO strip) ---------- */

const DIRECTORY_STATES: { name: string; slug: string; cities: string[] }[] = [
  { name: "California", slug: "california", cities: ["Los Angeles", "San Diego", "San Francisco"] },
  { name: "Texas", slug: "texas", cities: ["Houston", "Dallas", "Austin"] },
  { name: "Florida", slug: "florida", cities: ["Miami", "Tampa", "Orlando"] },
  { name: "New York", slug: "new-york", cities: ["New York City", "Buffalo", "Rochester"] },
  { name: "Pennsylvania", slug: "pennsylvania", cities: ["Philadelphia", "Pittsburgh", "Allentown"] },
  { name: "Illinois", slug: "illinois", cities: ["Chicago", "Aurora", "Naperville"] },
  { name: "Ohio", slug: "ohio", cities: ["Columbus", "Cleveland", "Cincinnati"] },
  { name: "Georgia", slug: "georgia", cities: ["Atlanta", "Augusta", "Savannah"] },
];

function LocalDirectory() {
  return (
    <section className="border-y border-border bg-warm-cream">
      <div className="mx-auto max-w-7xl px-5 py-16 lg:px-10">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-base font-semibold text-primary">
              <MapPin className="size-5" /> Find care by state
            </span>
            <h2 className="mt-4 font-serif text-4xl tracking-tight sm:text-5xl">
              Senior care, where you live.
            </h2>
            <p className="mt-3 text-lg text-muted-foreground">
              Local rates, licensing rules, and what to expect — starting with our eight largest states.
            </p>
          </div>
          <Link
            to="/senior-care"
            className="inline-flex items-center gap-2 rounded-full border-2 border-primary bg-card px-5 py-3 text-base font-semibold text-primary hover:bg-secondary"
          >
            All states &amp; care types <ArrowRight className="size-4" />
          </Link>
        </div>

        <ul className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {DIRECTORY_STATES.map((s) => (
            <li key={s.slug}>
              <Link
                to="/senior-care/$state"
                params={{ state: s.slug }}
                className="group flex h-full flex-col rounded-2xl border border-border bg-card p-5 transition-all duration-200 hover:-translate-y-1 hover:border-primary hover:shadow-lifted"
              >
                <span className="inline-flex items-center gap-2 text-lg font-semibold">
                  <MapPin className="size-4 shrink-0 text-primary" /> {s.name}
                </span>
                <p className="mt-2 text-sm text-muted-foreground">{s.cities.join(" · ")}</p>
                <p className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                  See local rates &amp; rules
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                </p>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/* ---------- Hero ---------- */

function Hero() {
  return (
    <section className="relative overflow-hidden">
      {/* soft background wash */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-warm-cream via-background to-background"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -top-32 -right-32 -z-10 size-[520px] rounded-full bg-primary/10 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-40 -left-20 -z-10 size-[420px] rounded-full bg-accent/10 blur-3xl"
      />

      <div className="mx-auto max-w-7xl px-5 pt-10 pb-20 lg:px-10 lg:pt-16 lg:pb-28">
        <div className="grid items-center gap-12 lg:grid-cols-12">
          <div className="min-w-0 lg:col-span-6">
            <span className="inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-1.5 text-sm font-medium text-secondary-foreground animate-fade-in sm:px-4 sm:py-2 sm:text-base">
              <ShieldCheck className="size-4 shrink-0 text-primary sm:size-5" /> A marketplace built for older adults
            </span>
            <h1 className="mt-6 font-serif text-[32px] leading-[1.05] tracking-tight text-balance sm:text-5xl lg:text-6xl">
              Find in-home help you can trust —{" "}
              <span className="relative inline-block">
                <span className="relative z-10">on your terms</span>
                <span
                  aria-hidden
                  className="absolute inset-x-0 bottom-1 -z-0 h-3 bg-accent/40"
                />
              </span>
              .
            </h1>
            <p className="mt-6 max-w-xl text-lg text-muted-foreground text-pretty sm:text-xl">
              Browse verified helpers for companionship, cleaning, personal care, and more. You choose who comes, when, and for how long — and family can be looped in when you invite them.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                to="/auth"
                search={{ mode: "signup" }}
                className="group inline-flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-soft transition-all hover:bg-primary/90 hover:shadow-lifted sm:px-6 sm:py-3 sm:text-base"
              >
                Get started
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <a
                href={PHONE_HREF}
                className="inline-flex items-center justify-center gap-2 rounded-full border-2 border-primary bg-card px-5 py-2.5 text-sm font-semibold text-primary hover:bg-secondary sm:px-6 sm:py-3 sm:text-base"
              >
                <Phone className="size-4" /> <span className="truncate">Call {PHONE}</span>
              </a>
            </div>
          </div>

          <div className="min-w-0 lg:col-span-6">
            <div className="relative">
              <div
                aria-hidden
                className="absolute -inset-4 -z-10 rounded-[2rem] bg-gradient-to-tr from-primary/20 to-accent/20 blur-2xl"
              />
              <img
                src={heroImage}
                alt="A caregiver sharing tea with an older woman in a sunlit living room"
                className="aspect-[4/3] w-full rounded-3xl object-cover shadow-lifted"
                loading="eager"
                width={1024}
                height={768}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------- How It Works ---------- */

function HowItWorks() {
  const [active, setActive] = useState(0);
  const steps = [
    {
      icon: HandHeart,
      title: "Tell us what you need",
      teaser: "One question at a time",
      body: "Answer one question at a time — by voice, by text, or over the phone with a real person doing it with you.",
    },
    {
      icon: UserCheck,
      title: "See your verified matches",
      teaser: "Up to five nearby helpers",
      body: "Up to five nearby helpers, each with a full verification report you can open and read before you decide.",
    },
    {
      icon: Check,
      title: "Book with confidence",
      teaser: "Live check-in, every visit",
      body: "Every visit begins with a live check-in and ends with a simple “how did it go?” — so you always know what happened.",
    },
  ];
  const current = steps[active];

  return (
    <section id="how" className="border-b border-border bg-secondary/40">
      <div className="mx-auto max-w-7xl px-5 py-20 lg:px-10">
        <div className="max-w-2xl">
          <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-base font-semibold text-primary">
            <Sparkles className="size-5" /> How it works
          </span>
          <h2 className="mt-4 font-serif text-4xl tracking-tight sm:text-5xl">
            Three steps. No surprises.
          </h2>
          <p className="mt-3 text-xl text-muted-foreground">
            You stay in control the entire way — online, on the phone, or both.
          </p>
        </div>

        <div className="mt-12 grid gap-6 lg:grid-cols-12 lg:gap-8">
          <div
            role="tablist"
            aria-label="How CompanionCare works, steps"
            className="flex gap-2 overflow-x-auto pb-2 lg:col-span-4 lg:flex-col lg:overflow-visible lg:pb-0"
          >
            {steps.map((s, i) => {
              const isActive = i === active;
              return (
                <button
                  key={s.title}
                  type="button"
                  role="tab"
                  id={`how-tab-${i}`}
                  aria-selected={isActive}
                  aria-controls={`how-panel-${i}`}
                  onClick={() => setActive(i)}
                  className={`flex w-full shrink-0 items-center gap-4 rounded-2xl border p-4 text-left transition-all duration-300 sm:shrink ${
                    isActive
                      ? "border-primary bg-card shadow-lifted"
                      : "border-transparent hover:bg-card/60"
                  }`}
                >
                  <span
                    className={`grid size-10 shrink-0 place-items-center rounded-full font-serif text-lg transition-colors ${
                      isActive ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground"
                    }`}
                  >
                    {i + 1}
                  </span>
                  <span className="min-w-0">
                    <span className={`block truncate font-semibold ${isActive ? "text-foreground" : "text-muted-foreground"}`}>
                      {s.title}
                    </span>
                    <span className="hidden truncate text-sm text-muted-foreground lg:block">
                      {s.teaser}
                    </span>
                  </span>
                </button>
              );
            })}

            <div className="relative mt-1 hidden h-1 overflow-hidden rounded-full bg-border lg:block" aria-hidden>
              <div
                className="h-full rounded-full bg-primary transition-all duration-500 ease-out"
                style={{ width: `${((active + 1) / steps.length) * 100}%` }}
              />
            </div>
          </div>

          <div
            key={active}
            role="tabpanel"
            id={`how-panel-${active}`}
            aria-labelledby={`how-tab-${active}`}
            className="surface-card animate-fade-in p-8 lg:col-span-8 lg:p-10"
          >
            <div className="flex items-center gap-4">
              <span className="grid size-14 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
                <current.icon className="size-7" aria-hidden />
              </span>
              <span className="font-serif text-lg text-primary">
                Step {active + 1} of {steps.length}
              </span>
            </div>
            <h3 className="mt-6 text-3xl font-semibold">{current.title}</h3>
            <p className="mt-3 text-xl text-muted-foreground">{current.body}</p>

            <div className="mt-8 flex gap-3">
              <button
                type="button"
                onClick={() => setActive((a) => Math.max(0, a - 1))}
                disabled={active === 0}
                className="rounded-full border border-border px-4 py-2 text-sm font-semibold hover:bg-card disabled:pointer-events-none disabled:opacity-30"
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => setActive((a) => Math.min(steps.length - 1, a + 1))}
                disabled={active === steps.length - 1}
                className="group inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:pointer-events-none disabled:opacity-30"
              >
                Next <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------- Meet the Neighbors ---------- */

function MeetNeighbors() {
  const people = [
    {
      photo: caregiverMaria,
      name: "Maria R.",
      role: "Personal Care Aide",
      years: "8 yrs experience",
      tags: ["CNA licensed", "Bilingual EN/ES", "Dementia trained"],
      quote: "Every visit starts with a cup of tea. That's how I get to know someone.",
    },
    {
      photo: caregiverJames,
      name: "James O.",
      role: "Companion Care",
      years: "4 yrs experience",
      tags: ["Background verified", "Musician", "Weekend evenings"],
      quote: "I bring my guitar. Miss Ellen taught me two hymns her mother sang.",
    },
    {
      photo: caregiverLinda,
      name: "Linda K.",
      role: "Household Help",
      years: "12 yrs experience",
      tags: ["Meal prep", "Deep clean", "Errand runner"],
      quote: "I don't just clean — I put the tea kettle on before I go.",
    },
  ];
  return (
    <section className="mx-auto max-w-7xl px-5 py-20 lg:px-10">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div className="max-w-2xl">
          <span className="inline-flex items-center gap-2 rounded-full bg-accent/15 px-4 py-2 text-base font-semibold text-accent">
            <Heart className="size-5" /> What a helper profile looks like
          </span>
          <h2 className="mt-4 font-serif text-4xl tracking-tight sm:text-5xl">
            Real profiles. Verified. Nearby.
          </h2>
          <p className="mt-4 text-xl text-muted-foreground">
            These are sample profiles that show what you'll browse on the marketplace — experience, tags, and exactly what was verified, when, and by whom.
          </p>
        </div>
        <Link
          to="/for-caregivers"
          className="inline-flex items-center gap-2 rounded-full border-2 border-primary bg-card px-5 py-3 text-base font-semibold text-primary hover:bg-secondary"
        >
          How helpers join <ArrowRight className="size-4" />
        </Link>
      </div>


      <div className="mt-10 grid gap-6 md:grid-cols-3">
        {people.map((p) => (
          <article
            key={p.name}
            className="group surface-card overflow-hidden p-0 transition-all hover:-translate-y-1 hover:shadow-lifted"
          >
            <div className="relative aspect-[4/5] w-full overflow-hidden">
              <img
                src={p.photo}
                alt={`${p.name}, ${p.role}`}
                className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
                loading="lazy"
                width={1024}
                height={1280}
              />
              <span className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-card/95 px-3 py-1.5 text-xs font-semibold text-primary shadow-soft backdrop-blur">
                <BadgeCheck className="size-4" /> Sample profile
              </span>

              <div
                aria-hidden
                className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-foreground/50 to-transparent"
              />
              <div className="absolute inset-x-4 bottom-4 text-primary-foreground">
                <p className="font-serif text-2xl">{p.name}</p>
                <p className="text-sm opacity-95">
                  {p.role} • {p.years}
                </p>
              </div>
            </div>
            <div className="p-6">
              <blockquote className="flex gap-2 text-base italic text-foreground">
                <Quote className="mt-1 size-4 shrink-0 text-primary/60" aria-hidden />
                <span>"{p.quote}"</span>
              </blockquote>
              <ul className="mt-4 flex flex-wrap gap-2">
                {p.tags.map((t) => (
                  <li
                    key={t}
                    className="rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground"
                  >
                    {t}
                  </li>
                ))}
              </ul>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

/* ---------- Trust Layer ---------- */

function TrustLayer() {
  const checks = [
    { icon: FileCheck2, title: "Identity Proofing", blurb: "Government ID + liveness selfie, matched at signup." },
    { icon: ShieldCheck, title: "Background Check", blurb: "National criminal + sex offender registry, refreshed yearly." },
    { icon: BadgeCheck, title: "Credential Verify", blurb: "Licenses checked against state registries for care roles." },
    { icon: Repeat, title: "Continuous Monitoring", blurb: "Re-checked every 30 days — new issues surface in days." },
    { icon: MapPin, title: "Visit Confirmation", blurb: "Live selfie match + GPS check-in at the start of every visit." },
  ];

  const [open, setOpen] = useState<number | null>(0);

  return (
    <section id="trust" className="mx-auto max-w-7xl px-5 py-16 lg:px-10 lg:py-20">
      <div className="max-w-3xl">
        <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-base font-semibold text-primary">
          <ShieldCheck className="size-5" /> Safety at every step
        </span>
        <h2 className="mt-4 font-serif text-4xl tracking-tight sm:text-5xl">
          Five checks. Every helper. Every visit.
        </h2>
        <p className="mt-4 text-lg text-muted-foreground">
          Tap any check for a quick summary — or see the full verification playbook.
        </p>
      </div>

      <ul className="mt-8 flex flex-col gap-2">
        {checks.map((c, i) => {
          const isOpen = open === i;
          return (
            <li key={c.title} className="surface-card overflow-hidden p-0">
              <button
                type="button"
                onClick={() => setOpen(isOpen ? null : i)}
                aria-expanded={isOpen}
                className="flex w-full items-center gap-4 p-4 text-left hover:bg-secondary/40"
              >
                <span className={`grid size-11 shrink-0 place-items-center rounded-xl transition-colors ${isOpen ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary"}`}>
                  <c.icon className="size-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold uppercase tracking-wider text-primary">Check {i + 1}</p>
                  <p className="mt-0.5 text-base font-semibold">{c.title}</p>
                </div>
                <ChevronDown
                  className={`size-5 shrink-0 text-muted-foreground transition-transform ${isOpen ? "rotate-180" : ""}`}
                  aria-hidden
                />
              </button>
              {isOpen && (
                <p className="animate-fade-in border-t border-border bg-secondary/30 px-5 py-4 text-base text-muted-foreground">
                  {c.blurb}
                </p>
              )}
            </li>
          );
        })}
      </ul>

      <div className="mt-8 flex flex-wrap items-center gap-3">
        <Link
          to="/trust"
          className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-soft hover:bg-primary/90"
        >
          See the full trust playbook <ArrowRight className="size-4" />
        </Link>
        <p className="text-sm text-muted-foreground">Every check, every timeline, every source.</p>
      </div>
    </section>
  );
}

/* ---------- Rate Explorer ---------- */

type RateTier = {
  key: string;
  name: string;
  icon: typeof Home;
  low: number;
  high: number;
  blurb: string;
  examples: string[];
};

function RateExplorer() {
  const tiers: RateTier[] = [
    {
      key: "household",
      name: "Household help",
      icon: Home,
      low: 25,
      high: 45,
      blurb: "Cleaning, laundry, meal prep.",
      examples: ["Weekly tidy-up", "Kitchen deep clean", "Laundry & linens"],
    },
    {
      key: "companionship",
      name: "Companionship",
      icon: Users,
      low: 20,
      high: 35,
      blurb: "Conversation, walks, activities.",
      examples: ["Afternoon visit", "Walk to the park", "Appointment company"],
    },
    {
      key: "personal",
      name: "Personal care",
      icon: HandHeart,
      low: 28,
      high: 50,
      blurb: "Bathing, dressing, mobility.",
      examples: ["Morning routine", "Medication reminders", "Transfer support"],
    },
    {
      key: "skilled",
      name: "Skilled nursing",
      icon: Stethoscope,
      low: 45,
      high: 80,
      blurb: "Licensed RN / LPN visits.",
      examples: ["Wound care", "Injections", "Post-hospital check"],
    },
  ];

  const [tierKey, setTierKey] = useState<string>("companionship");
  const tier = tiers.find((t) => t.key === tierKey) ?? tiers[0];

  const mid = Math.round((tier.low + tier.high) / 2);
  const fmt = (n: number) =>
    n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

  // Weekly previews — 3 realistic intensities. Numbers stay small on purpose.
  const weekly = [
    { label: "One visit / week", hint: "3 hrs", hours: 3 },
    { label: "A few visits / week", hint: "6 hrs", hours: 6 },
    { label: "Most days", hint: "12 hrs", hours: 12 },
  ];

  return (
    <section id="pricing" className="border-y border-border bg-warm-cream">
      <div className="mx-auto max-w-7xl px-5 py-20 lg:px-10">
        <div className="grid gap-10 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <span className="inline-flex items-center gap-2 rounded-full bg-accent/15 px-4 py-2 text-base font-semibold text-accent">
              <Wallet className="size-5" /> Average rates
            </span>
            <h2 className="mt-4 font-serif text-4xl tracking-tight sm:text-5xl">
              Pay by the hour, not by the month.
            </h2>
            <p className="mt-4 text-xl text-muted-foreground">
              Pick a service to see the typical hourly rate — and what a normal week of
              visits looks like. No lump-sum surprises, no long contracts.
            </p>
            <p className="mt-4 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1.5 text-sm font-medium text-primary">
              <ShieldCheck className="size-4" /> Prices exclude the 15–18% service fee, shown as one total before you book.
            </p>

            <div className="mt-8">
              <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Choose a service
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {tiers.map((t) => {
                  const active = t.key === tierKey;
                  return (
                    <button
                      key={t.key}
                      onClick={() => setTierKey(t.key)}
                      aria-pressed={active}
                      className={`inline-flex min-h-11 items-center gap-2 rounded-full border px-4 py-2 text-base font-medium transition-colors ${
                        active
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-card hover:bg-secondary"
                      }`}
                    >
                      <t.icon className="size-4" /> {t.name}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/pricing"
                className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-soft hover:bg-primary/90"
              >
                Build a plan with real hours <ArrowRight className="size-4" />
              </Link>
              <a
                href={PHONE_HREF}
                className="inline-flex items-center gap-2 rounded-full border-2 border-primary bg-card px-5 py-2.5 text-sm font-semibold text-primary hover:bg-secondary"
              >
                <Phone className="size-4" /> Or talk it through
              </a>
            </div>
          </div>

          <div className="lg:col-span-7">
            <div className="surface-card p-6 md:p-8">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="grid size-14 place-items-center rounded-2xl bg-primary/10 text-primary">
                    <tier.icon className="size-7" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                      {tier.name}
                    </p>
                    <p className="text-lg text-muted-foreground">{tier.blurb}</p>
                  </div>
                </div>
                <span className="hidden shrink-0 rounded-full bg-secondary px-3 py-1.5 text-xs font-semibold text-secondary-foreground sm:inline-flex">
                  Average in your area
                </span>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-3">
                <div className="rounded-2xl border border-border bg-warm-cream/60 p-5 sm:col-span-1">
                  <p className="text-sm text-muted-foreground">Typical range</p>
                  <p className="mt-1 font-serif text-3xl text-foreground">
                    {fmt(tier.low)}–{fmt(tier.high)}
                    <span className="ml-1 text-base text-muted-foreground">/hr</span>
                  </p>
                </div>
                <div className="rounded-2xl bg-primary/10 p-5 sm:col-span-2">
                  <p className="text-sm font-semibold text-primary">Average</p>
                  <p className="mt-1 font-serif text-5xl text-primary">
                    {fmt(mid)}
                    <span className="ml-1 text-lg font-normal text-primary/80">/ hour</span>
                  </p>
                  <p className="mt-1 text-sm text-primary/80">
                    Provider-set rate. You approve it before booking.
                  </p>
                </div>
              </div>

              <div className="mt-6">
                <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  What that looks like weekly
                </p>
                <ul className="mt-3 grid gap-3 sm:grid-cols-3">
                  {weekly.map((w) => {
                    const low = w.hours * tier.low;
                    const high = w.hours * tier.high;
                    return (
                      <li
                        key={w.label}
                        className="rounded-2xl border border-border bg-card p-5"
                      >
                        <p className="text-base font-semibold">{w.label}</p>
                        <p className="text-sm text-muted-foreground">{w.hint}</p>
                        <p className="mt-3 font-serif text-2xl text-foreground">
                          {fmt(low)}–{fmt(high)}
                        </p>
                        <p className="text-sm text-muted-foreground">/ week</p>
                      </li>
                    );
                  })}
                </ul>
              </div>

              <div className="mt-6 rounded-2xl bg-secondary/60 p-5">
                <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  Common visits
                </p>
                <ul className="mt-2 flex flex-wrap gap-2">
                  {tier.examples.map((e) => (
                    <li
                      key={e}
                      className="inline-flex items-center gap-1.5 rounded-full bg-card px-3 py-1.5 text-sm font-medium"
                    >
                      <Check className="size-4 text-primary" /> {e}
                    </li>
                  ))}
                </ul>
              </div>

              <p className="mt-5 text-sm text-muted-foreground">
                Want a full monthly estimate with your real hours?{" "}
                <Link to="/pricing" className="font-semibold text-primary hover:underline">
                  Open the pricing builder →
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------- Old Way vs CompanionCare ---------- */

function OldWayVsCompanionCare() {
  const rows = [
    { label: "Who's coming to the door?", old: "A stranger from a printed roster", cm: "A verified helper with a live selfie match" },
    { label: "Background checks", old: "Once at hire, maybe", cm: "Refreshed every 30 days, automatically" },
    { label: "Pricing", old: "Opaque agency invoices", cm: "Transparent plans that fit your budget" },
    { label: "Booking changes", old: "Phone tag, business hours only", cm: "Cancel or reschedule up to 24 hrs before, any time" },
    { label: "Family visibility", old: "Whatever mom remembers to tell you", cm: "Real-time updates — if the senior invites you" },
    { label: "If something goes wrong", old: "A voicemail on Monday", cm: "24/7 concierge, response in minutes" },
  ];
  return (
    <section className="mx-auto max-w-7xl px-5 py-20 lg:px-10">
      <div className="grid gap-10 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <img
            src={handsTea}
            alt="Two people sharing tea at a kitchen table"
            className="aspect-[4/5] w-full rounded-3xl object-cover shadow-lifted"
            loading="lazy"
            width={1024}
            height={1280}
          />
        </div>
        <div className="lg:col-span-7">
          <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-base font-semibold text-primary">
            <Sparkles className="size-5" /> A better way to find help
          </span>
          <h2 className="mt-4 font-serif text-4xl tracking-tight sm:text-5xl">
            A kinder way to bring care into the home.
          </h2>
          <p className="mt-4 text-xl text-muted-foreground">
            No paperwork mazes, no rotating strangers. Just a small, familiar
            circle of helpers you already trust — built around your family's routine.
          </p>

          <div className="mt-8 overflow-hidden rounded-3xl border border-border bg-card">
            <div className="grid grid-cols-[1fr_1fr_1fr] gap-0 border-b border-border bg-secondary/60 px-5 py-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              <span className="sr-only sm:not-sr-only">Topic</span>
              <span className="col-start-2 flex items-center gap-2">
                <X className="size-4" /> Old way
              </span>
              <span className="flex items-center gap-2 text-primary">
                <Check className="size-4" /> CompanionCare
              </span>
            </div>
            <ul>
              {rows.map((r, i) => (
                <li
                  key={r.label}
                  className={`grid grid-cols-1 gap-3 px-5 py-4 sm:grid-cols-[1fr_1fr_1fr] sm:items-start ${i % 2 === 1 ? "bg-secondary/30" : ""}`}
                >
                  <p className="text-base font-semibold">{r.label}</p>
                  <p className="flex gap-2 text-base text-muted-foreground line-through decoration-destructive/40 decoration-2">
                    <X className="mt-1 size-4 shrink-0 text-destructive/60" aria-hidden />
                    {r.old}
                  </p>
                  <p className="flex gap-2 text-base font-medium">
                    <Check className="mt-1 size-4 shrink-0 text-primary" aria-hidden />
                    {r.cm}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------- Service Spectrum ---------- */

function ServiceSpectrum() {
  const tiers = [
    {
      icon: Home,
      name: "Household Help",
      examples: "Cleaning, laundry, errands, meal prep",
      hours: "2–6 hrs / visit",
      verify: "Identity + background",
    },
    {
      icon: Users,
      name: "Companionship",
      examples: "Conversation, activities, walks, appointments",
      hours: "2–8 hrs / visit",
      verify: "Identity + background + references",
    },
    {
      icon: HandHeart,
      name: "Personal Care",
      examples: "Bathing, dressing, medication reminders, mobility",
      hours: "1–8 hrs / visit",
      verify: "All above + CNA / HHA license",
    },
    {
      icon: Stethoscope,
      name: "Skilled Care",
      examples: "Nursing, therapy, wound care (via licensed partners)",
      hours: "Scheduled visits",
      verify: "All above + clinical credentials + insurance",
    },
  ];
  return (
    <section className="border-y border-border bg-secondary/40">
      <div className="mx-auto max-w-7xl px-5 py-20 lg:px-10">
        <div className="max-w-3xl">
          <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-base font-semibold text-primary">
            <Sparkles className="size-5" /> The full spectrum
          </span>
          <h2 className="mt-4 font-serif text-4xl tracking-tight sm:text-5xl">
            One platform. The whole spectrum of care.
          </h2>
          <p className="mt-4 text-xl text-muted-foreground">
            Start with what you need today. Grow into more when the time comes —
            the same trusted helpers, the same account.
          </p>
        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-2">
          {tiers.map((t) => (
            <article
              key={t.name}
              className="surface-card group flex flex-col p-6 transition-all hover:-translate-y-1 hover:shadow-lifted"
            >
              <div className="flex items-center gap-4">
                <span className="grid size-14 place-items-center rounded-2xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  <t.icon className="size-7" />
                </span>
                <h3 className="text-2xl font-semibold">{t.name}</h3>
              </div>
              <p className="mt-4 text-lg text-muted-foreground">{t.examples}</p>
              <dl className="mt-5 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <dt className="text-muted-foreground">Typical hours</dt>
                  <dd className="mt-1 font-semibold">{t.hours}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Verification</dt>
                  <dd className="mt-1 font-semibold">{t.verify}</dd>
                </div>
              </dl>
            </article>
          ))}
        </div>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-center text-lg text-muted-foreground">
          <span>Start with any tier. Grow as you need.</span>
          <Link to="/pricing" className="inline-flex items-center gap-1 font-semibold text-primary hover:underline">
            See full pricing <ArrowRight className="size-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ---------- Social Proof ---------- */

function SocialProof() {
  const promises = [
    {
      title: "The senior is always in charge.",
      body: "You approve every helper, every visit, and every family member who gets to see what's going on. Consent can be revoked in one tap.",
    },
    {
      title: "Every helper is checked five ways.",
      body: "Identity, background, credentials, monthly re-checks, and a live selfie + GPS at the door. Every badge on a profile shows what was checked, when, and by whom.",
    },
    {
      title: "Family sees only what you share.",
      body: "Invite an adult child to see visits and budgets — or to help pay — with a scope you choose. Revoke anytime. No shadow bookings, ever.",
    },
    {
      title: "One clear price, before you book.",
      body: "Helpers set their hourly rate. CompanionCare adds a flat service fee, shown as one total up front. Cancel free up to 24 hours before a visit.",
    },
  ];
  return (
    <section className="relative overflow-hidden">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 py-20 lg:grid-cols-12 lg:px-10">
        <div className="lg:col-span-5">
          <div className="relative">
            <img
              src={caregiverPlants}
              alt="A helper and older woman tending a potted plant by the window"
              className="aspect-[4/5] w-full rounded-3xl object-cover shadow-lifted"
              loading="lazy"
              width={1024}
              height={1280}
            />
            <div className="surface-card absolute -bottom-6 left-4 right-4 p-5 sm:right-auto sm:max-w-xs">
              <div className="flex items-center gap-3">
                <span className="grid size-10 place-items-center rounded-full bg-primary/10 text-primary">
                  <ShieldCheck className="size-5" />
                </span>
                <p className="text-base font-semibold">A new marketplace</p>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                CompanionCare is just opening. We'd rather earn your first review than borrow someone else's.
              </p>
            </div>
          </div>
        </div>

        <div className="lg:col-span-7">
          <span className="inline-flex items-center gap-2 rounded-full bg-accent/15 px-4 py-2 text-base font-semibold text-accent">
            <Heart className="size-5" /> Our promises to you
          </span>
          <h2 className="mt-4 font-serif text-4xl tracking-tight sm:text-5xl">
            No stock testimonials. Just what we promise.
          </h2>
          <p className="mt-4 text-xl text-muted-foreground">
            CompanionCare is a new marketplace — so instead of borrowed quotes, here's exactly how we've built it and what you can hold us to.
          </p>

          <div className="mt-8 grid gap-4">
            {promises.map((p) => (
              <article key={p.title} className="surface-card flex gap-4 p-6">
                <span className="grid size-10 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
                  <Check className="size-5" />
                </span>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold">{p.title}</h3>
                  <p className="mt-1 text-base text-muted-foreground">{p.body}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------- Accessibility & Support ---------- */

function AccessibilitySupport() {
  const badges = [
    { icon: BadgeCheck, label: "WCAG 2.2 AA certified" },
    { icon: Eye, label: "Large Text Mode" },
    { icon: Mic, label: "Voice input on every field" },
    { icon: Ear, label: "Screen reader optimized" },
    { icon: Smartphone, label: "No app required" },
  ];
  return (
    <section className="border-y border-border bg-secondary/40">
      <div className="mx-auto max-w-7xl px-5 py-20 lg:px-10">
        <div className="surface-card grid gap-8 p-8 md:grid-cols-2 md:p-12">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-base font-semibold text-primary">
              <Phone className="size-5" /> Phone is a peer channel
            </span>
            <h2 className="mt-4 font-serif text-4xl tracking-tight">
              Prefer to talk?
              <br />
              Call us: <span className="text-primary">{PHONE}</span>
            </h2>
            <p className="mt-4 text-xl text-muted-foreground">
              No app required. We can do everything by phone with you — intake,
              matching, booking, and updates. Same team. Same care.
            </p>
            <a
              href={PHONE_HREF}
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-soft hover:bg-primary/90 sm:px-6 sm:py-3 sm:text-base"
            >
              <Phone className="size-4" /> Call {PHONE}
            </a>
          </div>
          <ul className="grid gap-3 self-center">
            {badges.map(({ icon: Icon, label }) => (
              <li
                key={label}
                className="flex items-center gap-4 rounded-2xl border border-border bg-card px-5 py-4 text-lg font-medium"
              >
                <Icon className="size-6 text-primary" />
                {label}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

/* ---------- FAQ ---------- */

function FAQ() {
  const items = [
    {
      q: "How much does this cost?",
      a: "Providers set their own hourly rates within suggested market bands: cleaning $25–$45/hr, companionship $20–$35/hr, personal care $28–$50/hr, skilled nursing $45–$80/hr. CompanionCare adds a flat 15–18% service fee — shown as one total before you book. Full plans typically run $800–$3,500/month depending on hours and tier. Optional CompanionCare Plus is $29/month and waives fees on the first $200 of bookings.",
    },
    {
      q: "How do you verify helpers?",
      a: "Every helper clears five checks: identity proofing, national background check, credential verification (for licensed roles), continuous monthly re-checks, and a live selfie + GPS check-in at every visit.",
    },
    {
      q: "Can I cancel or change a visit?",
      a: "Yes — cancel or reschedule any visit up to 24 hours before it starts, at no charge. Life happens, and the platform is built around that.",
    },
    {
      q: "What if something goes wrong?",
      a: "Call our 24/7 concierge at 1-800-COMPANION. Every helper is covered by our insurance, and our team responds to safety concerns within minutes — not business days.",
    },
    {
      q: "Can my family see what's happening?",
      a: "Only if you invite them. Seniors approve every family connection, and can revoke access anytime. Families see visits, verifications, and budget — never messages you haven't shared.",
    },
    {
      q: "Do you accept Medicare or Medicaid?",
      a: "Skilled care visits can be billed to insurance where eligible via our licensed partners. Household help, companionship, and personal care are typically out-of-pocket — the budget optimizer helps you plan.",
    },
    {
      q: "What if I don't have a smartphone?",
      a: "You never need one. Everything CompanionCare does digitally can be done by phone with a real person on our concierge team. Same options, same helpers, same care.",
    },
    {
      q: "How do I know the person showing up is the right person?",
      a: "At every visit, the helper takes a live selfie at your door. We match it to their verified ID and confirm GPS — you see 'verified on arrival' before they ring the bell.",
    },
  ];
  return (
    <section className="border-b border-border bg-warm-cream">
      <div className="mx-auto max-w-4xl px-5 py-20 lg:px-10">
        <h2 className="font-serif text-4xl tracking-tight sm:text-5xl">Common questions</h2>
        <p className="mt-3 text-xl text-muted-foreground">
          Plain language. No fine print. Answers stay open until you close them.
        </p>
        <ul className="mt-10 flex flex-col gap-3">
          {items.map((item) => (
            <FaqRow key={item.q} q={item.q} a={item.a} />
          ))}
        </ul>
      </div>
    </section>
  );
}

function FaqRow({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <li className="surface-card overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-4 p-5 text-left hover:bg-secondary/50"
      >
        <span className="text-xl font-semibold">{q}</span>
        <ChevronDown
          className={`size-6 shrink-0 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`}
          aria-hidden
        />
      </button>
      {open && <div className="border-t border-border p-5 text-lg text-foreground">{a}</div>}
    </li>
  );
}

/* ---------- Footer CTA ---------- */

function FooterCTA() {
  return (
    <section className="mx-auto max-w-7xl px-5 py-20 lg:px-10">
      <div className="surface-card relative grid items-center gap-8 overflow-hidden p-10 md:grid-cols-2 md:p-14">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-24 -top-24 size-80 rounded-full bg-primary/10 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-24 -left-24 size-80 rounded-full bg-accent/10 blur-3xl"
        />
        <div className="relative">
          <h2 className="font-serif text-4xl tracking-tight text-balance sm:text-5xl">
            Ready to find your match?
          </h2>
          <p className="mt-4 text-xl text-muted-foreground text-pretty">
            Start with one question. We'll take it from there — online or on the phone.
          </p>
          <p className="mt-6 flex items-center gap-2 text-base text-muted-foreground">
            <Clock className="size-5" /> Takes about 3 minutes
          </p>
        </div>
        <div className="relative flex flex-col gap-3">
          <Link
            to="/auth"
            search={{ mode: "signup" }}
            className="group inline-flex min-h-16 items-center justify-center gap-2 rounded-full bg-primary px-8 py-5 text-2xl font-semibold text-primary-foreground shadow-lifted hover:bg-primary/90"
          >
            Start your care plan
            <ArrowRight className="size-6 transition-transform group-hover:translate-x-1" />
          </Link>
          <a
            href={PHONE_HREF}
            className="inline-flex min-h-16 items-center justify-center gap-2 rounded-full border-2 border-accent bg-card px-8 py-5 text-2xl font-semibold text-accent hover:bg-accent/10"
          >
            <Phone className="size-6" /> Call {PHONE}
          </a>
        </div>
      </div>
    </section>
  );
}
