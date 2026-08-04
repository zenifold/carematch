import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ShieldCheck,
  Users,
  HandHeart,
  Home,
  Heart,
  Repeat,
  Stethoscope,
  MapPin,
  ArrowRight,
  Phone,
  Wallet,
  Check,
  BadgeCheck,
} from "lucide-react";
import {
  SiteHeader,
  SiteFooter,
  FloatingCall,
  PHONE,
  PHONE_HREF,
  marketingHead,
} from "@/components/marketing/PageShell";
import heroImage from "@/assets/caregiver-plants.jpg";

const CARE_TYPES = [
  { to: "/services/companionship" as const, icon: Users, title: "Companionship", blurb: "Visits, walks, hobbies, meals, appointments.", who: "Someone who wants a friendly presence a few times a week." },
  { to: "/services/personal-care" as const, icon: HandHeart, title: "Personal Care", blurb: "Bathing, dressing, mobility, meds reminders.", who: "Help with daily routines and hands-on care." },
  { to: "/services/housekeeping" as const, icon: Home, title: "Household Help", blurb: "Cleaning, laundry, meal prep, errands.", who: "The home stays cared for so the day stays easy." },
  { to: "/resources/dementia-care-tips" as const, icon: Heart, title: "Dementia Care", blurb: "Trained helpers for memory-loss support.", who: "Consistency and calm for someone with memory changes." },
  { to: "/services/respite-care" as const, icon: Repeat, title: "Respite Care", blurb: "Short breaks for the family caregiver.", who: "So the person doing it all can rest and reset." },
  { to: "/services/healthcare" as const, icon: Stethoscope, title: "Skilled Nursing", blurb: "RN / LPN visits through licensed partners.", who: "Clinical care after a hospital stay or for ongoing conditions." },
];

const STATES = [
  "California","Texas","Florida","New York","Pennsylvania","Illinois","Ohio","Georgia",
  "North Carolina","Michigan","New Jersey","Virginia","Washington","Arizona","Massachusetts",
  "Tennessee","Indiana","Missouri","Maryland","Wisconsin","Colorado","Minnesota","South Carolina","Oregon",
];

const slug = (s: string) => s.toLowerCase().replace(/\s+/g, "-");

export const Route = createFileRoute("/senior-care/")({
  head: () =>
    marketingHead({
      path: "/senior-care",
      title: "Senior Care at Home — Verified Helpers, Fair Rates | CompanionCare",
      description:
        "Find verified senior caregivers for companionship, personal care, housekeeping, dementia support, and respite. Real hourly rates, 5-stage verification, family-optional oversight.",
    }),
  component: SeniorCareHub,
});

function SeniorCareHub() {
  return (
    <div className="min-h-dvh bg-background text-foreground">
      <SiteHeader />
      <Hero />
      <CareTypes />
      <Verification />
      <Costs />
      <FamilyCollaboration />
      <StateDirectory />
      <BottomCTA />
      <SiteFooter />
      <FloatingCall />
    </div>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-border">
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-warm-cream via-background to-background" />
      <div className="mx-auto grid max-w-7xl gap-10 px-5 pb-16 pt-12 lg:grid-cols-12 lg:px-10 lg:pb-24 lg:pt-16">
        <div className="lg:col-span-7">
          <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-base font-semibold text-primary">
            <ShieldCheck className="size-5" /> Senior care hub
          </span>
          <h1 className="mt-6 font-serif text-4xl leading-tight tracking-tight sm:text-5xl lg:text-6xl">
            Senior care at home — chosen by the person receiving it.
          </h1>
          <p className="mt-6 max-w-2xl text-xl text-muted-foreground">
            Whether it's a friendly visit, help with bathing, a tidy kitchen, or a nurse after a hospital stay — CompanionCare is a marketplace of verified local helpers. Real rates. No pressure. Family can be looped in when the senior chooses.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to="/auth"
              search={{ mode: "signup" }}
              className="group inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-base font-semibold text-primary-foreground shadow-soft hover:bg-primary/90"
            >
              Start your care plan <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <a
              href={PHONE_HREF}
              className="inline-flex items-center gap-2 rounded-full border-2 border-primary bg-card px-6 py-3 text-base font-semibold text-primary hover:bg-secondary"
            >
              <Phone className="size-4" /> Call {PHONE}
            </a>
          </div>
        </div>
        <div className="lg:col-span-5">
          <img
            src={heroImage}
            alt="A caregiver helping an older woman tend a potted plant by a sunlit window"
            className="aspect-[4/5] w-full rounded-3xl object-cover shadow-lifted"
            width={1024}
            height={1280}
          />
        </div>
      </div>
    </section>
  );
}

function CareTypes() {
  return (
    <section className="mx-auto max-w-7xl px-5 py-20 lg:px-10">
      <div className="max-w-3xl">
        <h2 className="font-serif text-4xl tracking-tight sm:text-5xl">Every kind of senior care, in one place.</h2>
        <p className="mt-4 text-xl text-muted-foreground">
          Start with what's needed today. Grow into more when the time comes — same account, same helpers when you want.
        </p>
      </div>
      <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {CARE_TYPES.map((t) => (
          <Link
            key={t.title}
            to={t.to}
            className="group surface-card flex flex-col p-6 transition-all hover:-translate-y-1 hover:shadow-lifted"
          >
            <div className="flex items-center gap-3">
              <span className="grid size-12 place-items-center rounded-2xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                <t.icon className="size-6" />
              </span>
              <h3 className="text-xl font-semibold">{t.title}</h3>
            </div>
            <p className="mt-4 text-base text-muted-foreground">{t.blurb}</p>
            <p className="mt-3 text-sm italic text-foreground/80">Best for: {t.who}</p>
            <div className="mt-4 border-t border-border pt-4">
              <span className="inline-flex items-center gap-1 text-sm font-semibold text-primary">
                Learn more <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

function Verification() {
  const checks = [
    { icon: BadgeCheck, title: "Identity", body: "Government ID matched to a live selfie at signup." },
    { icon: ShieldCheck, title: "Background", body: "National criminal + sex-offender records, refreshed monthly." },
    { icon: Check, title: "Credentials", body: "CNA, HHA, RN, and LPN licenses checked against state registries." },
    { icon: Repeat, title: "Continuous", body: "New issues surface within days — not once a year." },
    { icon: MapPin, title: "Visit-time", body: "Live selfie + GPS check-in at your door for every visit." },
  ];
  return (
    <section className="border-y border-border bg-warm-cream">
      <div className="mx-auto max-w-7xl px-5 py-20 lg:px-10">
        <div className="grid gap-10 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-base font-semibold text-primary">
              <ShieldCheck className="size-5" /> Verification, without the asterisk
            </span>
            <h2 className="mt-4 font-serif text-4xl tracking-tight sm:text-5xl">
              Five checks. No opt-outs. No fine print.
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Big listing sites let helpers skip background checks and hide it behind footnotes. Every CompanionCare helper clears all five — before their first visit and every month after.
            </p>
            <Link
              to="/trust"
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-base font-semibold text-primary-foreground shadow-soft hover:bg-primary/90"
            >
              Read the full playbook <ArrowRight className="size-4" />
            </Link>
          </div>
          <ul className="grid gap-3 lg:col-span-7">
            {checks.map((c, i) => (
              <li key={c.title} className="surface-card flex gap-4 p-5">
                <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground">
                  <c.icon className="size-5" />
                </span>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-primary">Check {i + 1}</p>
                  <p className="text-base font-semibold">{c.title}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{c.body}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

function Costs() {
  const bands = [
    { name: "Companionship", low: 20, high: 35 },
    { name: "Household Help", low: 25, high: 45 },
    { name: "Personal Care", low: 28, high: 50 },
    { name: "Dementia Care", low: 30, high: 55 },
    { name: "Respite Care", low: 25, high: 45 },
    { name: "Skilled Nursing", low: 45, high: 80 },
  ];
  return (
    <section className="mx-auto max-w-7xl px-5 py-20 lg:px-10">
      <div className="max-w-3xl">
        <span className="inline-flex items-center gap-2 rounded-full bg-accent/15 px-4 py-2 text-base font-semibold text-accent">
          <Wallet className="size-5" /> Real hourly rates
        </span>
        <h2 className="mt-4 font-serif text-4xl tracking-tight sm:text-5xl">
          What senior care actually costs.
        </h2>
        <p className="mt-4 text-xl text-muted-foreground">
          Nationwide typical ranges. Local rates vary — you'll see the exact rate on each helper's profile before you book, plus a single flat service fee.
        </p>
      </div>
      <ul className="mt-10 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {bands.map((b) => (
          <li key={b.name} className="surface-card p-5">
            <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">{b.name}</p>
            <p className="mt-1 font-serif text-3xl text-primary">
              ${b.low}–${b.high}
              <span className="ml-1 text-base text-muted-foreground">/hr</span>
            </p>
          </li>
        ))}
      </ul>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          to="/pricing"
          className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-base font-semibold text-primary-foreground shadow-soft hover:bg-primary/90"
        >
          Build a plan with real hours <ArrowRight className="size-4" />
        </Link>
        <Link
          to="/resources/cost-of-in-home-care"
          className="inline-flex items-center gap-2 rounded-full border-2 border-primary bg-card px-5 py-3 text-base font-semibold text-primary hover:bg-secondary"
        >
          Cost of in-home care guide
        </Link>
      </div>
    </section>
  );
}

function FamilyCollaboration() {
  return (
    <section className="border-y border-border bg-secondary/40">
      <div className="mx-auto max-w-7xl px-5 py-20 lg:px-10">
        <div className="grid gap-10 lg:grid-cols-12">
          <div className="lg:col-span-6">
            <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-base font-semibold text-primary">
              <Heart className="size-5" /> Senior-first, family-optional
            </span>
            <h2 className="mt-4 font-serif text-4xl tracking-tight sm:text-5xl">
              The senior decides who sees what.
            </h2>
            <p className="mt-4 text-xl text-muted-foreground">
              Most senior-care platforms are built for the adult child. CompanionCare is built for the person receiving care — with an easy way to invite family in when they want it.
            </p>
            <ul className="mt-6 grid gap-3">
              {[
                "The senior approves every family member and every visit.",
                "Choose what family sees: visits only, budget, or full details.",
                "Family can request changes; the senior approves or declines.",
                "No shadow bookings. No hidden logins. Consent can be revoked in one tap.",
              ].map((line) => (
                <li key={line} className="flex items-start gap-3 rounded-2xl border border-border bg-card p-4">
                  <Check className="mt-0.5 size-5 shrink-0 text-primary" />
                  <span className="text-base">{line}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="lg:col-span-6">
            <div className="surface-card p-6 md:p-8">
              <h3 className="text-xl font-semibold">For seniors on their own</h3>
              <p className="mt-2 text-base text-muted-foreground">
                No family nearby? No adult children involved? CompanionCare works perfectly as a solo tool — verified helpers, big-text mode, voice input on every field, and a 24/7 phone line for anything the app doesn't handle.
              </p>
              <div className="mt-6 border-t border-border pt-6">
                <h3 className="text-xl font-semibold">For families across the country</h3>
                <p className="mt-2 text-base text-muted-foreground">
                  Adult child in another state? Once the senior invites you in, you'll see who's been by, what got done, and how the budget is tracking — without hovering.
                </p>
              </div>
              <Link
                to="/for-families"
                className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-base font-semibold text-primary-foreground shadow-soft hover:bg-primary/90"
              >
                See the family view <ArrowRight className="size-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function StateDirectory() {
  return (
    <section className="mx-auto max-w-7xl px-5 py-16 lg:px-10">
      <h2 className="font-serif text-3xl tracking-tight sm:text-4xl">Senior care near you</h2>
      <p className="mt-2 text-lg text-muted-foreground">Choose your state to see local rates and what to expect.</p>
      <ul className="mt-8 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {STATES.map((name) => (
          <li key={name}>
            <Link
              to="/senior-care/$state"
              params={{ state: slug(name) }}
              className="flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2.5 text-sm font-medium hover:border-primary hover:bg-secondary"
            >
              <MapPin className="size-4 shrink-0 text-primary" />
              <span className="truncate">{name}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

function BottomCTA() {
  return (
    <section className="mx-auto max-w-7xl px-5 pb-20 lg:px-10">
      <div className="surface-card grid items-center gap-6 p-8 md:grid-cols-2 md:p-12">
        <div>
          <h2 className="font-serif text-4xl tracking-tight sm:text-5xl">Ready when you are.</h2>
          <p className="mt-3 text-lg text-muted-foreground">Start online, or call and we'll set it up with you.</p>
        </div>
        <div className="flex flex-col gap-3 md:items-end">
          <Link
            to="/auth"
            search={{ mode: "signup" }}
            className="group inline-flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-lg font-semibold text-primary-foreground shadow-soft hover:bg-primary/90"
          >
            Start your care plan <ArrowRight className="size-5 transition-transform group-hover:translate-x-1" />
          </Link>
          <a
            href={PHONE_HREF}
            className="inline-flex items-center justify-center gap-2 rounded-full border-2 border-primary bg-card px-6 py-3 text-lg font-semibold text-primary hover:bg-secondary"
          >
            <Phone className="size-5" /> Call {PHONE}
          </a>
        </div>
      </div>
    </section>
  );
}
