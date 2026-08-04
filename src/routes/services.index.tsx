import { createFileRoute, Link } from "@tanstack/react-router";
import { Users, HandHeart, Stethoscope, ArrowRight, ShieldCheck } from "lucide-react";
import { PageShell, PageHero, CTASection, marketingHead, SITE_URL } from "@/components/marketing/PageShell";
import marketplaceImg from "@/assets/services-marketplace.jpg";
import partnersImg from "@/assets/services-partners.jpg";
import healthcareImg from "@/assets/services-healthcare.jpg";

const rails = [
  {
    image: marketplaceImg,
    to: "/services/marketplace",
    icon: Users,
    tier: "Marketplace",
    name: "Marketplace",
    tagline: "Independent providers. Their services, their rates.",
    blurb:
      "Verified local providers list themselves on CompanionCare and pick the services they offer — errands, rides, cleaning, companionship, meal prep, tech help, and more. Providers set their own hourly rate. You see the person, the tasks, and the total before you book.",
    price: "Providers set their own rate",
    examples: ["Errands & rides", "Cleaning & laundry", "Companionship", "Meal prep", "Reminders", "Tech help"],
  },
  {
    image: partnersImg,
    to: "/services/partners",
    icon: HandHeart,
    tier: "Partners",
    name: "Partners",
    tagline: "Personal care via licensed home care agencies.",
    blurb:
      "Bathing, dressing, transfers, and other hands-on personal assistance. Delivered by CNAs and HHAs from licensed agencies we partner with in your state.",
    price: "Agency rates apply",
    examples: ["Bathing & dressing", "Toileting & transfers", "Mobility support", "Feeding assistance", "Overnight support"],
  },
  {
    image: healthcareImg,
    to: "/services/healthcare",
    icon: Stethoscope,
    tier: "Healthcare",
    name: "Healthcare",
    tagline: "Skilled nursing and therapy — we make the introduction.",
    blurb:
      "For clinical needs — nursing visits, wound care, physical, occupational, or speech therapy — we introduce you to a Medicare-certified home health agency in your area and keep everything else at home in one place.",
    price: "Billed by the agency",
    examples: ["Skilled nursing visits", "Wound care", "Physical therapy", "Occupational therapy", "Speech therapy"],
  },
] as const;

export const Route = createFileRoute("/services/")({
  head: () =>
    marketingHead({
      path: "/services",
      title: "Services — Marketplace, Partners & Skilled Referrals",
      description:
        "One CompanionCare app, three rails: a marketplace of independent helpers, personal care via licensed agency partners, and skilled home health referrals. Start where you need help today.",
      jsonLd: {
        "@context": "https://schema.org",
        "@type": "ItemList",
        itemListElement: rails.map((s, i) => ({
          "@type": "ListItem",
          position: i + 1,
          name: s.name,
          url: `${SITE_URL}${s.to}`,
        })),
      },
    }),
  component: ServicesHub,
});

type Rail = (typeof rails)[number];

function ServicesHub() {
  return (
    <PageShell>
      <PageHero
        eyebrow="Services"
        title="One app. The whole spectrum of in-home help."
        lead="From a grocery run to hands-on personal assistance to a skilled nursing referral — start with what you need today, grow into more when you're ready."
      />

      <section className="mx-auto max-w-6xl px-5 lg:px-10">
        <div className="surface-card mb-20 flex items-start gap-4 p-6">
          <ShieldCheck className="size-6 shrink-0 text-primary" aria-hidden />
          <p className="text-base text-muted-foreground">
            <span className="font-semibold text-foreground">CompanionCare is a technology platform</span>, not a home
            care agency. The Marketplace connects you with independent providers who set their own services and
            rates. Partners and Healthcare hand you off to licensed agencies.{" "}
            <Link to="/legal/scope-of-practice" className="font-medium text-primary hover:underline">
              See what each rail includes →
            </Link>
          </p>
        </div>
      </section>

      <div className="mx-auto flex max-w-7xl flex-col gap-32 px-5 pb-24 lg:gap-40 lg:px-10">
        <RailSplit rail={rails[0]} index="01" />
        <RailDark rail={rails[1]} index="02" />
        <RailVertical rail={rails[2]} index="03" />
      </div>

      <CTASection />
    </PageShell>
  );
}

function RailSplit({ rail, index }: { rail: Rail; index: string }) {
  const Icon = rail.icon;
  return (
    <section className="group grid grid-cols-1 items-center gap-12 md:grid-cols-12 md:gap-16">
      <div className="md:col-span-6 md:order-1">
        <div className="relative">
          <span
            aria-hidden
            className="pointer-events-none absolute -left-6 -top-16 select-none font-serif text-[10rem] italic leading-none text-primary/[0.06] md:text-[12rem]"
          >
            {index}
          </span>
          <p className="mb-6 text-[11px] font-semibold uppercase tracking-[0.2em] text-primary/70">
            {rail.tier} Tier
          </p>
          <h2 className="mb-4 font-serif text-5xl font-medium text-foreground md:text-6xl">{rail.name}</h2>
          <p className="mb-8 font-serif text-xl italic text-foreground/70">{rail.tagline}</p>
          <p className="mb-8 max-w-md text-lg leading-relaxed text-foreground/80">{rail.blurb}</p>
          <ul className="mb-10 flex flex-wrap gap-2">
            {rail.examples.map((ex) => (
              <li
                key={ex}
                className="rounded-full border border-primary/10 bg-primary/5 px-4 py-1.5 text-xs font-medium text-primary"
              >
                {ex}
              </li>
            ))}
          </ul>
          <div className="flex flex-wrap items-center gap-8">
            <Link to={rail.to} className="group/btn inline-flex items-center gap-2 font-semibold text-foreground">
              <span className="border-b border-foreground py-1">Explore {rail.name} services</span>
              <ArrowRight className="size-4 transition-transform group-hover/btn:translate-x-1" aria-hidden />

            </Link>
            <span className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
              {rail.price}
            </span>
          </div>
        </div>
      </div>
      <div className="md:col-span-6 md:order-2">
        <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-primary/5">
          <img
            src={rail.image}
            alt={`${rail.name} — ${rail.tagline}`}
            loading="lazy"
            width={1024}
            height={1280}
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-primary/25 via-transparent to-transparent" />
          <div className="absolute bottom-5 left-5 rounded-full border border-primary-foreground/30 bg-background/80 p-3 backdrop-blur">
            <Icon className="size-5 text-primary" strokeWidth={1.5} aria-hidden />
          </div>
        </div>
      </div>
    </section>
  );
}

function RailDark({ rail, index }: { rail: Rail; index: string }) {
  const Icon = rail.icon;
  return (
    <section className="relative overflow-hidden rounded-[2rem] bg-primary px-8 py-20 text-primary-foreground md:px-14 md:py-24">
      <span
        aria-hidden
        className="pointer-events-none absolute right-6 top-0 select-none font-serif text-[10rem] italic leading-none text-primary-foreground/[0.08] md:text-[14rem]"
      >
        {index}
      </span>
      <div className="relative z-10 grid grid-cols-1 items-center gap-12 md:grid-cols-12">
        <div className="md:col-span-5">
          <div className="relative aspect-square overflow-hidden rounded-xl bg-primary-foreground/10">
            <img
              src={rail.image}
              alt={`${rail.name} — ${rail.tagline}`}
              loading="lazy"
              width={1024}
              height={1024}
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-primary/60 via-primary/10 to-transparent" />
            <div className="absolute bottom-4 left-4 rounded-full border border-primary-foreground/30 bg-primary-foreground/15 p-3 backdrop-blur">
              <Icon className="size-5 text-primary-foreground" strokeWidth={1.5} aria-hidden />
            </div>
          </div>
        </div>
        <div className="md:col-span-7">
          <p className="mb-6 text-[11px] font-semibold uppercase tracking-[0.2em] text-primary-foreground/60">
            {rail.tier} Tier
          </p>
          <h2 className="mb-4 font-serif text-5xl font-medium text-primary-foreground md:text-6xl">{rail.name}</h2>
          <p className="mb-8 font-serif text-xl italic text-primary-foreground/80">{rail.tagline}</p>
          <p className="mb-8 max-w-xl text-lg leading-relaxed text-primary-foreground/85">{rail.blurb}</p>
          <ul className="mb-10 flex flex-wrap gap-2">
            {rail.examples.map((ex) => (
              <li
                key={ex}
                className="rounded-full border border-primary-foreground/20 bg-primary-foreground/10 px-4 py-1.5 text-xs font-medium text-primary-foreground"
              >
                {ex}
              </li>
            ))}
          </ul>
          <div className="flex flex-wrap items-center gap-6">
            <Link
              to={rail.to}
              className="inline-flex items-center gap-2 rounded-full bg-primary-foreground px-8 py-3.5 font-semibold text-primary transition-colors hover:bg-primary-foreground/90"
            >
              Learn about licensed {rail.name.toLowerCase()}
              <ArrowRight className="size-4" aria-hidden />

            </Link>
            <span className="text-xs font-medium uppercase tracking-widest text-primary-foreground/50">
              {rail.price}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

function RailVertical({ rail, index }: { rail: Rail; index: string }) {
  return (
    <section className="group flex flex-col gap-12 md:flex-row md:gap-16">
      <div className="border-l-2 border-primary/10 pl-8 md:w-1/3 md:pl-10">
        <span aria-hidden className="mb-6 block font-serif text-7xl italic leading-none text-primary/15 md:text-8xl">
          {index}
        </span>
        <p className="mb-6 text-[11px] font-semibold uppercase tracking-[0.2em] text-primary/70">
          {rail.tier} Tier
        </p>
        <h2 className="mb-6 font-serif text-5xl font-medium text-foreground md:text-6xl">{rail.name}</h2>
        <div className="mb-6 aspect-[4/5] overflow-hidden rounded-2xl">
          <img
            src={rail.image}
            alt={`${rail.name} — ${rail.tagline}`}
            loading="lazy"
            width={1024}
            height={1280}
            className="h-full w-full object-cover"
          />
        </div>
        <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Referral pathway</p>
      </div>
      <div className="md:w-2/3">
        <div className="rounded-[2rem] border border-primary/5 bg-card p-8 shadow-sm md:p-12">
          <p className="mb-8 max-w-lg font-serif text-2xl italic text-foreground/70">{rail.tagline}</p>
          <p className="mb-10 text-lg leading-relaxed text-foreground/80">{rail.blurb}</p>
          <ul className="mb-12 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {rail.examples.map((ex) => (
              <li key={ex} className="flex items-center gap-3 rounded-xl border border-primary/5 bg-background p-4">
                <span className="size-2 rounded-full bg-primary" aria-hidden />
                <span className="text-sm text-foreground">{ex}</span>
              </li>
            ))}
          </ul>
          <Link to={rail.to} className="group/cta inline-flex items-center gap-4">
            <span className="grid size-12 place-items-center rounded-full border border-primary text-primary transition-all group-hover/cta:bg-primary group-hover/cta:text-primary-foreground">
              <ArrowRight className="size-4" aria-hidden />
            </span>
            <span className="font-semibold text-primary">Explore {rail.name.toLowerCase()} pathway</span>
          </Link>
          <p className="mt-6 text-xs font-medium uppercase tracking-widest text-muted-foreground">{rail.price}</p>
        </div>
      </div>
    </section>
  );
}
