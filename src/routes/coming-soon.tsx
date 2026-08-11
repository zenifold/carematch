import { createFileRoute } from "@tanstack/react-router";
import { ArrowDown, Check, X } from "lucide-react";

import { InterestForms } from "@/components/marketing/InterestForms";
import { TextSizeControl } from "@/components/marketing/TextSizeControl";
import { SITE_URL, SUPPORT_EMAIL, SUPPORT_EMAIL_HREF } from "@/components/marketing/PageShell";
import { STATE_AVAILABILITY, isStateOpen } from "@/lib/state-availability";
import { tierByKey } from "@/lib/pricing-tiers";
import heroImage from "@/assets/hero.jpg";
import handsTea from "@/assets/hands-tea.jpg";

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
 * Content order is the reader's journey: what this is, what you can ask for,
 * how it works, who else gets a say, where we operate, then the ask. The
 * rollout precedes the form because coverage is the reason to leave details.
 *
 * Service names, blurbs and rates render from src/lib/pricing-tiers.ts. Do not
 * retype them here; that is how the homepage FAQ drifted to wrong numbers.
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
      // Belt and braces with the X-Robots-Tag the gate sets, in case this page
      // is ever reached directly.
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

/** The six most-asked-for services. Names, blurbs and rates come from TIERS. */
const FEATURED_SERVICES = [
  "companionship",
  "errands",
  "transport",
  "mealprep",
  "cleaning",
  "personal",
];

/**
 * The contrast that makes the product worth caring about. Left column is what
 * families already know, so it needs no evidence; right column describes
 * mechanisms that exist in the product today.
 */
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
    ours: "The helper's hourly rate and your total, before you book",
  },
  {
    usual: "Packages and minimum hours",
    ours: "Two hours on a Tuesday, if that is all you need",
  },
];

const STEPS = [
  {
    n: 1,
    title: "Tell us what would help",
    body: "One question per screen, in plain words. Type it or say it out loud. About ten minutes, at your pace, and you can stop and come back.",
  },
  {
    n: 2,
    title: "Meet your matches",
    body: "Real profiles: who they are, what they do, what they charge, and what we checked. You decide who to message, and you can meet before anyone starts.",
  },
  {
    n: 3,
    title: "Book, then keep who you like",
    body: "Pick your hours and confirm. After the visit you get a short note about how it went, and rebooking the same person takes one tap.",
  },
];

/**
 * What's true today, stated as fact. No percentages, no borrowed proof: the
 * homepage already commits to not doing that, and a pre-launch page is the
 * worst place to break it.
 */
const TRUE_TODAY = [
  {
    term: "Who decides",
    detail:
      "The older adult, always. Family can propose visits and be given scoped access to view, change or pay, but the senior grants it and can revoke it in one tap. No bookings happen behind anyone's back.",
  },
  {
    // Process, not cadence or vendor: verification is manual today
    // (BACKGROUND_CHECK_VENDOR and IDV_VENDOR are both "manual").
    term: "How helpers are checked",
    detail:
      "Five ways before anyone can take a visit: who they say they are, a national background check, credentials against state registries, a re-check while they stay active, and a photo match at your door. We do this by hand right now, and we will say so plainly when that changes.",
  },
  {
    // No subscription claim: whether a paid membership exists is recorded as an
    // explicitly undecided product fact.
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
  return (
    <div className="min-h-dvh bg-background text-foreground">
      {/* Wordmark plus the text-size control. No public nav, because every other
          destination is gated; the staff entrance lives in the footer. */}
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-5 py-4 lg:px-8">
          <span className="font-serif text-xl font-bold tracking-tight">CompanionCare</span>
          <TextSizeControl />
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-5 lg:px-8">
        {/* Beat 1: the thesis is the mechanism. */}
        <section className="border-b border-border py-14 lg:py-20">
          <p className="text-sm font-bold uppercase tracking-[0.12em] text-primary">
            Opening in Virginia
          </p>
          <h1 className="mt-4 font-serif text-[clamp(2.25rem,7vw,3.75rem)] font-semibold leading-[1.05] tracking-tight text-balance">
            Choose the person who comes to your door.
          </h1>

          <div className="mt-7 max-w-[62ch] space-y-4 text-xl leading-relaxed text-pretty">
            <p>
              CompanionCare is a marketplace for help at home: a friendly visit, a clean kitchen, a
              ride to the doctor, a hand with bathing. You browse local helpers, see what each one
              charges, and pick who comes and when.
            </p>
            <p>
              Not an agency sending a stranger from a roster. You choose, and you can keep choosing
              the same person for as long as you both want.
            </p>
          </div>

          <img
            src={heroImage}
            alt="An older woman and her helper talking together at home"
            width={1200}
            height={675}
            loading="eager"
            className="mt-9 aspect-[16/9] w-full rounded-2xl object-cover shadow-soft"
          />

          <a
            href="#interest"
            className="mt-9 inline-flex min-h-12 items-center gap-2 rounded-full bg-primary px-6 text-lg font-semibold text-primary-foreground hover:bg-primary/90"
          >
            Tell us where you are
            <ArrowDown className="size-5" aria-hidden />
          </a>
          <p className="mt-3 text-base text-muted-foreground">
            We are not open yet. Two questions, about thirty seconds.
          </p>
        </section>

        {/* Beat 2: the contrast. Genuinely comparison-shaped, so it is a table. */}
        <section className="border-b border-border py-14 lg:py-16">
          <h2 className="font-serif text-3xl tracking-tight text-balance">
            What makes this different
          </h2>
          <p className="mt-2 max-w-[62ch] text-lg text-muted-foreground text-pretty">
            If you have arranged care before, you already know the left column.
          </p>

          <ul className="mt-8 space-y-4">
            {CONTRAST.map((row) => (
              <li key={row.usual} className="grid gap-2 sm:grid-cols-2 sm:gap-6">
                <p className="flex items-start gap-2.5 text-lg text-muted-foreground">
                  <X className="mt-1.5 size-4 shrink-0" aria-hidden />
                  <span>{row.usual}</span>
                </p>
                <p className="flex items-start gap-2.5 text-lg font-medium">
                  <Check className="mt-1.5 size-4 shrink-0 text-primary" aria-hidden />
                  <span>{row.ours}</span>
                </p>
              </li>
            ))}
          </ul>
        </section>

        {/* Beat 3: what you can actually ask for, with real numbers. */}
        <section className="border-b border-border py-14 lg:py-16">
          <h2 className="font-serif text-3xl tracking-tight text-balance">What you can ask for</h2>
          <p className="mt-2 max-w-[62ch] text-lg text-muted-foreground text-pretty">
            Rates are what helpers in this range charge per hour. You will always see the full
            total, including our fee, before anything is booked.
          </p>

          <dl className="mt-8 divide-y divide-border border-y border-border">
            {FEATURED_SERVICES.map((key) => {
              const tier = tierByKey(key);
              return (
                <div
                  key={tier.key}
                  className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 py-4"
                >
                  <div className="min-w-0">
                    <dt className="text-lg font-semibold">{tier.name}</dt>
                    <dd className="text-base text-muted-foreground">{tier.blurb}</dd>
                  </div>
                  <dd className="text-lg font-medium tabular-nums">
                    ${tier.providerLow}&ndash;${tier.providerHigh}
                    <span className="text-base font-normal text-muted-foreground">/hr</span>
                  </dd>
                </div>
              );
            })}
          </dl>

          <p className="mt-5 text-base text-muted-foreground">
            Also tech help, small repairs, and skilled nursing through licensed partners. Personal
            care is delivered by a state-licensed agency in states that require one.
          </p>
        </section>

        {/* Beat 4: how it works. */}
        <section className="border-b border-border py-14 lg:py-16">
          <h2 className="font-serif text-3xl tracking-tight text-balance">How it will work</h2>
          <ol className="mt-8 space-y-8">
            {STEPS.map((step) => (
              <li key={step.n} className="grid gap-2 sm:grid-cols-[3rem_minmax(0,1fr)] sm:gap-5">
                <span aria-hidden className="font-serif text-3xl leading-none text-primary sm:pt-1">
                  {step.n}
                </span>
                <div>
                  <h3 className="font-serif text-xl tracking-tight">{step.title}</h3>
                  <p className="mt-1.5 max-w-[58ch] text-lg text-muted-foreground text-pretty">
                    {step.body}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        {/* Beat 5: the consent model, which is the differentiator for both the
            senior and the adult child, and the reason each can relax. */}
        <section className="border-b border-border py-14 lg:py-16">
          <div className="grid gap-8 sm:grid-cols-[minmax(0,1fr)_minmax(0,0.8fr)] sm:items-center">
            <div>
              <h2 className="font-serif text-3xl tracking-tight text-balance">
                Family can help without taking over
              </h2>
              <div className="mt-4 max-w-[58ch] space-y-4 text-lg text-pretty">
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
            <img
              src={handsTea}
              alt="An older woman and her helper sharing tea at a kitchen table"
              width={800}
              height={800}
              loading="lazy"
              className="aspect-square w-full rounded-2xl object-cover shadow-soft"
            />
          </div>
        </section>

        {/* Beat 6: the rollout, from the same source as
            /legal/state-availability, so the two can never disagree. */}
        <section className="border-b border-border py-14 lg:py-16">
          <h2 className="font-serif text-3xl tracking-tight">Where we are today</h2>
          <p className="mt-2 max-w-[62ch] text-lg text-muted-foreground text-pretty">
            Live in Virginia, and building in the Carolinas and Tennessee. Coverage depends on state
            licensing and on how many verified helpers we have nearby rather than on ambition, so
            this list stays short until each one is genuinely ready.
          </p>

          <ul className="mt-8 divide-y divide-border border-y border-border">
            {STATE_AVAILABILITY.map((row) => {
              const open = isStateOpen(row);
              return (
                <li
                  key={row.code}
                  className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 py-3.5"
                >
                  <span className="flex items-baseline gap-3">
                    <span className="text-lg font-medium">{row.state}</span>
                    <span className="text-sm tabular-nums text-muted-foreground">{row.code}</span>
                  </span>
                  {/* Text carries the status, not colour alone. */}
                  <span
                    className={`text-base ${open ? "font-semibold text-primary" : "text-muted-foreground"}`}
                  >
                    {open
                      ? row.partners === "partner" || row.health === "partner"
                        ? "Open, some care via partner"
                        : "Open for companionship and household help"
                      : "In progress"}
                  </span>
                </li>
              );
            })}
          </ul>

          <p className="mt-5 text-base text-muted-foreground">
            Somewhere else entirely? That is the most useful thing you can tell us. Where people ask
            from is how we choose what opens after these.
          </p>
        </section>

        {/* Beat 7: the ask. */}
        <section id="interest" className="scroll-mt-6 border-b border-border py-14 lg:py-16">
          <h2 className="font-serif text-3xl tracking-tight text-balance">
            Tell us where you are.
          </h2>
          <p className="mt-2 max-w-[62ch] text-lg text-muted-foreground text-pretty">
            Leave your details and we will write when it is your turn. That is the whole offer.
            Nothing to buy, nothing to install, and a real person reads every one of these.
          </p>
          <InterestForms />
        </section>

        {/* Beat 8: the trust close. */}
        <section className="py-14 lg:py-16">
          <h2 className="font-serif text-3xl tracking-tight">What you can hold us to</h2>
          <dl className="mt-8 space-y-7">
            {TRUE_TODAY.map((item) => (
              <div
                key={item.term}
                className="grid gap-1.5 sm:grid-cols-[13rem_minmax(0,1fr)] sm:gap-6"
              >
                <dt className="text-sm font-bold uppercase tracking-[0.12em] text-primary sm:pt-2">
                  {item.term}
                </dt>
                <dd className="max-w-[58ch] text-lg leading-relaxed text-pretty">{item.detail}</dd>
              </div>
            ))}
          </dl>
        </section>
      </main>

      <footer className="border-t border-border bg-secondary/40">
        <div className="mx-auto flex max-w-3xl flex-col gap-3 px-5 py-9 text-base text-muted-foreground lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <p>© {new Date().getFullYear()} CompanionCare</p>
          {/* /legal/privacy and /legal/terms are allowlisted through the gate
              precisely because this page collects personal data. min-h-11 to
              clear the 44px touch floor. */}
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
