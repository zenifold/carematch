import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Wallet,
  Check,
  Mail,
  ShieldCheck,
  Receipt,
  Sparkles,
  Users,
  Ban,
  HandHeart,
  Stethoscope,
  X,
  Minus,
  ChevronDown,
  Building2,
  UserRound,
} from "lucide-react";
import {
  PageShell,
  PageHero,
  CTASection,
  marketingHead,
  SUPPORT_EMAIL_HREF,
} from "@/components/marketing/PageShell";
// Rate bands, fees, and money formatting live in one place so this page and the
// cost article can't quote different numbers at the same visitor.
import { TIERS, money } from "@/lib/pricing-tiers";


export const Route = createFileRoute("/pricing")({
  head: () =>
    marketingHead({
      path: "/pricing",
      title: "Pricing — Provider-set rates, total cost upfront",
      description:
        "Providers set their own hourly rates and you see the full total upfront. Service fee 15–18%. No contracts or surprise charges.",
      jsonLd: {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: [
          {
            "@type": "Question",
            name: "How does CompanionCare pricing work?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "CompanionCare is a marketplace. Each provider sets their own hourly rate within suggested market bands. Before booking, you see the provider's rate, the estimated hours, the CompanionCare service fee, and the total you'll pay — all on one line. There are no add-ons, tips, or surprise fees after booking.",
            },
          },
          {
            "@type": "Question",
            name: "What is the CompanionCare service fee?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "CompanionCare charges a 15–18% service fee on top of the provider's hourly rate. Skilled tiers (like nursing) are 15%; general care and home services are 18%. The fee funds our 5-stage verification, insurance coverage, in-visit check-in, and dispute protection.",
            },
          },
          {
            "@type": "Question",
            name: "How much does the provider keep?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Providers keep 82–85% of their listed hourly rate. They set their own rates, set their own schedule, and can raise or lower them anytime. Payouts run every Monday by direct deposit to the bank account on file.",
            },
          },
          {
            "@type": "Question",
            name: "Is there a membership option?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Yes. CompanionCare Plus is $29/month and waives service fees on the first $200 of bookings each month, plus unlocks priority booking with top-rated providers. Membership is optional — you can book without it.",
            },
          },
          {
            "@type": "Question",
            name: "What happens if I cancel?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Cancel more than 24 hours ahead for a full refund. Cancellations inside 24 hours are charged 50% of the visit — half to the provider (for their reserved time) and half to CompanionCare. Recurring visits can be paused anytime with no penalty.",
            },
          },
        ],
      },
    }),
  component: PricingPage,
});

function PricingPage() {
  const [tierKey, setTierKey] = useState<string>("companionship");
  const [rate, setRate] = useState<number>(24);
  const [hours, setHours] = useState<number>(2);
  const [compareTab, setCompareTab] = useState<"carematch" | "agency" | "offplatform">("carematch");
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const tier = useMemo(() => TIERS.find((t) => t.key === tierKey)!, [tierKey]);

  // Keep rate within tier bounds when tier changes
  const boundedRate = Math.max(tier.providerLow, Math.min(tier.providerHigh, rate));
  const providerSubtotal = boundedRate * hours;
  const serviceFee = providerSubtotal * (tier.feePct / 100);
  const total = providerSubtotal + serviceFee;
  const providerKeeps = providerSubtotal; // provider receives their rate × hours; fee is on senior side

  return (
    <PageShell>
      <PageHero
        eyebrow="Marketplace pricing"
        title="Providers set their rate. You see the total. That's it."
        lead="CompanionCare is a marketplace, not a package. Every provider sets their own hourly rate. Before you book, you see the rate, the hours, our service fee, and the total — one screen, no surprises."
      />

      {/* Estimator */}
      <section className="mx-auto max-w-7xl px-5 py-16 lg:px-10">
        <div className="grid gap-10 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <span className="inline-flex items-center gap-2 rounded-full bg-accent/15 px-4 py-2 text-base font-semibold text-accent">
              <Wallet className="size-5" /> Estimate your visit
            </span>
            <h2 className="mt-4 font-serif text-3xl tracking-tight">
              Pick a service. Slide the rate. See the total.
            </h2>
            <p className="mt-3 text-lg text-muted-foreground">
              This is exactly what you'll see on a provider's card before you book — provider rate,
              hours, service fee, and total upfront.
            </p>

            <div className="mt-8 surface-card space-y-6 p-6">
              <div>
                <label className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  Service type
                </label>
                <select
                  value={tierKey}
                  onChange={(e) => {
                    const t = TIERS.find((x) => x.key === e.target.value)!;
                    setTierKey(t.key);
                    setRate(Math.round((t.providerLow + t.providerHigh) / 2));
                  }}
                  className="mt-2 w-full rounded-2xl border border-border bg-background px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  {TIERS.map((t) => (
                    <option key={t.key} value={t.key}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex items-baseline justify-between">
                  <label
                    htmlFor="rate"
                    className="text-sm font-semibold uppercase tracking-wider text-muted-foreground"
                  >
                    Provider hourly rate
                  </label>
                  <span className="font-serif text-2xl text-primary">{money(boundedRate)}/hr</span>
                </div>
                <input
                  id="rate"
                  type="range"
                  min={tier.providerLow}
                  max={tier.providerHigh}
                  step={1}
                  value={boundedRate}
                  onChange={(e) => setRate(Number(e.target.value))}
                  className="mt-3 h-3 w-full cursor-pointer appearance-none rounded-full bg-secondary accent-primary"
                />
                <div className="mt-2 flex justify-between text-sm text-muted-foreground">
                  <span>{money(tier.providerLow)}</span>
                  <span>Local range</span>
                  <span>{money(tier.providerHigh)}</span>
                </div>
              </div>

              <div>
                <div className="flex items-baseline justify-between">
                  <label
                    htmlFor="hours"
                    className="text-sm font-semibold uppercase tracking-wider text-muted-foreground"
                  >
                    Visit length
                  </label>
                  <span className="font-serif text-2xl text-primary">
                    {hours} {hours === 1 ? "hour" : "hours"}
                  </span>
                </div>
                <input
                  id="hours"
                  type="range"
                  min={1}
                  max={8}
                  step={1}
                  value={hours}
                  onChange={(e) => setHours(Number(e.target.value))}
                  className="mt-3 h-3 w-full cursor-pointer appearance-none rounded-full bg-secondary accent-primary"
                />
              </div>
            </div>
          </div>

          <div className="lg:col-span-7">
            <div className="surface-card overflow-hidden">
              <div className="bg-primary/5 px-6 py-5">
                <p className="text-sm font-semibold uppercase tracking-wider text-primary">
                  Visit summary
                </p>
                <p className="mt-1 font-serif text-2xl">{tier.name}</p>
                <p className="text-base text-muted-foreground">{tier.blurb}</p>
              </div>
              <dl className="divide-y divide-border">
                <div className="flex items-baseline justify-between px-6 py-4">
                  <dt className="text-base text-muted-foreground">Provider rate</dt>
                  <dd className="text-lg">
                    {money(boundedRate)}/hr × {hours} hrs
                  </dd>
                </div>
                <div className="flex items-baseline justify-between px-6 py-4">
                  <dt className="text-base text-muted-foreground">Subtotal</dt>
                  <dd className="text-lg">{money(providerSubtotal)}</dd>
                </div>
                <div className="flex items-baseline justify-between px-6 py-4">
                  <dt className="text-base text-muted-foreground">
                    CompanionCare service &amp; protection fee ({tier.feePct}%)
                  </dt>
                  <dd className="text-lg">{money(serviceFee)}</dd>
                </div>
                <div className="flex items-baseline justify-between bg-secondary/40 px-6 py-5">
                  <dt className="font-serif text-2xl">Total upfront</dt>
                  <dd className="font-serif text-3xl text-primary">{money(total)}</dd>
                </div>
                <div className="flex items-baseline justify-between px-6 py-4 text-sm text-muted-foreground">
                  <dt>Provider receives after visit</dt>
                  <dd>{money(providerKeeps)}</dd>
                </div>
              </dl>
              <div className="border-t border-border p-6">
                <Link
                  to="/auth"
                  search={{ mode: "signup" }}
                  className="inline-flex w-full items-center justify-center rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
                >
                  See providers at this rate
                </Link>
                <p className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                  <ShieldCheck className="size-4 text-primary" />
                  Card held at booking. Provider paid after verified check-out.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Rate bands table */}
      <section className="border-y border-border bg-secondary/40">
        <div className="mx-auto max-w-6xl px-5 py-16 lg:px-10">
          <h2 className="font-serif text-3xl tracking-tight">Suggested rate bands by service</h2>
          <p className="mt-3 text-lg text-muted-foreground">
            Providers set their own rates. We show local market bands as a reference — never a cap.
          </p>
          <div className="mt-8 overflow-x-auto">
            <table className="w-full min-w-[720px] border-separate border-spacing-y-2">
              <thead>
                <tr className="text-left text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  <th className="px-4 py-2">Service</th>
                  <th className="px-4 py-2">Provider rate</th>
                  <th className="px-4 py-2">Service fee</th>
                  <th className="px-4 py-2">Senior pays</th>
                </tr>
              </thead>
              <tbody>
                {TIERS.map((t) => {
                  const seniorLow = t.providerLow * (1 + t.feePct / 100);
                  const seniorHigh = t.providerHigh * (1 + t.feePct / 100);
                  return (
                    <tr key={t.key} className="rounded-2xl bg-card shadow-soft">
                      <td className="rounded-l-2xl px-4 py-4">
                        <p className="font-semibold">{t.name}</p>
                        <p className="text-sm text-muted-foreground">{t.blurb}</p>
                      </td>
                      <td className="px-4 py-4 text-base">
                        ${t.providerLow}–${t.providerHigh}/hr
                      </td>
                      <td className="px-4 py-4 text-base">{t.feePct}%</td>
                      <td className="rounded-r-2xl px-4 py-4 text-base font-semibold text-primary">
                        {money(seniorLow)}–{money(seniorHigh)}/hr
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            Transportation includes IRS-standard mileage in addition to the hourly rate.
          </p>
        </div>
      </section>

      {/* What the fee buys */}
      <section className="mx-auto max-w-6xl px-5 py-16 lg:px-10">
        <h2 className="font-serif text-3xl tracking-tight">What the service fee buys</h2>
        <p className="mt-3 text-lg text-muted-foreground">
          We call it a service &amp; protection fee — not a commission — because every dollar goes
          into the trust layer around your visit.
        </p>
        <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[
            {
              icon: ShieldCheck,
              title: "5-stage verification",
              body: "ID, background, credentials, monthly re-checks, live check-in.",
            },
            {
              icon: Receipt,
              title: "Insurance & protection",
              body: "Platform-backed coverage for theft, damage, and dispute resolution.",
            },
            {
              icon: Users,
              title: "Family visibility",
              body: "Family dashboard, real-time visit updates, and shared care plan.",
            },
            {
              icon: Sparkles,
              title: "Payment guarantee",
              body: "Card held at booking, released only after verified check-out.",
            },
          ].map((f) => (
            <div key={f.title} className="surface-card p-6">
              <span className="grid size-12 place-items-center rounded-2xl bg-primary/10 text-primary">
                <f.icon className="size-6" />
              </span>
              <p className="mt-4 font-semibold">{f.title}</p>
              <p className="mt-2 text-base text-muted-foreground">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Interactive comparison tabs */}
      <section className="border-y border-border bg-background">
        <div className="mx-auto max-w-6xl px-5 py-16 lg:px-10">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary/70">
            The honest comparison
          </p>
          <h2 className="mt-2 font-serif text-3xl tracking-tight sm:text-4xl">
            Same 4 hours a week. Three ways to hire.
          </h2>
          <p className="mt-3 max-w-2xl text-lg text-muted-foreground">
            Tap each option to see what you actually pay, what's included, and what quietly isn't.
          </p>

          <div className="mt-8 flex flex-wrap gap-2 rounded-full bg-secondary/60 p-1.5 md:inline-flex">
            {[
              { key: "carematch", label: "CompanionCare", icon: ShieldCheck },
              { key: "agency", label: "Traditional agency", icon: Building2 },
              { key: "offplatform", label: "Craigslist / off-platform", icon: UserRound },
            ].map((opt) => {
              const active = compareTab === opt.key;
              const OIcon = opt.icon;
              return (
                <button
                  key={opt.key}
                  onClick={() => setCompareTab(opt.key as typeof compareTab)}
                  className={`inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition-colors ${
                    active
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-foreground/70 hover:text-foreground"
                  }`}
                >
                  <OIcon className="size-4" /> {opt.label}
                </button>
              );
            })}
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-5">
            <div className="surface-card p-7 lg:col-span-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                Estimated monthly cost
              </p>
              <p className="mt-3 font-serif text-5xl text-primary">
                {compareTab === "carematch" && "$472"}
                {compareTab === "agency" && "$624"}
                {compareTab === "offplatform" && "$360"}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                Based on 4 hours/week of companionship care in a mid-market metro.
              </p>
              <ul className="mt-6 space-y-3 text-sm">
                {compareTab === "carematch" && (
                  <>
                    <li className="flex justify-between">
                      <span className="text-muted-foreground">Provider rate</span>
                      <span>$24/hr × 16 hrs</span>
                    </li>
                    <li className="flex justify-between">
                      <span className="text-muted-foreground">Service fee (18%)</span>
                      <span>$69</span>
                    </li>
                    <li className="flex justify-between border-t border-border pt-3 font-semibold">
                      <span>You pay</span>
                      <span className="text-primary">$472/mo</span>
                    </li>
                  </>
                )}
                {compareTab === "agency" && (
                  <>
                    <li className="flex justify-between">
                      <span className="text-muted-foreground">Agency rate</span>
                      <span>$36–$42/hr × 16 hrs</span>
                    </li>
                    <li className="flex justify-between">
                      <span className="text-muted-foreground">Assessment fee</span>
                      <span>~$150 one-time</span>
                    </li>
                    <li className="flex justify-between border-t border-border pt-3 font-semibold">
                      <span>You pay</span>
                      <span>~$624/mo</span>
                    </li>
                  </>
                )}
                {compareTab === "offplatform" && (
                  <>
                    <li className="flex justify-between">
                      <span className="text-muted-foreground">Cash rate</span>
                      <span>$22/hr × 16 hrs</span>
                    </li>
                    <li className="flex justify-between">
                      <span className="text-muted-foreground">Insurance & taxes</span>
                      <span className="text-destructive">Your responsibility</span>
                    </li>
                    <li className="flex justify-between border-t border-border pt-3 font-semibold">
                      <span>You pay</span>
                      <span>$360/mo + risk</span>
                    </li>
                  </>
                )}
              </ul>
            </div>

            <div className="surface-card p-7 lg:col-span-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                What's actually included
              </p>
              <ul className="mt-4 divide-y divide-border">
                {[
                  {
                    label: "Background check + monthly re-check",
                    cm: true,
                    ag: "once",
                    off: false,
                  },
                  { label: "Live selfie + GPS check-in at door", cm: true, ag: false, off: false },
                  { label: "Insurance for theft, damage, injury", cm: true, ag: true, off: false },
                  { label: "You keep the same helper", cm: true, ag: "sometimes", off: true },
                  { label: "Human support, reply in 1 business day", cm: true, ag: "biz hrs", off: false },
                  { label: "Cancel anytime, no contract", cm: true, ag: false, off: true },
                  { label: "Family dashboard + visit updates", cm: true, ag: "extra", off: false },
                  { label: "Taxes & 1099 handled for you", cm: true, ag: true, off: false },
                ].map((row) => {
                  const val =
                    compareTab === "carematch"
                      ? row.cm
                      : compareTab === "agency"
                        ? row.ag
                        : row.off;
                  return (
                    <li key={row.label} className="flex items-center justify-between gap-4 py-3">
                      <span className="text-base">{row.label}</span>
                      {val === true ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                          <Check className="size-3.5" /> Included
                        </span>
                      ) : val === false ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-destructive/10 px-3 py-1 text-xs font-semibold text-destructive">
                          <X className="size-3.5" /> Not included
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground">
                          <Minus className="size-3.5" /> {val}
                        </span>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Partners & Health — separate pricing model */}
      <section className="border-y border-border bg-secondary/40">
        <div className="mx-auto max-w-6xl px-5 py-16 lg:px-10">
          <p className="text-sm font-semibold uppercase tracking-wider text-primary">
            Partners & Health rails
          </p>
          <h2 className="mt-2 font-serif text-3xl tracking-tight">
            Different services, different pricing model.
          </h2>
          <p className="mt-3 max-w-3xl text-lg text-muted-foreground">
            The marketplace fee above applies to independent providers you book directly. For{" "}
            <Link to="/services/partners" className="font-medium text-primary hover:underline">
              Partners
            </Link>{" "}
            (personal care via licensed home care agencies) and{" "}
            <Link to="/services/healthcare" className="font-medium text-primary hover:underline">
              Healthcare
            </Link>{" "}
            (skilled nursing referrals), the agency bills you directly. CompanionCare is compensated by
            the agency, not by you.
          </p>

          <div className="mt-8 grid gap-6 md:grid-cols-2">
            <div className="surface-card p-7">
              <div className="flex items-center gap-3">
                <span className="grid size-11 place-items-center rounded-2xl bg-primary/10 text-primary">
                  <HandHeart className="size-6" />
                </span>
                <h3 className="text-2xl font-semibold">Partners</h3>
              </div>
              <p className="mt-3 text-base text-muted-foreground">
                Licensed home care agencies deliver personal care. You pay the agency at their rate.
              </p>
              <dl className="mt-5 divide-y divide-border">
                <div className="flex items-baseline justify-between py-3">
                  <dt className="text-base text-muted-foreground">You pay</dt>
                  <dd className="text-base font-semibold">Agency's published rate</dd>
                </div>
                <div className="flex items-baseline justify-between py-3">
                  <dt className="text-base text-muted-foreground">CompanionCare fee model</dt>
                  <dd className="text-base font-semibold">Finder's fee, paid by agency</dd>
                </div>
                <div className="flex items-baseline justify-between py-3">
                  <dt className="text-base text-muted-foreground">Typical fee</dt>
                  <dd className="text-base font-semibold">$50–$250 per converted intake</dd>
                </div>
              </dl>
              <p className="mt-4 text-sm text-muted-foreground">
                Established metros may migrate to a small revenue share (8–15% of gross for the
                first 6–12 months of the client relationship). Never marked up to you.
              </p>
            </div>

            <div className="surface-card p-7">
              <div className="flex items-center gap-3">
                <span className="grid size-11 place-items-center rounded-2xl bg-primary/10 text-primary">
                  <Stethoscope className="size-6" />
                </span>
                <h3 className="text-2xl font-semibold">Health</h3>
              </div>
              <p className="mt-3 text-base text-muted-foreground">
                Skilled nursing and therapy referrals go to Medicare-certified home health agencies.
              </p>
              <dl className="mt-5 divide-y divide-border">
                <div className="flex items-baseline justify-between py-3">
                  <dt className="text-base text-muted-foreground">You pay</dt>
                  <dd className="text-base font-semibold">Medicare / insurance / agency</dd>
                </div>
                <div className="flex items-baseline justify-between py-3">
                  <dt className="text-base text-muted-foreground">CompanionCare fee model</dt>
                  <dd className="text-base font-semibold">Flat referral fee, paid by agency</dd>
                </div>
                <div className="flex items-baseline justify-between py-3">
                  <dt className="text-base text-muted-foreground">Typical fee</dt>
                  <dd className="text-base font-semibold">$75–$150 per accepted referral</dd>
                </div>
              </dl>
              <p className="mt-4 text-sm text-muted-foreground">
                Flat fees only — never a percentage of Medicare reimbursement. Referrals comply with
                the federal Anti-Kickback Statute and applicable state law.
              </p>
            </div>
          </div>

          <p className="mt-6 text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">Why this matters to you:</span> you pay
            the same hourly rate you'd pay the agency directly. CompanionCare never adds a markup — the
            agency pays our small referral fee, not you.
          </p>
        </div>
      </section>

      {/* Membership */}
      <section className="border-y border-border bg-primary/5">
        <div className="mx-auto grid max-w-6xl gap-10 px-5 py-16 lg:grid-cols-2 lg:px-10">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-primary">
              Optional membership
            </p>
            <h2 className="mt-2 font-serif text-3xl tracking-tight">CompanionCare Plus — $29/month</h2>
            <p className="mt-4 text-lg text-muted-foreground">
              For families booking regular care. Waives service fees on the first $200 of bookings
              each month and unlocks priority access to top-rated providers.
            </p>
            <ul className="mt-6 space-y-3">
              {[
                "Service fees waived on first $200/month of bookings",
                "Priority booking with top-rated providers",
                "Dedicated care coordinator",
                "Cancel anytime — no contracts",
              ].map((i) => (
                <li key={i} className="flex items-start gap-2 text-base">
                  <Check className="mt-1 size-4 shrink-0 text-primary" />
                  <span>{i}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="surface-card p-6">
            <p className="font-semibold">When Plus pays for itself</p>
            <p className="mt-2 text-base text-muted-foreground">
              At an 18% service fee, waiving fees on $200/month saves $36. Plus costs $29.
              Break-even is one recurring visit a month.
            </p>
            <div className="mt-6 rounded-2xl bg-secondary/50 p-5 font-mono text-sm">
              <div className="flex justify-between">
                <span>Bookings/month</span>
                <span>$200.00</span>
              </div>
              <div className="flex justify-between">
                <span>Fees waived (18%)</span>
                <span>−$36.00</span>
              </div>
              <div className="flex justify-between">
                <span>Plus membership</span>
                <span>+$29.00</span>
              </div>
              <div className="mt-2 flex justify-between border-t border-border pt-2 font-semibold">
                <span>Net savings</span>
                <span className="text-primary">$7.00 / mo</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Cancellation & payment flow */}
      <section className="mx-auto max-w-6xl px-5 py-16 lg:px-10">
        <div className="grid gap-10 lg:grid-cols-2">
          <div>
            <h2 className="font-serif text-3xl tracking-tight">Payment flow</h2>
            <ol className="mt-6 space-y-4">
              {[
                "You book a visit — no card details required up front.",
                "Provider checks in and out → the exact time and cost are logged automatically.",
                "You get an itemized invoice the moment the visit ends, before you're asked to pay.",
                "No auto-charging, no card held on file. Pause or cancel anytime.",
              ].map((step, i) => (
                <li key={step} className="flex items-start gap-4">
                  <span className="grid size-9 shrink-0 place-items-center rounded-full bg-primary/10 font-serif text-primary">
                    {i + 1}
                  </span>
                  <p className="text-lg">{step}</p>
                </li>
              ))}
            </ol>
          </div>
          <div>
            <h2 className="font-serif text-3xl tracking-tight">Cancellation policy</h2>
            <ul className="mt-6 space-y-4">
              <li className="surface-card flex items-start gap-4 p-5">
                <Check className="mt-1 size-5 shrink-0 text-primary" />
                <div>
                  <p className="font-semibold">More than 24 hours ahead</p>
                  <p className="text-base text-muted-foreground">Full refund. No fee.</p>
                </div>
              </li>
              <li className="surface-card flex items-start gap-4 p-5">
                <Ban className="mt-1 size-5 shrink-0 text-destructive" />
                <div>
                  <p className="font-semibold">Inside 24 hours</p>
                  <p className="text-base text-muted-foreground">
                    50% of the visit is charged — half goes to the provider for their reserved time,
                    half to CompanionCare.
                  </p>
                </div>
              </li>
              <li className="surface-card flex items-start gap-4 p-5">
                <Check className="mt-1 size-5 shrink-0 text-primary" />
                <div>
                  <p className="font-semibold">Recurring visits</p>
                  <p className="text-base text-muted-foreground">
                    Pause the schedule anytime. No penalty. Provider blackout dates skip the week
                    with no charge.
                  </p>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Providers CTA strip */}
      <section className="border-t border-border bg-secondary/40">
        <div className="mx-auto max-w-6xl px-5 py-14 lg:px-10">
          <div className="flex flex-col items-start justify-between gap-6 lg:flex-row lg:items-center">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wider text-primary">
                For caregivers
              </p>
              <h2 className="mt-2 font-serif text-2xl tracking-tight">
                Set your rate. Keep 82–85%. Get paid every Monday.
              </h2>
              <p className="mt-2 text-base text-muted-foreground">
                You choose your rate, your schedule, and the visits you accept. We handle payments,
                insurance, and 1099s.
              </p>
            </div>
            <Link
              to="/for-caregivers"
              className="inline-flex items-center justify-center rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
            >
              How caregiver earnings work
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-12 lg:px-10">
        <div className="flex flex-wrap items-center gap-3">
          <a
            href={SUPPORT_EMAIL_HREF}
            className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-base font-semibold text-primary-foreground"
          >
            <Mail className="size-5" /> Ask us for a personal quote
          </a>
          <Link
            to="/faq"
            className="inline-flex items-center gap-2 rounded-full border border-border px-6 py-3 text-base font-semibold hover:bg-secondary"
          >
            Read pricing FAQ
          </Link>
        </div>
      </section>

      {/* Interactive FAQ accordion */}
      <section className="border-t border-border bg-secondary/30">
        <div className="mx-auto max-w-4xl px-5 py-20 lg:px-10">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary/70">
            Pricing questions
          </p>
          <h2 className="mt-2 font-serif text-3xl tracking-tight sm:text-4xl">
            Everything most families ask before booking.
          </h2>
          <ul className="mt-10 divide-y divide-border border-y border-border">
            {[
              {
                q: "How does CompanionCare pricing work?",
                a: "Each provider sets their own hourly rate within a local market band. Before booking, you see the provider's rate, the estimated hours, the service fee, and the total — all on one line. No add-ons, tips, or surprise fees after booking.",
              },
              {
                q: "What is the 15–18% service fee actually for?",
                a: "Our 5-stage verification (ID, background, credentials, monthly re-checks, live check-in), insurance coverage for theft/damage/injury, in-visit selfie + GPS confirmation, human support, and dispute protection. Skilled tiers like nursing are 15%; general care is 18%.",
              },
              {
                q: "How much does the provider actually keep?",
                a: "Providers keep 82–85% of their listed hourly rate. They set their own rates, set their own schedule, and can raise them anytime. Payouts run every Monday by direct deposit.",
              },
              {
                q: "Do I need CompanionCare Plus to book?",
                a: "No. Plus is optional and pays for itself at roughly one recurring visit per month. Most families start without it and add it after their second or third booking.",
              },
              {
                q: "What if I cancel a visit?",
                a: "More than 24 hours ahead: full refund, no fee. Inside 24 hours: 50% of the visit is charged — half to the provider for reserved time, half to CompanionCare. Recurring visits can be paused anytime, no penalty.",
              },
              {
                q: "Are Partners and Healthcare priced the same way?",
                a: "No — for licensed home care agencies (Partners) and skilled nursing referrals (Healthcare), the agency bills you directly at their published rate. CompanionCare is paid a small referral fee by the agency, never marked up to you.",
              },
            ].map((item, i) => {
              const open = openFaq === i;
              return (
                <li key={item.q}>
                  <button
                    onClick={() => setOpenFaq(open ? null : i)}
                    className="flex w-full items-start justify-between gap-6 py-6 text-left"
                    aria-expanded={open}
                  >
                    <span className="font-serif text-xl md:text-2xl">{item.q}</span>
                    <ChevronDown
                      className={`mt-1.5 size-5 shrink-0 text-primary transition-transform ${
                        open ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                  <div
                    className={`grid overflow-hidden transition-[grid-template-rows] duration-300 ${
                      open ? "grid-rows-[1fr] pb-6" : "grid-rows-[0fr]"
                    }`}
                  >
                    <div className="min-h-0">
                      <p className="max-w-3xl text-base leading-relaxed text-muted-foreground">
                        {item.a}
                      </p>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      <CTASection />
    </PageShell>
  );
}
