import { createFileRoute } from "@tanstack/react-router";
import { ArrowDown, Check, X } from "lucide-react";

import { InterestForms } from "@/components/marketing/InterestForms";
import { TextSizeControl } from "@/components/marketing/TextSizeControl";
import { SITE_URL, SUPPORT_EMAIL, SUPPORT_EMAIL_HREF } from "@/components/marketing/PageShell";
import { STATE_AVAILABILITY, isStateOpen } from "@/lib/state-availability";
import { tierByKey } from "@/lib/pricing-tiers";
import heroImage from "@/assets/hero.jpg";
import handsTea from "@/assets/hands-tea.jpg";
import caregiverPlants from "@/assets/caregiver-plants.jpg";

/**
 * Pre-launch landing page. Every public marketing route redirects here while
 * COMING_SOON=1 (see src/lib/coming-soon-gate.ts).
 *
 * Deliberately does NOT use PageShell: SiteHeader's nav offers How it works,
 * Services, Pricing and Get started, all of which are gated, so every link
 * would bounce the visitor back here. It also uses plain <a> rather than <Link>
 * throughout, because a hard navigation is re-evaluated by the gate while a
 * client-side <Link> would render a gated route straight out of the bundle.
 *
 * Visual language is the site's own (src/routes/index.tsx and styles.css):
 * warm-cream gradients, surface-card, the sage/terracotta pair, Fraunces at
 * full size, hover-lift on things you can act on. An earlier version opted out
 * of all of that and read like a different company.
 *
 * Motion is deliberately near-absent. The audience is older adults, the product
 * ships a reduce-motion preference, and boldness here comes from type, colour
 * and density rather than movement.
 *
 * Service names, blurbs and rates render from src/lib/pricing-tiers.ts. Do not
 * retype them; that is how the homepage FAQ drifted to wrong numbers.
 *
 * Voice follows / and /about: candid about being new. No testimonials, no
 * metrics, no verification automation we haven't built. See PRODUCT.md.
 */

export const Route = createFileRoute("/coming-soon")({
  head: () => ({
    meta: [
      { title: "CompanionCare: choose the person who comes to your door" },
      {
        name: "description",
        content:
          "A marketplace for in-home help for older adults. Browse local helpers, see their rate, pick who comes and when. Opening in Virginia, with the Carolinas and Tennessee next.",
      },
      { name: "robots", content: "noindex, nofollow, noarchive" },
      { property: "og:title", content: "CompanionCare: choose the person who comes to your door" },
      {
        property: "og:description",
        content: "In-home help for older adults, chosen by the person receiving it.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: `${SITE_URL}/coming-soon` },
    ],
  }),
  component: ComingSoonPage,
});

const FEATURED_SERVICES = [
  "companionship",
  "errands",
  "transport",
  "mealprep",
  "cleaning",
  "personal",
];

const CONTRAST = [
  {
    usual: "An agency sends whoever is on shift",
    ours: "You read profiles and pick the person yourself",
  },
  {
    usual: "A different face every week",
    ours: "Rebook the helper you liked, as often as you want",
  },
  {
    usual: "An invoice that arrives later",
    ours: "The helper's rate and your total, before you book",
  },
  {
    usual: "Packages and minimum hours",
    ours: "Two hours on a Tuesday, if that is all you need",
  },
];

const STEPS = [
  {
    title: "Tell us what would help",
    body: "One question per screen, in plain words. Type it or say it out loud. About ten minutes, at your pace, and you can stop and come back.",
  },
  {
    title: "Meet your matches",
    body: "Real profiles: who they are, what they do, what they charge, and what we checked. You decide who to message, and you can meet before anyone starts.",
  },
  {
    title: "Book, then keep who you like",
    body: "Pick your hours and confirm. After the visit you get a short note about how it went, and rebooking the same person takes one tap.",
  },
];

const TRUE_TODAY = [
  {
    term: "Who decides",
    detail:
      "The older adult, always. Family can propose visits and be given scoped access to view, change or pay, but the senior grants it and can revoke it in one tap. No bookings happen behind anyone's back.",
  },
  {
    // Process, not cadence or vendor: verification is manual today.
    term: "How helpers are checked",
    detail:
      "Five ways before anyone can take a visit: who they say they are, a national background check, credentials against state registries, a re-check while they stay active, and a photo match at your door. We do this by hand right now, and we will say so plainly when that changes.",
  },
  {
    // No subscription claim: that is an explicitly undecided product fact.
    term: "What it costs",
    detail:
      "Helpers set their own hourly rate. We add a service fee of 15 to 18 percent and show you one total before you book, charged per completed visit rather than up front. You set a spending cap, and it is a limit rather than a commitment.",
  },
  {
    term: "What we are not",
    detail:
      "Not a home care agency. Personal care in licensed states is delivered by partner agencies, and skilled nursing is referred to Medicare-certified providers who bill you directly. We will tell you which one you are dealing with, every time.",
  },
];

function ComingSoonPage() {
  const openStates = STATE_AVAILABILITY.filter(isStateOpen);
  const comingStates = STATE_AVAILABILITY.filter((s) => !isStateOpen(s));

  return (
    <div className="min-h-dvh overflow-x-hidden bg-background text-foreground">
      <header className="border-b border-border/60 bg-background/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-4 lg:px-10">
          <span className="font-serif text-2xl font-bold tracking-tight">CompanionCare</span>
          <TextSizeControl />
        </div>
      </header>

      <main>
        {/* Hero. No eyebrow above the headline: the heading carries itself, and
            the "opening in Virginia" fact belongs with the rollout. */}
        <section className="relative overflow-hidden border-b border-border">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-warm-cream via-background to-background"
          />
          <div className="mx-auto grid max-w-6xl gap-12 px-5 pb-16 pt-14 lg:grid-cols-12 lg:px-10 lg:pb-24 lg:pt-20">
            <div className="lg:col-span-7">
              <h1 className="font-serif text-[clamp(2.5rem,7vw,4.5rem)] font-semibold leading-[1.02] tracking-[-0.03em] text-balance">
                Choose the person who comes to your door.
              </h1>

              <div className="mt-8 max-w-[62ch] space-y-5 text-xl leading-relaxed text-pretty sm:text-[1.375rem]">
                <p>
                  CompanionCare is a marketplace for help at home: a friendly visit, a clean
                  kitchen, a ride to the doctor, a hand with bathing. You browse local helpers, see
                  what each one charges, and pick who comes and when.
                </p>
                <p className="text-muted-foreground">
                  Not an agency sending a stranger from a roster. You choose, and you can keep
                  choosing the same person for as long as you both want.
                </p>
              </div>

              <a
                href="#interest"
                className="group mt-10 inline-flex min-h-14 items-center justify-center gap-2.5 rounded-full bg-primary px-8 text-lg font-semibold text-primary-foreground shadow-lifted transition-all hover:bg-primary/90 hover:shadow-soft"
              >
                Tell us where you are
                <ArrowDown
                  className="size-5 transition-transform group-hover:translate-y-0.5"
                  aria-hidden
                />
              </a>
            </div>

            <div className="lg:col-span-5">
              <div className="relative">
                <img
                  src={heroImage}
                  alt="An older woman and her helper talking together at home"
                  width={1000}
                  height={1000}
                  loading="eager"
                  className="aspect-square w-full rounded-3xl object-cover shadow-lifted"
                />
                {/* The accent, spent once and deliberately: the one fact a
                    visitor most needs is where we actually operate. */}
                {/* Ink rather than accent-foreground: white on terracotta
                    measures 2.57:1, ink on terracotta 6.44:1. */}
                <p className="absolute -bottom-5 left-5 right-5 rounded-2xl bg-accent px-5 py-4 text-center text-lg font-semibold text-foreground shadow-lifted sm:left-8 sm:right-8">
                  Open in {openStates.map((s) => s.state).join(", ")}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* The contrast. Sage surface so the "ours" column reads as the answer. */}
        <section className="border-b border-border bg-secondary/40">
          <div className="mx-auto max-w-6xl px-5 py-16 lg:px-10 lg:py-24">
            <h2 className="max-w-3xl font-serif text-4xl tracking-tight text-balance sm:text-5xl">
              You have arranged care before. You know the left column.
            </h2>

            <ul className="mt-12 grid gap-4">
              {CONTRAST.map((row) => (
                <li
                  key={row.usual}
                  className="grid items-center gap-3 rounded-2xl bg-card p-5 shadow-soft sm:grid-cols-2 sm:gap-8 sm:p-6"
                >
                  <p className="flex items-start gap-3 text-lg text-muted-foreground">
                    <X className="mt-1 size-5 shrink-0" aria-hidden />
                    <span>{row.usual}</span>
                  </p>
                  <p className="flex items-start gap-3 text-lg font-semibold">
                    <Check className="mt-1 size-5 shrink-0 text-primary" aria-hidden />
                    <span>{row.ours}</span>
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Services. The rate leads, because a number is the most reassuring
            thing on a page about buying care. */}
        <section className="border-b border-border">
          <div className="mx-auto max-w-6xl px-5 py-16 lg:px-10 lg:py-24">
            <div className="max-w-3xl">
              <h2 className="font-serif text-4xl tracking-tight text-balance sm:text-5xl">
                What you can ask for
              </h2>
              <p className="mt-5 text-xl text-muted-foreground text-pretty">
                These are what helpers in this range charge per hour. You always see the full total,
                our fee included, before anything is booked.
              </p>
            </div>

            <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {FEATURED_SERVICES.map((key) => {
                const tier = tierByKey(key);
                return (
                  <div
                    key={tier.key}
                    className="surface-card flex flex-col p-7 transition-all hover:-translate-y-1 hover:shadow-lifted"
                  >
                    <p className="font-serif text-3xl tabular-nums tracking-tight">
                      ${tier.providerLow}
                      <span className="text-muted-foreground">–</span>${tier.providerHigh}
                      <span className="ml-1 font-sans text-base font-normal text-muted-foreground">
                        /hr
                      </span>
                    </p>
                    <h3 className="mt-4 text-xl font-semibold">{tier.name}</h3>
                    <p className="mt-1.5 text-base text-muted-foreground text-pretty">
                      {tier.blurb}
                    </p>
                  </div>
                );
              })}
            </div>

            <p className="mt-8 max-w-[62ch] text-base text-muted-foreground">
              Also tech help, small repairs, and skilled nursing through licensed partners. Personal
              care is delivered by a state-licensed agency in states that require one.
            </p>
          </div>
        </section>

        {/* Steps. Numbers earn their place here: the order is the information. */}
        <section className="border-b border-border bg-secondary/40">
          <div className="mx-auto max-w-6xl px-5 py-16 lg:px-10 lg:py-24">
            <h2 className="max-w-3xl font-serif text-4xl tracking-tight text-balance sm:text-5xl">
              How it will work
            </h2>
            <ol className="mt-12 grid gap-6 lg:grid-cols-3">
              {STEPS.map((step, i) => (
                <li key={step.title} className="rounded-2xl bg-card p-7 shadow-soft">
                  <span
                    aria-hidden
                    className="grid size-12 place-items-center rounded-full bg-primary font-serif text-2xl text-primary-foreground"
                  >
                    {i + 1}
                  </span>
                  <h3 className="mt-5 font-serif text-2xl tracking-tight">{step.title}</h3>
                  <p className="mt-2 text-lg text-secondary-foreground/80 text-pretty">
                    {step.body}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Family. Image at full strength, text given room. */}
        <section className="border-b border-border">
          <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 py-16 lg:grid-cols-2 lg:px-10 lg:py-24">
            <img
              src={handsTea}
              alt="An older woman and her helper sharing tea at a kitchen table"
              width={900}
              height={700}
              loading="lazy"
              className="aspect-[4/3] w-full rounded-3xl object-cover shadow-lifted lg:order-2"
            />
            <div className="lg:order-1">
              <h2 className="font-serif text-4xl tracking-tight text-balance sm:text-5xl">
                Family can help without taking over.
              </h2>
              <div className="mt-6 max-w-[58ch] space-y-4 text-xl leading-relaxed text-pretty">
                <p>
                  A daughter three states away can suggest a visit, follow along, and pick up the
                  bill. What she cannot do is arrange anything without you knowing.
                </p>
                <p className="text-muted-foreground">
                  You choose what she sees and what she can change, one piece at a time, and you can
                  switch any of it off in a single tap. If you would rather handle everything
                  yourself, that works too, and nothing about the product assumes otherwise.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Rollout. Open states get the card treatment and the accent dot; the
            rest stay quiet, so the shape of the list carries the message. */}
        <section className="border-b border-border bg-secondary/40">
          <div className="mx-auto max-w-6xl px-5 py-16 lg:px-10 lg:py-24">
            <div className="max-w-3xl">
              <h2 className="font-serif text-4xl tracking-tight text-balance sm:text-5xl">
                Where we are today
              </h2>
              <p className="mt-5 text-xl text-muted-foreground text-pretty">
                Coverage depends on state licensing and on how many verified helpers we have nearby
                rather than on ambition, so this list stays short until each one is genuinely ready.
              </p>
            </div>

            <div className="mt-12 grid gap-8 lg:grid-cols-2">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-[0.12em] text-primary">
                  Open now
                </h3>
                <ul className="mt-4 space-y-3">
                  {openStates.map((row) => (
                    <li
                      key={row.code}
                      className="surface-card flex flex-wrap items-baseline gap-x-4 p-6"
                    >
                      <span
                        className="size-2.5 shrink-0 translate-y-[-2px] rounded-full bg-accent"
                        aria-hidden
                      />
                      <span className="font-serif text-3xl tracking-tight">{row.state}</span>
                      <span className="text-lg text-muted-foreground">
                        Companionship and household help
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                {/* Full opacity: at /70 this measured 3.86:1 against the sage
                    surface, under the 4.5 floor. */}
                <h3 className="text-sm font-bold uppercase tracking-[0.12em] text-secondary-foreground">
                  Building now
                </h3>
                <ul className="mt-4 divide-y divide-border rounded-2xl border border-border bg-card/60">
                  {comingStates.map((row) => (
                    <li
                      key={row.code}
                      className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 px-6 py-4"
                    >
                      <span className="text-xl font-medium">{row.state}</span>
                      <span className="text-base text-muted-foreground">In progress</span>
                    </li>
                  ))}
                </ul>
                <p className="mt-5 text-base text-muted-foreground">
                  Somewhere else entirely? That is the most useful thing you can tell us. Where
                  people ask from is how we choose what opens after these.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* The ask. Sits on card over the warm ground so it reads as the
            destination the whole page has been walking toward. */}
        <section id="interest" className="scroll-mt-4 border-b border-border bg-warm-cream">
          <div className="mx-auto max-w-4xl px-5 py-16 lg:px-10 lg:py-24">
            <div className="max-w-2xl">
              <h2 className="font-serif text-4xl tracking-tight text-balance sm:text-5xl">
                Tell us where you are.
              </h2>
              <p className="mt-5 text-xl text-muted-foreground text-pretty">
                Leave your details and we will write when it is your turn. That is the whole offer.
                Nothing to buy, nothing to install, and a real person reads every one of these.
              </p>
            </div>
            <div className="surface-card mt-10 p-6 sm:p-10">
              <InterestForms />
            </div>
          </div>
        </section>

        {/* The trust close. */}
        <section className="border-b border-border">
          <div className="mx-auto grid max-w-6xl gap-12 px-5 py-16 lg:grid-cols-12 lg:px-10 lg:py-24">
            <div className="lg:col-span-5">
              <h2 className="font-serif text-4xl tracking-tight text-balance sm:text-5xl">
                What you can hold us to
              </h2>
              <img
                src={caregiverPlants}
                alt="A helper watering plants in an older adult's home"
                width={800}
                height={600}
                loading="lazy"
                className="mt-8 hidden aspect-[4/3] w-full rounded-3xl object-cover shadow-soft lg:block"
              />
            </div>
            <dl className="space-y-9 lg:col-span-7">
              {TRUE_TODAY.map((item) => (
                <div key={item.term}>
                  <dt className="font-serif text-2xl tracking-tight text-primary">{item.term}</dt>
                  <dd className="mt-2 max-w-[62ch] text-lg leading-relaxed text-pretty">
                    {item.detail}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </section>
      </main>

      <footer className="bg-secondary/40">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-5 py-10 text-base text-muted-foreground lg:flex-row lg:items-center lg:justify-between lg:px-10">
          <p>© {new Date().getFullYear()} CompanionCare</p>
          {/* /legal/privacy and /legal/terms are allowlisted through the gate
              precisely because this page collects personal data. */}
          <nav className="flex flex-wrap items-center gap-x-6">
            <a
              href="/legal/privacy"
              className="inline-flex min-h-11 items-center hover:text-primary"
            >
              Privacy
            </a>
            <a href="/legal/terms" className="inline-flex min-h-11 items-center hover:text-primary">
              Terms
            </a>
            <a
              href={SUPPORT_EMAIL_HREF}
              className="inline-flex min-h-11 items-center hover:text-primary"
            >
              {SUPPORT_EMAIL}
            </a>
            <a href="/employee" className="inline-flex min-h-11 items-center hover:text-primary">
              Employee portal
            </a>
          </nav>
        </div>
      </footer>
    </div>
  );
}
