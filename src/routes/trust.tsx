import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  ShieldCheck,
  FileCheck2,
  BadgeCheck,
  Repeat,
  MapPin,
  Check,
  X,
  ChevronDown,
  Lock,
  Eye,
  Radio,
  type LucideIcon,
} from "lucide-react";
import {
  PageShell,
  PageHero,
  CTASection,
  marketingHead,
} from "@/components/marketing/PageShell";
import trustHero from "@/assets/trust-hero.jpg";
import trustPortrait from "@/assets/trust-portrait.jpg";

type CheckItem = {
  key: string;
  icon: LucideIcon;
  title: string;
  short: string;
  when: string;
  detail: string;
  vendor: string;
  frequency: string;
  disqualifiers: string[];
};

const checks: CheckItem[] = [
  {
    key: "identity",
    icon: FileCheck2,
    title: "Identity Proofing",
    short: "Government ID + live selfie, matched side-by-side.",
    when: "At signup, before any booking",
    detail:
      "Every helper submits a government-issued ID and a live selfie. Our provider matches them side-by-side — the same liveness technology used by banks — so the person applying is provably the person on the ID.",
    vendor: "Verified by Persona",
    frequency: "Once at signup, re-checked if info changes",
    disqualifiers: [
      "ID doesn't match the live selfie",
      "Document forgery flags",
      "Age below eligibility",
    ],
  },
  {
    key: "background",
    icon: ShieldCheck,
    title: "Multi-Jurisdiction Background Check",
    short: "National criminal + sex offender + multi-state records.",
    when: "Before first visit, refreshed yearly",
    detail:
      "Multi-state and federal criminal records, plus the national sex offender registry. Anything disqualifying removes the helper from CompanionCare before they ever accept a booking.",
    vendor: "Verified by Certn",
    frequency: "Pre-hire + annual refresh",
    disqualifiers: [
      "Violent felony convictions",
      "Elder-abuse or fraud history",
      "Active sex offender registry match",
    ],
  },
  {
    key: "credential",
    icon: BadgeCheck,
    title: "Credential & License Verification",
    short: "State board match for CNAs, HHAs, and skilled roles.",
    when: "For personal care and skilled roles",
    detail:
      "CNAs, HHAs, and skilled clinicians are checked against their state licensing board. Expired, suspended, or revoked licenses are flagged and the helper is paused immediately.",
    vendor: "State licensing registries",
    frequency: "Confirmed active before each booking",
    disqualifiers: [
      "License expired or lapsed",
      "Board suspension or revocation",
      "Sanction on the OIG exclusion list",
    ],
  },
  {
    key: "monitoring",
    icon: Repeat,
    title: "Continuous Monthly Re-Checks",
    short: "New charges & license changes surface within days.",
    when: "Every 30 days, for the life of the account",
    detail:
      "Background and license status is re-verified monthly — not once at signup. New charges, license changes, or registry updates surface within days. The date of every re-check appears on the helper's profile.",
    vendor: "Verified by Certn Continuous",
    frequency: "Every 30 days, indefinitely",
    disqualifiers: [
      "New criminal charge post-hire",
      "License lapse mid-engagement",
      "Registry addition of any kind",
    ],
  },
  {
    key: "arrival",
    icon: MapPin,
    title: "Live Visit Confirmation",
    short: "Selfie match + GPS ping at your door, every time.",
    when: "At the start of every single visit",
    detail:
      "The person at your door is the person you booked. We confirm with a live selfie match and a GPS ping at the arrival address — you see 'verified on arrival' before the visit begins.",
    vendor: "CompanionCare on-visit verification",
    frequency: "At the start of every visit",
    disqualifiers: [
      "Selfie mismatch at arrival",
      "GPS outside geofence",
      "Substituted helper without prior notice",
    ],
  },
];

const stats = [
  { value: "5", label: "Verification stages" },
  { value: "30", label: "Days between re-checks", suffix: " days" },
  { value: "100%", label: "Visits with live check-in" },
  { value: "1 day", label: "Support reply, guaranteed" },
];

const comparison: {
  feature: string;
  care: string | boolean;
  typical: string | boolean;
}[] = [
  { feature: "Government ID + live selfie match", care: true, typical: "Sometimes" },
  { feature: "National + multi-state background check", care: true, typical: true },
  { feature: "State license verified against issuing board", care: true, typical: "Rarely" },
  { feature: "Automated monthly re-checks (not annual)", care: true, typical: false },
  { feature: "Selfie + GPS check-in at every visit", care: true, typical: false },
  { feature: "Verification date visible on every profile", care: true, typical: false },
  { feature: "Access log for every record view", care: true, typical: false },
  { feature: "Safety reports jump the support queue", care: true, typical: "Same queue as billing" },
];

const faqs = [
  {
    q: "What happens if a helper's background check flags something after they're hired?",
    a: "The helper is paused from booking within hours of the flag surfacing. Any families with upcoming visits are notified before the next booking, and we help arrange a substitute if you want one.",
  },
  {
    q: "Who sees my verification records?",
    a: "You do — on your account, any time. CompanionCare staff access is limited to support and trust-and-safety roles, and every view is logged with a timestamp and reason. We never sell or share verification data.",
  },
  {
    q: "Can I request a specific verification level for my match?",
    a: "Yes. Skilled roles (CNA, HHA, LPN, RN) automatically require credential verification. For companion visits, you can require background + monthly re-checks as a filter when you match.",
  },
  {
    q: "What if the person who arrives isn't the person I booked?",
    a: "The live selfie match at arrival prevents this. If a substitution ever happens without prior notice from the helper, tap 'not the right person' in the app and the visit is cancelled with no charge — our team handles the rest.",
  },
];

export const Route = createFileRoute("/trust")({
  head: () =>
    marketingHead({
      path: "/trust",
      title: "Trust & Verification — How CompanionCare verifies every caregiver",
      description:
        "Every CompanionCare caregiver clears 5 verification stages: identity proofing, background check, credential verification, monthly re-checks, and live selfie + GPS check-in at every visit.",
      extraMeta: [
        { property: "og:image", content: "https://getcompanioncare.com/og-trust.jpg" },
        { name: "twitter:image", content: "https://getcompanioncare.com/og-trust.jpg" },
      ],
      jsonLd: [
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
  component: TrustPage,
});

function TrustPage() {
  return (
    <PageShell>
      <TrustHero />
      <StatStrip />
      <InteractiveStepper />
      <LiveMonitorSection />
      <VerifiedProfileDemo />
      <ComparisonTable />
      <PrivacySection />
      <ScopeDisclosure />
      <FAQSection />
      <CTASection title="Ready to see a verified match?" />
    </PageShell>
  );
}

function ScopeDisclosure() {
  return (
    <section className="border-y border-border bg-warm-cream/60 py-14">
      <div className="mx-auto max-w-3xl px-4 text-center">
        <h2 className="font-display text-3xl font-bold tracking-tight">What CompanionCare is — and isn't</h2>
        <p className="mt-4 text-base leading-relaxed text-muted-foreground">
          CompanionCare is a <strong>consumer marketplace</strong> that connects families with independent,
          verified caregivers for non-medical companion and personal care. We are <strong>not</strong> a
          home health agency, a medical provider, or a HIPAA-covered entity. We don't diagnose,
          prescribe, or provide clinical services.
        </p>
        <p className="mt-3 text-base leading-relaxed text-muted-foreground">
          For skilled nursing, physical therapy, or physician-ordered care, we refer families to
          Medicare-certified home health agencies through our Healthcare tier — those agencies operate
          under their own HIPAA and licensure obligations.
        </p>
        <p className="mt-3 text-sm text-muted-foreground">
          Your account and messages are encrypted in transit and at rest. Only you, your linked family
          members with permission, and your matched caregiver can see your care details.
        </p>
      </div>
    </section>
  );
}

/* -------------------------------- HERO -------------------------------- */

function TrustHero() {
  return (
    <section className="relative overflow-hidden border-b border-border bg-warm-cream">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 py-16 lg:grid-cols-[1.15fr_1fr] lg:gap-16 lg:px-10 lg:py-24">
        <div>
          <p className="text-sm font-semibold uppercase tracking-widest text-primary">
            Trust & verification
          </p>
          <h1 className="mt-3 font-serif text-4xl leading-[1.05] tracking-tight text-balance sm:text-5xl lg:text-6xl">
            Trust isn't in the{" "}
            <span className="relative inline-block">
              fine print.
              <span className="absolute inset-x-0 bottom-1 -z-10 h-3 bg-primary/20" aria-hidden />
            </span>{" "}
            It's the whole page.
          </h1>
          <p className="mt-6 max-w-xl text-xl text-muted-foreground text-pretty">
            Every helper clears the same five checks. You can see exactly what was
            verified — and when — on every profile, before every visit.
          </p>
          <div className="mt-8 flex flex-wrap gap-2">
            {checks.map((c) => (
              <span
                key={c.key}
                className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-3 py-1.5 text-sm font-medium text-primary"
              >
                <c.icon className="size-3.5" aria-hidden />
                {c.title.split(" ")[0]}
              </span>
            ))}
          </div>
        </div>
        <div className="relative">
          <div className="relative overflow-hidden rounded-3xl shadow-lifted">
            <img
              src={trustHero}
              alt="A caregiver's hands offered in gentle support"
              width={1024}
              height={1024}
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-tr from-foreground/30 via-transparent to-transparent" />
            <div className="absolute bottom-5 left-5 right-5 rounded-2xl bg-background/95 p-4 shadow-soft backdrop-blur">
              <div className="flex items-center gap-3">
                <span className="grid size-10 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
                  <ShieldCheck className="size-5" />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold">Verified on arrival</p>
                  <p className="truncate text-xs text-muted-foreground">
                    Selfie match + GPS ping · every single visit
                  </p>
                </div>
                <span className="ml-auto inline-flex h-2 w-2 shrink-0 animate-pulse rounded-full bg-primary" aria-hidden />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------ STAT STRIP ---------------------------- */

function StatStrip() {
  return (
    <section className="border-b border-border bg-background">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-px overflow-hidden bg-border px-0 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="bg-background px-6 py-8 text-center lg:px-10 lg:py-10">
            <p className="font-serif text-4xl tracking-tight text-primary lg:text-5xl">{s.value}</p>
            <p className="mt-2 text-sm text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ------------------------ INTERACTIVE STEPPER ------------------------- */

function InteractiveStepper() {
  const [active, setActive] = useState(0);
  const current = checks[active];

  return (
    <section className="mx-auto max-w-7xl px-5 py-20 lg:px-10 lg:py-28">
      <div className="max-w-2xl">
        <p className="text-sm font-semibold uppercase tracking-widest text-primary">
          The five checks
        </p>
        <h2 className="mt-3 font-serif text-3xl tracking-tight text-balance sm:text-4xl lg:text-5xl">
          Tap any stage to see exactly what happens.
        </h2>
      </div>

      <div className="mt-12 grid gap-8 lg:grid-cols-[minmax(0,340px)_1fr] lg:gap-14">
        {/* Rail */}
        <ol className="relative flex flex-col gap-2 lg:gap-3">
          <span
            className="absolute left-6 top-3 hidden h-[calc(100%-24px)] w-px bg-border lg:block"
            aria-hidden
          />
          {checks.map((c, i) => {
            const isActive = i === active;
            const Icon = c.icon;
            return (
              <li key={c.key}>
                <button
                  type="button"
                  onClick={() => setActive(i)}
                  aria-current={isActive ? "step" : undefined}
                  className={`group relative flex w-full items-center gap-4 rounded-2xl border p-4 text-left transition ${
                    isActive
                      ? "border-primary/40 bg-primary/5 shadow-soft"
                      : "border-border bg-card hover:border-primary/30 hover:bg-secondary/40"
                  }`}
                >
                  <span
                    className={`relative z-10 grid size-12 shrink-0 place-items-center rounded-full border font-serif text-lg transition ${
                      isActive
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-background text-foreground"
                    }`}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <Icon className="size-4 text-primary" aria-hidden />
                      <span className="text-sm font-semibold uppercase tracking-wider">
                        {c.title.split(" ").slice(0, 2).join(" ")}
                      </span>
                    </span>
                    <span className="mt-1 block text-sm text-muted-foreground">{c.short}</span>
                  </span>
                </button>
              </li>
            );
          })}
        </ol>

        {/* Detail panel */}
        <div
          key={current.key}
          className="surface-card animate-in fade-in slide-in-from-bottom-2 duration-300 relative overflow-hidden p-8 lg:p-10"
        >
          <span className="absolute right-6 top-6 font-serif text-7xl leading-none text-primary/10 lg:text-8xl" aria-hidden>
            {String(active + 1).padStart(2, "0")}
          </span>
          <div className="relative">
            <div className="flex items-center gap-3">
              <span className="grid size-12 place-items-center rounded-2xl bg-primary/10 text-primary">
                <current.icon className="size-6" aria-hidden />
              </span>
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  {current.when}
                </p>
                <h3 className="mt-0.5 font-serif text-2xl tracking-tight lg:text-3xl">
                  {current.title}
                </h3>
              </div>
            </div>
            <p className="mt-6 text-lg text-foreground/90">{current.detail}</p>

            <dl className="mt-8 grid gap-4 border-t border-border pt-6 sm:grid-cols-2">
              <div>
                <dt className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  Verified by
                </dt>
                <dd className="mt-1 text-base font-medium">{current.vendor}</dd>
              </div>
              <div>
                <dt className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  How often
                </dt>
                <dd className="mt-1 text-base font-medium">{current.frequency}</dd>
              </div>
            </dl>

            <div className="mt-6">
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                Disqualifies a helper
              </p>
              <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                {current.disqualifiers.map((d) => (
                  <li key={d} className="flex items-start gap-2 text-sm">
                    <X className="mt-0.5 size-4 shrink-0 text-destructive" aria-hidden />
                    <span>{d}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="relative mt-8 flex items-center justify-between border-t border-border pt-6">
            <button
              type="button"
              onClick={() => setActive((i) => Math.max(0, i - 1))}
              disabled={active === 0}
              className="rounded-full border border-border bg-background px-4 py-2 text-sm font-semibold hover:bg-secondary disabled:opacity-40"
            >
              ← Previous
            </button>
            <p className="text-xs text-muted-foreground">
              {active + 1} / {checks.length}
            </p>
            <button
              type="button"
              onClick={() => setActive((i) => Math.min(checks.length - 1, i + 1))}
              disabled={active === checks.length - 1}
              className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-40"
            >
              Next check →
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------------------- LIVE MONITORING VISUAL ------------------------ */

function LiveMonitorSection() {
  const days = 30;
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => (t + 1) % days), 180);
    return () => clearInterval(id);
  }, []);

  const bars = useMemo(
    () =>
      Array.from({ length: days }, (_, i) => ({
        h: 30 + ((i * 37) % 70),
        flagged: i === 11 || i === 23,
      })),
    [],
  );

  return (
    <section className="bg-foreground text-background">
      <div className="mx-auto grid max-w-7xl gap-12 px-5 py-20 lg:grid-cols-2 lg:gap-16 lg:px-10 lg:py-28">
        <div>
          <p className="text-sm font-semibold uppercase tracking-widest text-primary-foreground/70">
            Continuous monitoring
          </p>
          <h2 className="mt-3 font-serif text-3xl leading-tight tracking-tight text-balance sm:text-4xl lg:text-5xl">
            A one-time check ages. Ours runs every 30 days — for life.
          </h2>
          <p className="mt-6 max-w-lg text-lg text-background/80">
            The moment a helper's status changes anywhere in the country — new charge,
            license lapse, registry update — we know within days. If it's disqualifying,
            they're paused before their next visit.
          </p>
          <div className="mt-8 grid gap-3">
            {[
              { icon: Radio, text: "24/7 registry & court record monitoring" },
              { icon: Lock, text: "License board sync before every skilled booking" },
              { icon: Eye, text: "Verification date printed on every helper profile" },
            ].map((row) => (
              <div key={row.text} className="flex items-center gap-3 text-base">
                <span className="grid size-10 shrink-0 place-items-center rounded-full bg-primary/20 text-primary-foreground">
                  <row.icon className="size-4" aria-hidden />
                </span>
                {row.text}
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-background/10 bg-background/5 p-6 lg:p-8">
          <div className="flex items-center justify-between text-xs uppercase tracking-widest text-background/60">
            <span>Rolling 30-day monitor · preview</span>
            <span className="inline-flex items-center gap-1.5">
              <span className="size-1.5 animate-pulse rounded-full bg-primary-foreground" />
              Live at launch
            </span>
          </div>

          <div className="mt-6 flex h-40 items-end gap-1.5">
            {bars.map((b, i) => {
              const isCursor = i === tick;
              return (
                <span
                  key={i}
                  aria-hidden
                  style={{ height: `${b.h}%` }}
                  className={`flex-1 rounded-sm transition-colors ${
                    b.flagged
                      ? "bg-amber-400"
                      : isCursor
                      ? "bg-primary-foreground"
                      : "bg-background/25"
                  }`}
                />
              );
            })}
          </div>
          <div className="mt-3 flex justify-between text-[10px] uppercase tracking-widest text-background/50">
            <span>Day 1</span>
            <span>Day 15</span>
            <span>Day 30 · refresh</span>
          </div>

          <div className="mt-6 grid gap-2 border-t border-background/10 pt-6 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-background/70">Registry &amp; court records</span>
              <span className="font-semibold">Scanned continuously</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-background/70">License boards</span>
              <span className="font-semibold">Synced before skilled visits</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-background/70">If a flag surfaces</span>
              <span className="font-semibold">Helper paused before next visit</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* -------------------- VERIFIED PROFILE DEMO --------------------------- */

function VerifiedProfileDemo() {
  return (
    <section className="mx-auto max-w-7xl px-5 py-20 lg:px-10 lg:py-28">
      <div className="grid gap-12 lg:grid-cols-[1fr_1.1fr] lg:gap-16">
        <div>
          <p className="text-sm font-semibold uppercase tracking-widest text-primary">
            What you see on a profile
          </p>
          <h2 className="mt-3 font-serif text-3xl tracking-tight text-balance sm:text-4xl lg:text-5xl">
            Every badge shows what, when, and by whom.
          </h2>
          <p className="mt-6 max-w-lg text-lg text-muted-foreground">
            No mystery green checkmarks. Tap any badge on a helper's profile and you'll see the
            check type, the date it happened, and the verifier — plus the next refresh date.
          </p>
          <ul className="mt-6 space-y-3 text-base">
            {[
              "Verification dates on the profile, not hidden in a policy page",
              "Every record access is logged — you can request the audit trail",
              "Refresh cadence for every check, visible up-front",
            ].map((line) => (
              <li key={line} className="flex items-start gap-3">
                <Check className="mt-1 size-4 shrink-0 text-primary" aria-hidden />
                <span>{line}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="surface-card overflow-hidden p-0">
          <div className="flex items-center gap-4 border-b border-border p-6">
            <img
              src={trustPortrait}
              alt="Portrait of a verified caregiver"
              width={1024}
              height={1024}
              loading="lazy"
              className="size-16 shrink-0 rounded-full object-cover"
            />
            <div className="min-w-0">
              <p className="font-serif text-xl">Sample helper profile</p>
              <p className="text-sm text-muted-foreground">
                CNA · This is what you'll see when you tap a match
              </p>
            </div>
            <span className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              <ShieldCheck className="size-3.5" /> Verified
            </span>
          </div>
          <div className="divide-y divide-border">
            {checks.map((c, i) => (
              <ProfileBadgeRow key={c.key} check={c} date={sampleDate(i)} />
            ))}
          </div>
          <div className="border-t border-border bg-secondary/40 px-6 py-4 text-xs text-muted-foreground">
            Every access to this record is logged. The helper sees every view.
          </div>
        </div>
      </div>
    </section>
  );
}

function ProfileBadgeRow({ check, date }: { check: CheckItem; date: string }) {
  const [open, setOpen] = useState(false);
  const Icon = check.icon;
  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center gap-3 px-6 py-4 text-left hover:bg-secondary/30"
      >
        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
          <Icon className="size-4" aria-hidden />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold">{check.title}</span>
          <span className="block text-xs text-muted-foreground">Verified {date}</span>
        </span>
        <ChevronDown
          className={`size-4 shrink-0 text-muted-foreground transition-transform ${
            open ? "rotate-180" : ""
          }`}
          aria-hidden
        />
      </button>
      {open && (
        <div className="border-t border-border bg-secondary/20 px-6 py-4 text-sm">
          <p className="text-foreground">{check.detail}</p>
          <div className="mt-3 flex flex-wrap gap-4 text-xs text-muted-foreground">
            <span>
              <span className="font-semibold text-foreground">By:</span> {check.vendor}
            </span>
            <span>
              <span className="font-semibold text-foreground">Cadence:</span> {check.frequency}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

function sampleDate(i: number) {
  const base = new Date(2026, 5, 24);
  base.setDate(base.getDate() - i * 3);
  return base.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

/* ------------------------- COMPARISON TABLE --------------------------- */

function ComparisonTable() {
  return (
    <section className="border-y border-border bg-warm-cream">
      <div className="mx-auto max-w-6xl px-5 py-20 lg:px-10 lg:py-24">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-widest text-primary">
            How we compare
          </p>
          <h2 className="mt-3 font-serif text-3xl tracking-tight text-balance sm:text-4xl lg:text-5xl">
            The details most agencies leave out.
          </h2>
        </div>

        <div className="mt-10 overflow-hidden rounded-3xl border border-border bg-card">
          <div className="grid grid-cols-[1.4fr_1fr_1fr] items-center gap-2 border-b border-border bg-secondary/40 px-4 py-3 text-xs font-bold uppercase tracking-widest text-muted-foreground sm:px-6 sm:py-4">
            <span>What you get</span>
            <span className="text-center text-primary">CompanionCare</span>
            <span className="text-center">Typical agency</span>
          </div>
          <ul>
            {comparison.map((row, i) => (
              <li
                key={row.feature}
                className={`grid grid-cols-[1.4fr_1fr_1fr] items-center gap-2 px-4 py-4 text-sm sm:px-6 sm:text-base ${
                  i % 2 === 0 ? "bg-background" : "bg-secondary/20"
                }`}
              >
                <span className="font-medium">{row.feature}</span>
                <span className="flex justify-center">
                  <ComparisonCell value={row.care} tone="care" />
                </span>
                <span className="flex justify-center">
                  <ComparisonCell value={row.typical} tone="typical" />
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

function ComparisonCell({
  value,
  tone,
}: {
  value: string | boolean;
  tone: "care" | "typical";
}) {
  if (value === true) {
    return (
      <span
        className={`inline-flex size-8 items-center justify-center rounded-full ${
          tone === "care" ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground"
        }`}
      >
        <Check className="size-4" aria-hidden />
      </span>
    );
  }
  if (value === false) {
    return (
      <span className="inline-flex size-8 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <X className="size-4" aria-hidden />
      </span>
    );
  }
  return (
    <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
      {value}
    </span>
  );
}

/* ---------------------------- PRIVACY --------------------------------- */

function PrivacySection() {
  const cards = [
    {
      icon: Lock,
      title: "Encrypted end-to-end",
      body: "Verification records, messages, and visit notes are encrypted in transit and at rest.",
    },
    {
      icon: Eye,
      title: "Every access is logged",
      body: "Staff views are timestamped with a reason code. You can request the audit trail any time.",
    },
    {
      icon: ShieldCheck,
      title: "You control sharing",
      body: "Records don't leave CompanionCare. We never sell verification data or share with advertisers.",
    },
  ];
  return (
    <section className="mx-auto max-w-7xl px-5 py-20 lg:px-10 lg:py-24">
      <div className="max-w-2xl">
        <p className="text-sm font-semibold uppercase tracking-widest text-primary">
          Privacy by default
        </p>
        <h2 className="mt-3 font-serif text-3xl tracking-tight text-balance sm:text-4xl lg:text-5xl">
          Verification data belongs to you.
        </h2>
      </div>
      <div className="mt-10 grid gap-4 md:grid-cols-3">
        {cards.map((c) => (
          <div key={c.title} className="surface-card p-6">
            <span className="grid size-11 place-items-center rounded-2xl bg-primary/10 text-primary">
              <c.icon className="size-5" aria-hidden />
            </span>
            <p className="mt-4 font-serif text-xl">{c.title}</p>
            <p className="mt-2 text-base text-muted-foreground">{c.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ------------------------------- FAQ ---------------------------------- */

function FAQSection() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section className="border-t border-border bg-background">
      <div className="mx-auto max-w-4xl px-5 py-20 lg:px-10 lg:py-24">
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-primary">
            Common questions
          </p>
          <h2 className="mt-3 font-serif text-3xl tracking-tight text-balance sm:text-4xl lg:text-5xl">
            What families ask us most.
          </h2>
        </div>
        <ul className="mt-10 divide-y divide-border border-y border-border">
          {faqs.map((f, i) => {
            const isOpen = open === i;
            return (
              <li key={f.q}>
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : i)}
                  aria-expanded={isOpen}
                  className="flex w-full items-center gap-6 py-6 text-left"
                >
                  <span className="flex-1 font-serif text-xl tracking-tight sm:text-2xl">
                    {f.q}
                  </span>
                  <span
                    className={`grid size-10 shrink-0 place-items-center rounded-full border border-border transition ${
                      isOpen ? "rotate-45 border-primary bg-primary text-primary-foreground" : ""
                    }`}
                    aria-hidden
                  >
                    <span className="text-2xl leading-none">+</span>
                  </span>
                </button>
                {isOpen && (
                  <div className="pb-8 pr-16 text-lg text-muted-foreground text-pretty">
                    {f.a}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
