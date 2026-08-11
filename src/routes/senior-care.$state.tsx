import { createFileRoute, Link, notFound } from "@tanstack/react-router";
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
  Mail,
  Wallet,
  Check,
} from "lucide-react";
import {
  SiteHeader,
  SiteFooter,
  SUPPORT_EMAIL_HREF,
  SITE_URL,
  marketingHead,
} from "@/components/marketing/PageShell";

type StateInfo = {
  name: string;
  slug: string;
  costMultiplier: number; // 1.0 = national avg
  license: string;
  notes: string;
  cities: string[];
};

const STATES: StateInfo[] = [
  { name: "California", slug: "california", costMultiplier: 1.15, license: "HCA registration through the California Home Care Services Bureau.", notes: "Overtime rules apply after 9 hrs/day. IHSS is available for Medi-Cal eligible seniors.", cities: ["Los Angeles", "San Diego", "San Francisco", "San Jose", "Sacramento", "Fresno"] },
  { name: "Texas", slug: "texas", costMultiplier: 0.92, license: "Personal Assistance Services agencies licensed by HHSC.", notes: "STAR+PLUS Medicaid waiver can offset personal care for eligible seniors.", cities: ["Houston", "Dallas", "Austin", "San Antonio", "Fort Worth", "El Paso"] },
  { name: "Florida", slug: "florida", costMultiplier: 0.98, license: "Home Health Aides register with AHCA. Companion care doesn't require licensure.", notes: "Statewide Medicaid Managed Care Long-Term Care covers eligible home-care services.", cities: ["Miami", "Tampa", "Orlando", "Jacksonville", "Fort Lauderdale", "St. Petersburg"] },
  { name: "New York", slug: "new-york", costMultiplier: 1.20, license: "HHA and PCA certification through NY State Department of Health.", notes: "CDPAP lets seniors hire their own caregiver — even a family member — through Medicaid.", cities: ["New York City", "Buffalo", "Rochester", "Yonkers", "Syracuse", "Albany"] },
  { name: "Pennsylvania", slug: "pennsylvania", costMultiplier: 0.95, license: "Home care agencies licensed by the PA Department of Health.", notes: "Community HealthChoices covers long-term services for Medicaid-eligible seniors.", cities: ["Philadelphia", "Pittsburgh", "Allentown", "Erie", "Reading", "Scranton"] },
  { name: "Illinois", slug: "illinois", costMultiplier: 1.02, license: "Home services agencies licensed by IDPH.", notes: "Community Care Program helps seniors 60+ stay at home.", cities: ["Chicago", "Aurora", "Naperville", "Joliet", "Rockford", "Springfield"] },
  { name: "Ohio", slug: "ohio", costMultiplier: 0.90, license: "Non-medical home care is unlicensed; nursing agencies certified by ODH.", notes: "PASSPORT Medicaid waiver funds home-based care for eligible seniors.", cities: ["Columbus", "Cleveland", "Cincinnati", "Toledo", "Akron", "Dayton"] },
  { name: "Georgia", slug: "georgia", costMultiplier: 0.90, license: "Private home care providers licensed by the GA Department of Community Health.", notes: "SOURCE and CCSP waivers fund care for eligible Medicaid seniors.", cities: ["Atlanta", "Augusta", "Columbus", "Savannah", "Athens", "Macon"] },
  { name: "North Carolina", slug: "north-carolina", costMultiplier: 0.92, license: "Home care agencies licensed by NC DHHS.", notes: "CAP/DA Medicaid waiver funds in-home services for eligible seniors.", cities: ["Charlotte", "Raleigh", "Greensboro", "Durham", "Winston-Salem", "Fayetteville"] },
  { name: "Michigan", slug: "michigan", costMultiplier: 0.94, license: "Non-medical home care is unregulated; agencies self-certify.", notes: "MI Choice Waiver funds home care for eligible Medicaid seniors.", cities: ["Detroit", "Grand Rapids", "Warren", "Sterling Heights", "Ann Arbor", "Lansing"] },
  { name: "New Jersey", slug: "new-jersey", costMultiplier: 1.12, license: "Home Care Service Firms licensed by the NJ Division of Consumer Affairs.", notes: "Managed Long-Term Services and Supports covers eligible care.", cities: ["Newark", "Jersey City", "Paterson", "Elizabeth", "Edison", "Trenton"] },
  { name: "Virginia", slug: "virginia", costMultiplier: 1.00, license: "Home Care Organizations licensed by VDH.", notes: "CCC Plus Medicaid waiver funds home-based care for eligible seniors.", cities: ["Virginia Beach", "Norfolk", "Chesapeake", "Richmond", "Arlington", "Alexandria"] },
  { name: "Washington", slug: "washington", costMultiplier: 1.10, license: "Home Care Aides certified by DSHS after 75 hours of training.", notes: "COPES Medicaid waiver supports at-home care for eligible seniors.", cities: ["Seattle", "Spokane", "Tacoma", "Vancouver", "Bellevue", "Kent"] },
  { name: "Arizona", slug: "arizona", costMultiplier: 0.98, license: "Non-medical home care is unlicensed; nurses regulated by AZBN.", notes: "ALTCS covers long-term care for financially eligible seniors.", cities: ["Phoenix", "Tucson", "Mesa", "Chandler", "Gilbert", "Scottsdale"] },
  { name: "Massachusetts", slug: "massachusetts", costMultiplier: 1.15, license: "Non-medical home care providers register with EOHHS.", notes: "Home Care Program provides services to seniors 60+ regardless of income.", cities: ["Boston", "Worcester", "Springfield", "Cambridge", "Lowell", "Brockton"] },
  { name: "Tennessee", slug: "tennessee", costMultiplier: 0.88, license: "Home Care Organizations licensed by the TN Department of Health.", notes: "CHOICES program funds home-based services for eligible seniors.", cities: ["Nashville", "Memphis", "Knoxville", "Chattanooga", "Clarksville", "Murfreesboro"] },
  { name: "Indiana", slug: "indiana", costMultiplier: 0.90, license: "Personal Services Agencies licensed by the ISDH.", notes: "Aged & Disabled Waiver funds home-based care for eligible Medicaid seniors.", cities: ["Indianapolis", "Fort Wayne", "Evansville", "South Bend", "Carmel", "Fishers"] },
  { name: "Missouri", slug: "missouri", costMultiplier: 0.90, license: "In-home services providers certified by MO Department of Health.", notes: "Consumer-Directed Services program lets seniors hire their own caregivers.", cities: ["Kansas City", "St. Louis", "Springfield", "Columbia", "Independence", "Lee's Summit"] },
  { name: "Maryland", slug: "maryland", costMultiplier: 1.10, license: "Residential Service Agencies licensed by OHCQ.", notes: "Community Options Waiver funds home care for eligible seniors.", cities: ["Baltimore", "Frederick", "Rockville", "Gaithersburg", "Bowie", "Hagerstown"] },
  { name: "Wisconsin", slug: "wisconsin", costMultiplier: 0.96, license: "Home Care Agencies certified by the Department of Health Services.", notes: "IRIS and Family Care programs fund in-home services for eligible seniors.", cities: ["Milwaukee", "Madison", "Green Bay", "Kenosha", "Racine", "Appleton"] },
  { name: "Colorado", slug: "colorado", costMultiplier: 1.05, license: "Home Care Agencies licensed by CDPHE.", notes: "Elderly, Blind, and Disabled Waiver funds home-based care.", cities: ["Denver", "Colorado Springs", "Aurora", "Fort Collins", "Lakewood", "Boulder"] },
  { name: "Minnesota", slug: "minnesota", costMultiplier: 1.05, license: "Home Care Providers licensed by the MN Department of Health.", notes: "Elderly Waiver funds home and community-based care for seniors 65+.", cities: ["Minneapolis", "St. Paul", "Rochester", "Duluth", "Bloomington", "Brooklyn Park"] },
  { name: "South Carolina", slug: "south-carolina", costMultiplier: 0.90, license: "In-home care providers licensed by SC DHEC.", notes: "Community Choices Waiver funds home care for eligible Medicaid seniors.", cities: ["Columbia", "Charleston", "North Charleston", "Mount Pleasant", "Rock Hill", "Greenville"] },
  { name: "Oregon", slug: "oregon", costMultiplier: 1.05, license: "In-home Care Agencies licensed by the OR Health Authority.", notes: "K Plan Medicaid program funds home-based long-term services.", cities: ["Portland", "Salem", "Eugene", "Gresham", "Hillsboro", "Bend"] },
];

const BASE_BANDS = [
  { name: "Companionship", low: 20, high: 35, icon: Users },
  { name: "Household Help", low: 25, high: 45, icon: Home },
  { name: "Personal Care", low: 28, high: 50, icon: HandHeart },
  { name: "Dementia Care", low: 30, high: 55, icon: Heart },
  { name: "Respite Care", low: 25, high: 45, icon: Repeat },
  { name: "Skilled Nursing", low: 45, high: 80, icon: Stethoscope },
];

export const Route = createFileRoute("/senior-care/$state")({
  loader: ({ params }): StateInfo => {
    const info = STATES.find((s) => s.slug === params.state);
    if (!info) throw notFound();
    return info;
  },
  head: ({ params, loaderData }) => {
    if (!loaderData) {
      return {
        meta: [
          { title: "State not found — CompanionCare" },
          { name: "robots", content: "noindex" },
        ],
      };
    }
    const s = loaderData;
    return marketingHead({
      path: `/senior-care/${params.state}`,
      title: `Senior Care in ${s.name} — Rates, Rules & Verified Helpers | CompanionCare`,
      description: `In-home senior care across ${s.name}. Real local hourly rates for companionship, personal care, and skilled nursing. ${s.license}`,
    });
  },
  component: StatePage,
  notFoundComponent: NotFound,
});

function NotFound() {
  return (
    <div className="min-h-dvh bg-background text-foreground">
      <SiteHeader />
      <div className="mx-auto max-w-3xl px-5 py-24 text-center lg:px-10">
        <h1 className="font-serif text-4xl">State page not available yet</h1>
        <p className="mt-4 text-lg text-muted-foreground">
          We're expanding state-by-state. In the meantime, browse the main senior care hub.
        </p>
        <Link
          to="/senior-care"
          className="mt-8 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 font-semibold text-primary-foreground"
        >
          Back to senior care <ArrowRight className="size-4" />
        </Link>
      </div>
      <SiteFooter />
    </div>
  );
}

function StatePage() {
  const s = Route.useLoaderData();
  const bands = BASE_BANDS.map((b) => ({
    ...b,
    low: Math.round(b.low * s.costMultiplier),
    high: Math.round(b.high * s.costMultiplier),
  }));

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "Senior Care", item: `${SITE_URL}/senior-care` },
      { "@type": "ListItem", position: 3, name: `Senior Care in ${s.name}`, item: `${SITE_URL}/senior-care/${s.slug}` },
    ],
  };

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <SiteHeader />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <section className="border-b border-border bg-warm-cream">
        <div className="mx-auto max-w-7xl px-5 py-14 lg:px-10 lg:py-20">
          <nav className="mb-6 text-sm text-muted-foreground">
            <Link to="/" className="hover:underline">Home</Link>
            {" / "}
            <Link to="/senior-care" className="hover:underline">Senior Care</Link>
            {" / "}
            <span className="text-foreground">{s.name}</span>
          </nav>
          <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-base font-semibold text-primary">
            <MapPin className="size-5" /> {s.name}
          </span>
          <h1 className="mt-6 font-serif text-4xl leading-tight tracking-tight sm:text-5xl lg:text-6xl">
            Senior care at home in {s.name}.
          </h1>
          <p className="mt-6 max-w-3xl text-xl text-muted-foreground">
            Verified local helpers for companionship, personal care, housekeeping, dementia support, and skilled nursing across {s.name}. Real rates, transparent verification, and family involvement only when the senior invites it.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to="/auth"
              search={{ mode: "signup" }}
              className="group inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-base font-semibold text-primary-foreground shadow-soft hover:bg-primary/90"
            >
              Start your care plan <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              to="/how-it-works"
              className="inline-flex items-center gap-2 rounded-full border-2 border-primary bg-card px-6 py-3 text-base font-semibold text-primary hover:bg-secondary"
            >
              See how it works
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-16 lg:px-10">
        <div className="max-w-3xl">
          <span className="inline-flex items-center gap-2 rounded-full bg-accent/15 px-4 py-2 text-base font-semibold text-accent">
            <Wallet className="size-5" /> {s.name} hourly rates
          </span>
          <h2 className="mt-4 font-serif text-3xl tracking-tight sm:text-4xl">
            Typical rates in {s.name}.
          </h2>
          <p className="mt-3 text-lg text-muted-foreground">
            Estimated ranges based on national data adjusted for {s.name}. You'll see each helper's exact rate on their profile.
          </p>
        </div>
        <ul className="mt-8 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {bands.map((b) => (
            <li key={b.name} className="surface-card p-5">
              <div className="flex items-center gap-3">
                <span className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary">
                  <b.icon className="size-5" />
                </span>
                <p className="text-base font-semibold">{b.name}</p>
              </div>
              <p className="mt-3 font-serif text-3xl text-primary">
                ${b.low}–${b.high}
                <span className="ml-1 text-base text-muted-foreground">/hr</span>
              </p>
            </li>
          ))}
        </ul>
      </section>

      <section className="border-y border-border bg-secondary/40">
        <div className="mx-auto max-w-7xl px-5 py-16 lg:px-10">
          <div className="grid gap-8 lg:grid-cols-2">
            <div className="surface-card p-6 md:p-8">
              <h2 className="font-serif text-2xl tracking-tight sm:text-3xl">Licensing in {s.name}</h2>
              <p className="mt-4 text-base text-muted-foreground">{s.license}</p>
              <p className="mt-3 text-sm text-muted-foreground">
                CompanionCare verifies applicable state credentials for every helper who lists personal care or nursing services in {s.name}.
              </p>
            </div>
            <div className="surface-card p-6 md:p-8">
              <h2 className="font-serif text-2xl tracking-tight sm:text-3xl">Public benefits in {s.name}</h2>
              <p className="mt-4 text-base text-muted-foreground">{s.notes}</p>
              <p className="mt-3 text-sm text-muted-foreground">
                Message us for a plain-language walkthrough of what may apply to your household.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-16 lg:px-10">
        <h2 className="font-serif text-3xl tracking-tight sm:text-4xl">Cities we serve in {s.name}</h2>
        <p className="mt-3 text-lg text-muted-foreground">
          Verified helpers across major {s.name} metros — and growing.
        </p>
        <ul className="mt-8 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
          {s.cities.map((city: string) => (
            <li key={city}>
              <span className="flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2.5 text-sm font-medium">
                <MapPin className="size-4 shrink-0 text-primary" />
                {city}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="border-t border-border bg-warm-cream">
        <div className="mx-auto max-w-7xl px-5 py-16 lg:px-10">
          <h2 className="font-serif text-3xl tracking-tight sm:text-4xl">How CompanionCare works in {s.name}</h2>
          <ol className="mt-8 grid gap-4 md:grid-cols-3">
            {[
              { n: 1, t: "Tell us what's needed", b: "One question at a time, with voice input and large text on every field." },
              { n: 2, t: "See verified matches nearby", b: "Local helpers with the exact checks that apply in {s}." },
              { n: 3, t: "Book with confidence", b: "Live selfie + GPS check-in on every visit. Cancel free up to 24 hrs ahead." },
            ].map((step) => (
              <li key={step.n} className="surface-card p-6">
                <span className="grid size-12 place-items-center rounded-full bg-primary text-primary-foreground font-serif text-xl">
                  {step.n}
                </span>
                <h3 className="mt-4 text-xl font-semibold">{step.t}</h3>
                <p className="mt-2 text-base text-muted-foreground">{step.b.replace("{s}", s.name)}</p>
              </li>
            ))}
          </ol>
          <div className="mt-10 flex flex-wrap items-center gap-3">
            <ShieldCheck className="size-5 text-primary" />
            <span className="text-base font-semibold">Five checks, refreshed monthly.</span>
            <Link to="/trust" className="inline-flex items-center gap-1 text-base font-semibold text-primary hover:underline">
              See the verification playbook <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-16 lg:px-10">
        <h2 className="font-serif text-3xl tracking-tight sm:text-4xl">Explore other states</h2>
        <ul className="mt-8 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {STATES.filter((x) => x.slug !== s.slug).slice(0, 12).map((other) => (
            <li key={other.slug}>
              <Link
                to="/senior-care/$state"
                params={{ state: other.slug }}
                className="flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2.5 text-sm font-medium hover:border-primary hover:bg-secondary"
              >
                <MapPin className="size-4 shrink-0 text-primary" />
                <span className="truncate">{other.name}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="mx-auto max-w-7xl px-5 pb-20 lg:px-10">
        <div className="surface-card grid items-center gap-6 p-8 md:grid-cols-2 md:p-12">
          <div>
            <h2 className="font-serif text-3xl tracking-tight sm:text-4xl">Find your match in {s.name}.</h2>
            <p className="mt-3 text-lg text-muted-foreground">One question at a time. Or call and we'll do it with you.</p>
          </div>
          <div className="flex flex-col gap-3 md:items-end">
            <Link
              to="/auth"
              search={{ mode: "signup" }}
              className="group inline-flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-lg font-semibold text-primary-foreground shadow-soft hover:bg-primary/90"
            >
              Start your care plan <ArrowRight className="size-5" />
            </Link>
            <a
              href={SUPPORT_EMAIL_HREF}
              className="inline-flex items-center justify-center gap-2 rounded-full border-2 border-primary bg-card px-6 py-3 text-lg font-semibold text-primary hover:bg-secondary"
            >
              <Mail className="size-5" /> Ask us a question
            </a>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}

export function generateStaticParams() {
  return STATES.map((s) => ({ state: s.slug }));
}
