import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ShoppingCart,
  Car,
  Home,
  Wrench,
  Smartphone,
  PawPrint,
  MessageCircle,
  Utensils,
  Pill,
  Check,
  ShieldCheck,
  Star,
  Clock,
  Heart,
  Sparkles,
  UserCheck,
  MapPin,
  Camera,
  Phone,
  CalendarDays,
  DollarSign,
  ArrowRight,
} from "lucide-react";
import { PageShell, PageHero, CTASection, marketingHead, SITE_URL, PHONE, PHONE_HREF } from "@/components/marketing/PageShell";

const examples = [
  { icon: ShoppingCart, name: "Grocery & errands", blurb: "Weekly shopping, curbside pickup, groceries unpacked and put away — even the heavy stuff." },
  { icon: Car, name: "Rides & appointments", blurb: "A friendly driver to the doctor, pharmacy, salon, or bank — and a waiting hand at the curb." },
  { icon: Home, name: "House cleaning & laundry", blurb: "Weekly tidying, seasonal deep cleans, fresh linens, and floors that feel like home again." },
  { icon: MessageCircle, name: "Friendly visits", blurb: "Conversation over coffee, a walk around the block, cards on the porch — company that shows up." },
  { icon: Utensils, name: "Meal prep", blurb: "Shop the list, cook the favorites, portion for the week, and leave the kitchen better than they found it." },
  { icon: Pill, name: "Medication reminders", blurb: "A gentle, non-clinical prompt at the right time — plus a quick text home to say all's well." },
  { icon: Wrench, name: "Handyman & yard", blurb: "Lightbulbs, smoke alarms, sticky drawers, and lawn edges — small fixes that keep the home safe." },
  { icon: Smartphone, name: "Tech help", blurb: "Setting up FaceTime with the grandkids, Wi-Fi that finally works, and phones that stop misbehaving." },
  { icon: PawPrint, name: "Pet care", blurb: "Walks, feedings, vet trips, and grooming — because the dog is family, too." },
];

const benefits = [
  { icon: Star, title: "You choose the person", body: "Read real profiles, see rates, watch a short intro video, and pick the helper who feels right." },
  { icon: ShieldCheck, title: "Verified before day one", body: "ID confirmed, background checked, references called, and re-checked every month they stay on the platform." },
  { icon: Clock, title: "Book by the hour, no contracts", body: "One visit or every Tuesday morning — you decide. Reschedule or cancel free up to 24 hours before." },
  { icon: Heart, title: "Consistency you can feel", body: "We prioritize the same helper week after week, so trust builds and the home stays predictable." },
];

const verificationSteps = [
  { icon: UserCheck, title: "Government ID + selfie match", body: "Every helper completes a live selfie check tied to a scanned government ID." },
  { icon: ShieldCheck, title: "Multi-state background check", body: "Criminal, sex offender registry, and identity screens — refreshed on a rolling basis." },
  { icon: MapPin, title: "Address & work history", body: "Seven-year address history and reference calls before a first booking." },
  { icon: Camera, title: "Live check-in each visit", body: "Selfie + GPS at the door so you always know your helper arrived — and left safely." },
];

const sampleWeek = [
  { day: "Mon", task: "Groceries + kitchen tidy", hours: 3 },
  { day: "Tue", task: "Friendly visit + walk", hours: 2 },
  { day: "Wed", task: "—", hours: 0 },
  { day: "Thu", task: "Rides to doctor + pharmacy", hours: 3 },
  { day: "Fri", task: "Laundry + meal prep", hours: 3 },
  { day: "Sat", task: "—", hours: 0 },
  { day: "Sun", task: "Sunday call + light tidy", hours: 2 },
];

const compare = [
  {
    name: "Marketplace",
    to: "/services/marketplace",
    tag: "Everyday help",
    price: "Set by each helper",
    scope: "Errands, cleaning, meals, rides, company, tech help",
    verify: "5-stage verification, monthly re-checks",
    current: true,
  },
  {
    name: "Partners",
    to: "/services/partners",
    tag: "Personal care",
    price: "Agency rates",
    scope: "Bathing, transfers, dressing, hands-on care",
    verify: "Licensed local agencies we vet",
    current: false,
  },
  {
    name: "Healthcare",
    to: "/services/healthcare",
    tag: "Skilled care",
    price: "Often insurance-covered",
    scope: "Nursing, PT/OT, wound care, therapy",
    verify: "Medicare-certified providers",
    current: false,
  },
];

const scenarios = [
  {
    title: "For Grandma who lives alone",
    body: "A Tuesday morning cleaning, a Thursday afternoon grocery run, and a Sunday walk — always with the same familiar face.",
  },
  {
    title: "For the daughter three states away",
    body: "Real-time updates when your mom's helper arrives, a quick note after every visit, and a phone we always answer.",
  },
  {
    title: "For Dad who's just home from the hospital",
    body: "A few weeks of extra hands: laundry, meals, and rides to follow-ups — while he gets his strength back.",
  },
];

const steps = [
  { n: "1", title: "Tell us what would help", body: "Share your ZIP, a few tasks, and the days that would matter most. Takes 3 minutes." },
  { n: "2", title: "Meet your matches", body: "See 3–5 verified helpers nearby, with photos, rates, and honest reviews. Choose the one who feels right." },
  { n: "3", title: "Book the first visit", body: "Pick a day and time. The helper confirms. You'll know the total before you pay — no surprises." },
  { n: "4", title: "Keep the same person", body: "If it clicks, we lock in that helper for a standing schedule. If it doesn't, we rematch — no fees." },
];

const faqs = [
  {
    q: "How is CompanionCare different from a big-name care app?",
    a: "You see the exact person before you book — not just a category. Every provider is verified continuously, not just once at sign-up. And a real person answers our phone, day or night.",
  },
  {
    q: "What if the first match isn't right?",
    a: "Say the word and we'll match you with someone else — no fees, no awkward conversations. Fit matters, and we'd rather you find the right person than the first person.",
  },
  {
    q: "Do providers bring their own supplies?",
    a: "Most cleaning and cooking helpers use what's already in the home (older adults usually prefer their familiar products). You can also request eco-friendly or unscented options when booking.",
  },
  {
    q: "Can I add family members to see visits and messages?",
    a: "Yes. Invite a spouse, sibling, or adult child to your family dashboard — they'll see visit confirmations, updates from the helper, and messages, always with your loved one's permission.",
  },
  {
    q: "How is payment handled?",
    a: "You pay through CompanionCare after each visit — no cash, no checks. Rates are set by each helper and shown up front, so the total you see before booking is the total you pay.",
  },
  {
    q: "What if something goes wrong during a visit?",
    a: "Tap 'Get help' in the app or call our line — a real person picks up 24/7. Every visit is logged with a check-in and check-out, and we can dispatch a backup helper if needed.",
  },
];

export const Route = createFileRoute("/services/marketplace")({
  head: () =>
    marketingHead({
      path: "/services/marketplace",
      title: "CompanionCare Marketplace — Verified local helpers for older adults",
      description:
        "Meet, choose, and book verified local helpers for errands, rides, cleaning, companionship, meal prep, tech help, and more. Transparent hourly rates, the same helper week after week, and a real person on the phone 24/7.",
      jsonLd: [
        {
          "@context": "https://schema.org",
          "@type": "Service",
          name: "CompanionCare Marketplace",
          serviceType: "In-home non-medical help for older adults",
          areaServed: { "@type": "Country", name: "United States" },
          provider: { "@type": "Organization", name: "CompanionCare", url: SITE_URL },
          url: `${SITE_URL}/services/marketplace`,
          description:
            "Verified independent providers offering errands, rides, cleaning, companionship, meal prep, medication reminders, tech help, and pet care to older adults at home.",
          offers: { "@type": "AggregateOffer", priceCurrency: "USD", lowPrice: "20", highPrice: "45" },
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
  component: MarketplacePage,
});

function MarketplacePage() {
  return (
    <PageShell>
      <PageHero
        eyebrow="CompanionCare Marketplace"
        title="A trusted helper for the everyday — matched to your loved one."
        lead="Groceries, rides, tidying, meals, company. Pick a verified local helper by name and face, book by the hour, and keep the same friendly person week after week."
      >
        <div className="flex flex-col gap-3 sm:flex-row">
          <Link
            to="/auth"
            search={{ mode: "signup" }}
            className="inline-flex items-center justify-center rounded-full bg-primary px-6 py-3 text-base font-semibold text-primary-foreground shadow-soft hover:bg-primary/90"
          >
            Find a helper
          </Link>
          <a
            href={PHONE_HREF}
            className="inline-flex items-center justify-center gap-2 rounded-full border-2 border-primary bg-card px-6 py-3 text-base font-semibold text-primary hover:bg-secondary"
          >
            <Phone className="size-5" /> Call {PHONE}
          </a>
        </div>
      </PageHero>

      {/* Trust bar */}
      <section className="border-b border-border bg-card">
        <div className="mx-auto grid max-w-6xl gap-4 px-5 py-6 sm:grid-cols-2 lg:grid-cols-4 lg:px-10">
          {[
            { icon: ShieldCheck, label: "5-stage verification" },
            { icon: DollarSign, label: "Transparent hourly rates" },
            { icon: CalendarDays, label: "No contracts, cancel free" },
            { icon: Phone, label: "Real person 24/7" },
          ].map((t) => (
            <div key={t.label} className="flex items-center gap-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
                <t.icon className="size-5" aria-hidden />
              </span>
              <p className="text-base font-semibold">{t.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Benefits */}
      <section className="mx-auto max-w-6xl px-5 py-16 lg:px-10">
        <h2 className="font-serif text-3xl sm:text-4xl">Why families choose the marketplace</h2>
        <p className="mt-3 max-w-3xl text-lg text-muted-foreground">
          Booking help at home shouldn't feel like hiring a stranger. It should feel like meeting someone your neighbor already trusts.
        </p>
        <ul className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {benefits.map((b) => (
            <li key={b.title} className="surface-card p-6">
              <span className="grid size-12 place-items-center rounded-2xl bg-primary/10 text-primary">
                <b.icon className="size-6" aria-hidden />
              </span>
              <h3 className="mt-4 text-lg font-semibold">{b.title}</h3>
              <p className="mt-2 text-base text-muted-foreground">{b.body}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* Services on offer with rate ranges */}
      <section className="border-y border-border bg-warm-cream">
        <div className="mx-auto max-w-6xl px-5 py-16 lg:px-10">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="font-serif text-3xl sm:text-4xl">What a CompanionCare helper can do</h2>
              <p className="mt-3 max-w-3xl text-lg text-muted-foreground">
                Every helper picks the tasks they're best at and sets their own rate, shown before you book — no surprise fees.
              </p>
            </div>
            <Link to="/pricing" className="inline-flex items-center gap-1 text-base font-semibold text-primary hover:underline">
              See typical rates <ArrowRight className="size-4" />
            </Link>
          </div>
          <ul className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {examples.map((t) => (
              <li key={t.name} className="surface-card p-6">
                <span className="grid size-12 place-items-center rounded-2xl bg-primary/10 text-primary">
                  <t.icon className="size-6" aria-hidden />
                </span>
                <h3 className="mt-4 text-xl font-semibold">{t.name}</h3>
                <p className="mt-2 text-base text-muted-foreground">{t.blurb}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* How it works — 4 steps */}
      <section className="mx-auto max-w-6xl px-5 py-16 lg:px-10">
        <h2 className="font-serif text-3xl sm:text-4xl">How it works</h2>
        <ol className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {steps.map((s) => (
            <li key={s.n} className="surface-card p-6">
              <span className="grid size-10 place-items-center rounded-full bg-primary text-lg font-bold text-primary-foreground">
                {s.n}
              </span>
              <h3 className="mt-4 text-lg font-semibold">{s.title}</h3>
              <p className="mt-2 text-base text-muted-foreground">{s.body}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Verification detail */}
      <section className="border-y border-border bg-secondary/40">
        <div className="mx-auto max-w-6xl px-5 py-16 lg:px-10">
          <div className="grid gap-10 lg:grid-cols-[1fr_1.2fr] lg:items-start">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-semibold text-primary">
                <ShieldCheck className="size-4" /> How we verify every helper
              </span>
              <h2 className="mt-4 font-serif text-3xl sm:text-4xl">Vetted before day one — and every month after.</h2>
              <p className="mt-4 text-lg text-muted-foreground">
                Trust isn't a one-time check. We continuously re-verify identity, background, and behavior so the person at your loved one's door today is still the person we introduced.
              </p>
              <Link to="/trust" className="mt-6 inline-flex items-center gap-1 text-base font-semibold text-primary hover:underline">
                Read our full trust standards <ArrowRight className="size-4" />
              </Link>
            </div>
            <ul className="grid gap-4 sm:grid-cols-2">
              {verificationSteps.map((v) => (
                <li key={v.title} className="surface-card p-5">
                  <span className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary">
                    <v.icon className="size-5" aria-hidden />
                  </span>
                  <h3 className="mt-3 text-base font-semibold">{v.title}</h3>
                  <p className="mt-1.5 text-sm text-muted-foreground">{v.body}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Sample week */}
      <section className="mx-auto max-w-6xl px-5 py-16 lg:px-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-semibold text-primary">
              <CalendarDays className="size-4" /> A sample week
            </span>
            <h2 className="mt-4 font-serif text-3xl sm:text-4xl">What a helpful week can look like</h2>
            <p className="mt-3 max-w-2xl text-lg text-muted-foreground">
              Mix and match to fit your loved one's rhythm. Most families start with 6–12 hours a week and adjust from there.
            </p>
          </div>
        </div>
        <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
          {sampleWeek.map((d) => (
            <div
              key={d.day}
              className={`surface-card p-4 ${d.hours === 0 ? "opacity-60" : ""}`}
            >
              <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">{d.day}</p>
              <p className="mt-2 text-base font-semibold">{d.task}</p>
              <p className="mt-3 text-sm text-muted-foreground">
                {d.hours === 0 ? "Rest day" : `${d.hours} hr${d.hours > 1 ? "s" : ""}`}
              </p>
            </div>
          ))}
        </div>
        <p className="mt-4 text-sm text-muted-foreground">
          Total: 13 hours/week. Cost depends on the helper's rate and your location —{" "}
          <Link to="/pricing" className="font-semibold text-primary hover:underline">
            see typical ranges on our pricing page
          </Link>
          .
        </p>
      </section>

      {/* Scenarios */}
      <section className="border-y border-border bg-warm-cream">
        <div className="mx-auto max-w-6xl px-5 py-16 lg:px-10">
          <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-semibold text-primary">
            <Sparkles className="size-4" /> Real families, real weeks
          </span>
          <h2 className="mt-4 font-serif text-3xl sm:text-4xl">A little help, right where you need it</h2>
          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {scenarios.map((s) => (
              <div key={s.title} className="surface-card p-6">
                <h3 className="text-xl font-semibold">{s.title}</h3>
                <p className="mt-3 text-base text-muted-foreground">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Compare tiers */}
      <section className="mx-auto max-w-6xl px-5 py-16 lg:px-10">
        <h2 className="font-serif text-3xl sm:text-4xl">Which CompanionCare is right for you?</h2>
        <p className="mt-3 max-w-3xl text-lg text-muted-foreground">
          Marketplace helpers cover everyday, non-medical support. For hands-on personal care or skilled clinical care, we have you covered too.
        </p>
        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {compare.map((c) => (
            <Link
              key={c.name}
              to={c.to}
              className={`surface-card group flex flex-col p-6 transition ${c.current ? "ring-2 ring-primary" : "hover:-translate-y-0.5"}`}
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold uppercase tracking-wider text-primary">{c.tag}</p>
                {c.current && (
                  <span className="rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
                    You are here
                  </span>
                )}
              </div>
              <h3 className="mt-2 font-serif text-2xl">CompanionCare {c.name}</h3>
              <p className="mt-3 text-base font-semibold">{c.price}</p>
              <p className="mt-2 text-base text-muted-foreground">{c.scope}</p>
              <p className="mt-3 flex items-start gap-2 text-sm text-muted-foreground">
                <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
                <span>{c.verify}</span>
              </p>
              <span className="mt-auto pt-4 text-sm font-semibold text-primary group-hover:underline">
                Learn more →
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Included / how booking works */}
      <section className="border-y border-border bg-secondary/40">
        <div className="mx-auto max-w-6xl px-5 py-16 lg:px-10">
          <div className="grid gap-10 lg:grid-cols-2">
            <div>
              <h2 className="font-serif text-3xl sm:text-4xl">What every booking includes</h2>
              <p className="mt-4 text-lg text-muted-foreground">
                No hidden fees, no surprise minimums. Every visit — whether it's an hour or a full afternoon — comes with the same safeguards.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link to="/pricing" className="inline-flex items-center gap-1 text-base font-semibold text-primary hover:underline">
                  See simple pricing →
                </Link>
                <Link to="/trust" className="inline-flex items-center gap-1 text-base font-semibold text-primary hover:underline">
                  How we verify helpers →
                </Link>
              </div>
            </div>
            <ul className="grid gap-3">
              {[
                "Helpers set their own hourly rate — you see it up front",
                "Choose the exact person before you book",
                "Total cost shown before you pay — no surprises",
                "Every visit begins with a live selfie + GPS check-in",
                "Free reschedules and cancellations up to 24 hours before",
                "The same helper, week after week, as long as it's working",
                "A real person on the phone 24/7 if anything comes up",
              ].map((point) => (
                <li key={point} className="flex items-start gap-3 rounded-2xl bg-card p-4">
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
        <h2 className="font-serif text-3xl sm:text-4xl">Questions families ask</h2>
        <dl className="mt-8 space-y-4">
          {faqs.map((f) => (
            <details key={f.q} className="surface-card p-6 [&_summary::-webkit-details-marker]:hidden">
              <summary className="cursor-pointer text-lg font-semibold">{f.q}</summary>
              <p className="mt-3 text-base text-muted-foreground">{f.a}</p>
            </details>
          ))}
        </dl>
      </section>

      {/* Scope note */}
      <section className="mx-auto max-w-4xl px-5 pb-6 lg:px-10">
        <div className="surface-card p-6 text-sm text-muted-foreground">
          <p>
            <span className="font-semibold text-foreground">A note on what marketplace helpers do.</span> Marketplace
            helpers focus on non-medical help — companionship, cleaning, meals, rides, and errands. For hands-on
            personal care like bathing and transfers, see{" "}
            <Link to="/services/partners" className="font-medium text-primary hover:underline">CompanionCare Partners</Link>.
            For skilled nursing or therapy, see{" "}
            <Link to="/services/healthcare" className="font-medium text-primary hover:underline">CompanionCare Healthcare</Link>.
          </p>
        </div>
      </section>

      <CTASection
        title="Ready to meet your match?"
        lead="Tell us your ZIP and what would help most this week. We'll introduce you to verified helpers nearby — and stay on the line for as long as you need us."
      />
    </PageShell>
  );
}
