import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  HandHeart,
  UserCheck,
  Check,
  Phone,
  ShieldCheck,
  MessageCircle,
  MapPin,
  Mic,
  Clock,
  ArrowRight,
  Camera,
  Loader2,
  BellRing,
  RotateCcw,
} from "lucide-react";

import {
  PageShell,
  PageHero,
  CTASection,
  marketingHead,
  PHONE,
  PHONE_HREF,
  SITE_URL,
} from "@/components/marketing/PageShell";
import step1Img from "@/assets/hiw-step1.jpg";
import step2Img from "@/assets/hiw-step2.jpg";
import step3Img from "@/assets/hiw-step3.jpg";
import conciergeImg from "@/assets/hiw-concierge.jpg";

const steps = [
  {
    name: "Tell us what you need",
    text: "One question at a time — care type, hours, preferences, budget. Use voice input on any field, or call our concierge and we'll do intake with you on the phone.",
    icon: HandHeart,
    image: step1Img,
    highlights: [
      { icon: Mic, label: "Voice input on every field" },
      { icon: Phone, label: "Or call — we'll do it with you" },
      { icon: Clock, label: "About 10 minutes, at your pace" },
    ],
  },
  {
    name: "Meet your verified matches",
    text: "See up to five nearby helpers who match your needs. Every profile shows a full verification report: ID proofing, background check, credentials, and monthly re-checks.",
    icon: UserCheck,
    image: step2Img,
    highlights: [
      { icon: ShieldCheck, label: "5-stage verification, refreshed monthly" },
      { icon: MapPin, label: "Local helpers, near your address" },
      { icon: MessageCircle, label: "Message before you book" },
    ],
  },
  {
    name: "Book, verify, and stay in control",
    text: "Every visit starts with a live selfie + GPS check-in. You'll see 'verified on arrival' before the helper rings the bell — and a simple recap afterward.",
    icon: Check,
    image: step3Img,
    highlights: [
      { icon: Check, label: "Live selfie + GPS at the door" },
      { icon: MessageCircle, label: "Optional family updates" },
      { icon: Phone, label: "Concierge on standby 24/7" },
    ],
  },
];

export const Route = createFileRoute("/how-it-works")({
  head: () =>
    marketingHead({
      path: "/how-it-works",
      title: "How CompanionCare Works — 3 steps from need to verified visit",
      description:
        "How CompanionCare matches you with verified in-home caregivers in 3 steps: tell us what you need, meet verified matches, and book with live check-in on every visit.",
      jsonLd: {
        "@context": "https://schema.org",
        "@type": "HowTo",
        name: "How to book verified in-home care with CompanionCare",
        description:
          "Three steps to book a verified in-home helper for an older adult: intake, matching, and booking with live check-in.",
        totalTime: "PT10M",
        step: steps.map((s, i) => ({
          "@type": "HowToStep",
          position: i + 1,
          name: s.name,
          text: s.text,
          url: `${SITE_URL}/how-it-works#step-${i + 1}`,
        })),
      },
    }),
  component: HowItWorksPage,
});

type Step = (typeof steps)[number];

function HowItWorksPage() {
  return (
    <PageShell>
      <PageHero
        eyebrow="How it works"
        title="From first question to verified visit — in three simple steps."
        lead="No apps to learn. No fine print. Do it online, or call our concierge and we'll walk through it together on the phone."
      />

      <StepNavigator />

      <div className="mx-auto flex max-w-7xl flex-col gap-32 px-5 pb-24 pt-8 lg:gap-40 lg:px-10">
        <StepEditorial step={steps[0]} index="01" reverse={false} />
        <StepEditorial step={steps[1]} index="02" reverse={true} />
        <StepEditorial step={steps[2]} index="03" reverse={false} />
      </div>

      <ArrivalSimulator />


      <section className="relative overflow-hidden border-y border-border bg-secondary/40">
        <div className="mx-auto max-w-6xl px-5 py-20 lg:px-10 lg:py-24">
          <div className="mb-14 max-w-2xl">
            <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.2em] text-primary/70">
              Every visit
            </p>
            <h2 className="font-serif text-4xl tracking-tight sm:text-5xl">
              What happens the moment your helper arrives
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              The same four things happen on every single visit — no exceptions, no fine print.
            </p>
          </div>
          <ul className="grid gap-4 md:grid-cols-2">
            {[
              {
                icon: ShieldCheck,
                title: "Live selfie + GPS check-in",
                text: "The person at your door is the person you booked. Confirmed by liveness selfie and GPS at the arrival address.",
              },
              {
                icon: MessageCircle,
                title: "Real-time updates for family",
                text: "If you invite them, family members see check-ins, notes, and photos — with your consent, revocable anytime.",
              },
              {
                icon: Check,
                title: "Simple recap after each visit",
                text: "Tap one of three faces: great / okay / needs review. That's it. Concerns escalate to our concierge within minutes.",
              },
              {
                icon: Phone,
                title: "Human concierge, 24/7",
                text: "Prefer to talk? Every step of CompanionCare can be done by phone with the same team you already know.",
              },
            ].map((f) => (
              <li key={f.title} className="surface-card p-6">
                <f.icon className="size-7 text-primary" aria-hidden />
                <h3 className="mt-3 text-xl font-semibold">{f.title}</h3>
                <p className="mt-2 text-base text-muted-foreground">{f.text}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-24 lg:px-10">
        <div className="relative overflow-hidden rounded-[2rem] bg-primary px-8 py-16 text-primary-foreground md:px-14 md:py-20">
          <span
            aria-hidden
            className="pointer-events-none absolute right-6 top-0 select-none font-serif text-[10rem] italic leading-none text-primary-foreground/[0.08] md:text-[14rem]"
          >
            24/7
          </span>
          <div className="relative z-10 grid grid-cols-1 items-center gap-12 md:grid-cols-12">
            <div className="md:col-span-5">
              <div className="relative aspect-square overflow-hidden rounded-xl bg-primary-foreground/10">
                <img
                  src={conciergeImg}
                  alt="A CompanionCare concierge on the phone in a softly lit home office"
                  loading="lazy"
                  width={1024}
                  height={1024}
                  className="absolute inset-0 h-full w-full object-cover"
                />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-primary/60 via-primary/10 to-transparent" />
                <div className="absolute bottom-4 left-4 rounded-full border border-primary-foreground/30 bg-primary-foreground/15 p-3 backdrop-blur">
                  <Phone className="size-5 text-primary-foreground" strokeWidth={1.5} aria-hidden />
                </div>
              </div>
            </div>
            <div className="md:col-span-7">
              <p className="mb-6 text-[11px] font-semibold uppercase tracking-[0.2em] text-primary-foreground/60">
                Prefer to talk?
              </p>
              <h2 className="mb-4 font-serif text-4xl font-medium md:text-5xl">
                A real person is always a call away.
              </h2>
              <p className="mb-8 max-w-xl text-lg leading-relaxed text-primary-foreground/85">
                Every step of CompanionCare can be done by phone with the same friendly team — intake,
                matching, booking, changes, or just a question. Day or night.
              </p>
              <div className="flex flex-wrap items-center gap-6">
                <a
                  href={PHONE_HREF}
                  className="inline-flex items-center gap-2 rounded-full bg-primary-foreground px-8 py-3.5 font-semibold text-primary transition-colors hover:bg-primary-foreground/90"
                >
                  <Phone className="size-5" /> Call {PHONE}
                </a>
                <Link
                  to="/trust"
                  className="inline-flex items-center gap-2 font-semibold text-primary-foreground/90 hover:text-primary-foreground"
                >
                  <span className="border-b border-primary-foreground/40 py-1">
                    See the 5-stage verification
                  </span>
                  <ArrowRight className="size-4" aria-hidden />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <CTASection />
    </PageShell>
  );
}

function StepEditorial({
  step,
  index,
  reverse,
}: {
  step: Step;
  index: string;
  reverse: boolean;
}) {
  const Icon = step.icon;
  return (
    <section
      id={`step-${Number(index)}`}
      className="group grid grid-cols-1 items-center gap-12 md:grid-cols-12 md:gap-16"
    >
      <div className={`md:col-span-6 ${reverse ? "md:order-2" : "md:order-1"}`}>
        <div className="relative">
          <span
            aria-hidden
            className="pointer-events-none absolute -left-6 -top-16 select-none font-serif text-[10rem] italic leading-none text-primary/[0.06] md:text-[12rem]"
          >
            {index}
          </span>
          <p className="mb-6 text-[11px] font-semibold uppercase tracking-[0.2em] text-primary/70">
            Step {Number(index)}
          </p>
          <h2 className="mb-6 font-serif text-5xl font-medium text-foreground md:text-6xl">
            {step.name}
          </h2>
          <p className="mb-10 max-w-md text-lg leading-relaxed text-foreground/80">{step.text}</p>
          <ul className="space-y-4">
            {step.highlights.map((h) => {
              const HIcon = h.icon;
              return (
                <li key={h.label} className="flex items-start gap-4">
                  <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-full border border-primary/15 bg-primary/5 text-primary">
                    <HIcon className="size-4" strokeWidth={1.75} aria-hidden />
                  </span>
                  <span className="pt-1.5 text-base text-foreground/85">{h.label}</span>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
      <div className={`md:col-span-6 ${reverse ? "md:order-1" : "md:order-2"}`}>
        <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-primary/5">
          <img
            src={step.image}
            alt={`Step ${Number(index)} — ${step.name}`}
            loading="lazy"
            width={1024}
            height={1280}
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-primary/25 via-transparent to-transparent" />
          <div className="absolute bottom-5 left-5 rounded-full border border-primary-foreground/30 bg-background/80 p-3 backdrop-blur">
            <Icon className="size-5 text-primary" strokeWidth={1.5} aria-hidden />
          </div>
          <div className="absolute right-5 top-5 rounded-full bg-background/85 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.15em] text-primary backdrop-blur">
            Step {Number(index)} of 3
          </div>
        </div>
      </div>
    </section>
  );
}

function StepNavigator() {
  const [active, setActive] = useState(1);

  useEffect(() => {
    const els = [1, 2, 3]
      .map((i) => document.getElementById(`step-${i}`))
      .filter((e): e is HTMLElement => !!e);
    if (!els.length) return;
    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) {
          const idx = Number(visible.target.id.replace("step-", ""));
          if (idx) setActive(idx);
        }
      },
      { rootMargin: "-40% 0px -40% 0px", threshold: [0.1, 0.5, 1] },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  const jump = (i: number) => {
    const el = document.getElementById(`step-${i}`);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="sticky top-16 z-30 border-y border-border bg-background/85 backdrop-blur">
      <nav
        aria-label="Steps"
        className="mx-auto flex max-w-7xl items-stretch gap-1 overflow-x-auto px-5 lg:px-10"
      >
        {steps.map((s, i) => {
          const idx = i + 1;
          const on = active === idx;
          return (
            <button
              key={s.name}
              onClick={() => jump(idx)}
              className={`group relative flex min-w-[220px] flex-1 items-center gap-3 py-4 text-left transition-colors ${
                on ? "text-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
              aria-current={on ? "step" : undefined}
            >
              <span
                className={`grid size-8 shrink-0 place-items-center rounded-full border font-serif text-sm transition-colors ${
                  on
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-background"
                }`}
              >
                0{idx}
              </span>
              <span className="truncate text-sm font-semibold">{s.name}</span>
              <span
                className={`absolute inset-x-0 bottom-0 h-0.5 transition-transform duration-300 ${
                  on ? "bg-primary scale-x-100" : "bg-transparent scale-x-0"
                }`}
              />
            </button>
          );
        })}
      </nav>
    </div>
  );
}

type ArrivalStage = 0 | 1 | 2 | 3 | 4;

function ArrivalSimulator() {
  const [stage, setStage] = useState<ArrivalStage>(0);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    if (!running) return;
    if (stage >= 4) {
      setRunning(false);
      return;
    }
    const t = setTimeout(() => setStage((s) => (s + 1) as ArrivalStage), 1400);
    return () => clearTimeout(t);
  }, [running, stage]);

  const start = () => {
    setStage(0);
    setRunning(true);
  };
  const reset = () => {
    setRunning(false);
    setStage(0);
  };

  const stages = [
    { icon: MapPin, label: "Helper approaching your address", detail: "GPS check begins at 0.1 mi." },
    { icon: Camera, label: "Live selfie captured", detail: "Face match against verified ID." },
    { icon: ShieldCheck, label: "Identity confirmed", detail: "Selfie + GPS both match. Green light." },
    { icon: BellRing, label: "Verified on arrival", detail: "You get a notification before the doorbell." },
  ];

  return (
    <section className="border-y border-border bg-background">
      <div className="mx-auto max-w-6xl px-5 py-20 lg:px-10 lg:py-24">
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary/70">
              Try it — arrival verification
            </p>
            <h2 className="mt-3 font-serif text-4xl tracking-tight sm:text-5xl">
              See exactly what happens before the doorbell rings.
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
              Every CompanionCare visit starts with a live selfie plus GPS at the arrival address —
              matched against the helper's verified ID before you're notified they're at the door.
              Press play to run the check in real time.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <button
                onClick={start}
                disabled={running}
                className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-base font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
              >
                {running ? (
                  <>
                    <Loader2 className="size-5 animate-spin" /> Verifying…
                  </>
                ) : stage === 4 ? (
                  <>
                    <RotateCcw className="size-5" /> Run again
                  </>
                ) : (
                  <>
                    <ShieldCheck className="size-5" /> Simulate arrival
                  </>
                )}
              </button>
              {stage > 0 && !running && (
                <button
                  onClick={reset}
                  className="inline-flex items-center gap-2 rounded-full border border-border px-6 py-3 text-base font-semibold hover:bg-secondary"
                >
                  Reset
                </button>
              )}
            </div>
          </div>

          <div className="lg:col-span-7">
            <div className="relative overflow-hidden rounded-3xl border border-border bg-secondary/40 p-6 md:p-8">
              <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className={`size-2.5 rounded-full ${
                      stage === 4 ? "bg-primary" : running ? "bg-amber-500 animate-pulse" : "bg-muted-foreground/40"
                    }`}
                  />
                  <span className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">
                    {stage === 4 ? "Verified" : running ? "In progress" : "Ready"}
                  </span>
                </div>
                <span className="font-mono text-xs text-muted-foreground">
                  Visit #A47829 · 2:00 PM
                </span>
              </div>

              <ol className="space-y-3">
                {stages.map((s, i) => {
                  const idx = i + 1;
                  const done = stage >= idx;
                  const current = running && stage + 1 === idx;
                  const SIcon = s.icon;
                  return (
                    <li
                      key={s.label}
                      className={`flex items-start gap-4 rounded-2xl border p-4 transition-all duration-500 ${
                        done
                          ? "border-primary/30 bg-primary/5"
                          : current
                            ? "border-amber-500/40 bg-amber-500/5"
                            : "border-border bg-background/60 opacity-60"
                      }`}
                    >
                      <span
                        className={`grid size-11 shrink-0 place-items-center rounded-full transition-colors ${
                          done
                            ? "bg-primary text-primary-foreground"
                            : current
                              ? "bg-amber-500 text-white"
                              : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {current ? (
                          <Loader2 className="size-5 animate-spin" />
                        ) : done ? (
                          <Check className="size-5" strokeWidth={2.5} />
                        ) : (
                          <SIcon className="size-5" strokeWidth={1.75} />
                        )}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-base font-semibold">{s.label}</p>
                        <p className="text-sm text-muted-foreground">{s.detail}</p>
                      </div>
                      <span className="mt-1 font-mono text-[11px] text-muted-foreground">
                        {done ? `2:0${i}` : "—"}
                      </span>
                    </li>
                  );
                })}
              </ol>

              {stage === 4 && (
                <div className="mt-5 flex items-center gap-3 rounded-2xl border border-primary/30 bg-primary/10 px-5 py-4 animate-fade-in">
                  <ShieldCheck className="size-6 text-primary" />
                  <div>
                    <p className="font-semibold text-primary">Verified on arrival</p>
                    <p className="text-sm text-muted-foreground">
                      The person at your door is the person you booked.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

