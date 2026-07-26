import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowRight, Search, Sparkles, Mail, BookOpen } from "lucide-react";
import { PageShell, PageHero, CTASection, marketingHead, SITE_URL } from "@/components/marketing/PageShell";

type Slug =
  | "aging-in-place-checklist"
  | "how-to-choose-a-caregiver"
  | "dementia-care-tips"
  | "cost-of-in-home-care"
  | "signs-parent-needs-help"
  | "medicare-medicaid-home-care"
  | "fall-prevention-seniors"
  | "companion-vs-personal-care"
  | "respite-care-guide"
  | "hospital-to-home-transition"
  | "caregiver-burnout"
  | "how-to-talk-to-parent-about-care"
  | "live-in-vs-24-hour-care"
  | "memory-care-at-home-vs-facility"
  | "medication-management-seniors"
  | "bathing-help-seniors"
  | "long-distance-caregiving"
  | "paying-family-caregiver"
  | "sundowning-strategies"
  | "hospice-vs-palliative-care"
  | "senior-nutrition-guide"
  | "home-health-vs-home-care";

type PostTo =
  | "/resources/aging-in-place-checklist"
  | "/resources/how-to-choose-a-caregiver"
  | "/resources/dementia-care-tips"
  | "/resources/cost-of-in-home-care"
  | "/resources/signs-parent-needs-help"
  | "/resources/medicare-medicaid-home-care"
  | "/resources/fall-prevention-seniors"
  | "/resources/companion-vs-personal-care"
  | "/resources/respite-care-guide"
  | "/resources/hospital-to-home-transition"
  | "/resources/caregiver-burnout"
  | "/resources/how-to-talk-to-parent-about-care"
  | "/resources/live-in-vs-24-hour-care"
  | "/resources/memory-care-at-home-vs-facility"
  | "/resources/medication-management-seniors"
  | "/resources/bathing-help-seniors"
  | "/resources/long-distance-caregiving"
  | "/resources/paying-family-caregiver"
  | "/resources/sundowning-strategies"
  | "/resources/hospice-vs-palliative-care"
  | "/resources/senior-nutrition-guide"
  | "/resources/home-health-vs-home-care";

export type Post = {
  slug: Slug;
  to: PostTo;
  title: string;
  excerpt: string;
  date: string;
  readMins: number;
  category: "Planning" | "Guides" | "Dementia" | "Costs" | "Safety" | "Health";
  featured?: boolean;
};

export const posts: Post[] = [
  {
    slug: "home-health-vs-home-care",
    to: "/resources/home-health-vs-home-care",
    title: "Home Health vs Home Care: A Family's Guide to the Difference",
    excerpt:
      "Home Health is clinical, Medicare-eligible skilled care. Home Care is non-clinical companionship and personal help. How to tell which one your parent actually needs.",
    date: "2026-07-14",
    readMins: 8,
    category: "Guides",
    featured: true,
  },
  {
    slug: "medication-management-seniors",
    to: "/resources/medication-management-seniors",
    title: "Medication Management for Seniors: The System That Prevents ER Visits",
    excerpt:
      "Adults 65+ on 5 or more medications have a >90% chance of drug interactions. The pharmacist review, pill-box system, and warning signs that keep older adults out of the ER.",
    date: "2026-07-12",
    readMins: 10,
    category: "Health",
    featured: true,
  },
  {
    slug: "bathing-help-seniors",
    to: "/resources/bathing-help-seniors",
    title: "When a Parent Refuses to Bathe: A Compassionate Playbook",
    excerpt:
      "Bathing refusal is almost never about vanity — it's fear, cold, or pain. Why it happens, what to say, and the equipment that turns a fight into a 10-minute task.",
    date: "2026-07-10",
    readMins: 9,
    category: "Guides",
  },
  {
    slug: "long-distance-caregiving",
    to: "/resources/long-distance-caregiving",
    title: "Long-Distance Caregiving: Managing Care From 1,000 Miles Away",
    excerpt:
      "The five-person 'circle', the weekly rhythm, and the tools that let 7 million Americans manage a parent's care from far away — without moving.",
    date: "2026-07-06",
    readMins: 11,
    category: "Planning",
  },
  {
    slug: "paying-family-caregiver",
    to: "/resources/paying-family-caregiver",
    title: "Can I Get Paid to Care for My Parent? The 2026 Guide",
    excerpt:
      "Medicaid (in every state), the VA, long-term care insurance, and family caregiver agreements. What each program pays, who qualifies, and how to actually apply.",
    date: "2026-07-04",
    readMins: 11,
    category: "Costs",
  },
  {
    slug: "sundowning-strategies",
    to: "/resources/sundowning-strategies",
    title: "Sundowning: Why Late Afternoon Gets Hard, and What Actually Helps",
    excerpt:
      "The evidence-based routine — morning light, meals, activity, environment — that reduces late-day confusion and agitation in dementia without medication.",
    date: "2026-07-01",
    readMins: 9,
    category: "Dementia",
  },
  {
    slug: "hospice-vs-palliative-care",
    to: "/resources/hospice-vs-palliative-care",
    title: "Hospice vs Palliative Care: A Family's Plain-English Guide",
    excerpt:
      "Palliative care can start at diagnosis. Hospice is the Medicare benefit for the last 6 months. What each pays for, what they don't cover, and when to ask.",
    date: "2026-06-27",
    readMins: 10,
    category: "Health",
  },
  {
    slug: "senior-nutrition-guide",
    to: "/resources/senior-nutrition-guide",
    title: "Senior Nutrition: Why Older Adults Stop Eating, and How to Fix It",
    excerpt:
      "1 in 2 older adults is at risk of malnutrition. The causes — appetite loss, dental, meds, loneliness — and the practical fixes that get real food back on the plate.",
    date: "2026-06-25",
    readMins: 9,
    category: "Health",
  },
  {
    slug: "respite-care-guide",
    to: "/resources/respite-care-guide",
    title: "Respite Care: What It Is, Who Pays, and How to Actually Get a Break",
    excerpt:
      "A plain-English guide to respite care in 2026 — what Medicare, Medicaid, the VA, and private pay cover, and how to arrange in-home, adult day, or short-stay respite without the guilt.",
    date: "2026-07-08",
    readMins: 12,
    category: "Costs",
  },
  {
    slug: "hospital-to-home-transition",
    to: "/resources/hospital-to-home-transition",
    title: "Hospital-to-Home Discharge: The 7-Day Checklist That Prevents Readmission",
    excerpt:
      "1 in 5 Medicare patients over 65 is readmitted within 30 days. A day-by-day checklist — medications, follow-up, home setup, red flags — for the riskiest week of the year.",
    date: "2026-07-05",
    readMins: 13,
    category: "Health",
  },
  {
    slug: "caregiver-burnout",
    to: "/resources/caregiver-burnout",
    title: "Caregiver Burnout: The Warning Signs and a Realistic Recovery Plan",
    excerpt:
      "Burnout is a clinical syndrome, not a character flaw. The nine early signs, the four things that actually help, and how to build a sustainable caregiving routine.",
    date: "2026-07-02",
    readMins: 10,
    category: "Health",
  },
  {
    slug: "cost-of-in-home-care",
    to: "/resources/cost-of-in-home-care",
    title: "How Much Does In-Home Care Cost in 2026?",
    excerpt:
      "What in-home care actually costs in 2026 — companion care vs personal care vs skilled nursing, agency vs marketplace, and what Medicare and Medicaid cover.",
    date: "2026-07-01",
    readMins: 11,
    category: "Costs",
  },
  {
    slug: "how-to-talk-to-parent-about-care",
    to: "/resources/how-to-talk-to-parent-about-care",
    title: "How to Talk to Your Parent About Getting Help at Home",
    excerpt:
      "The conversation adult children dread. A therapist- and geriatric-care-manager-vetted script — how to frame it, what to avoid, and how to handle 'no.'",
    date: "2026-06-28",
    readMins: 9,
    category: "Planning",
  },
  {
    slug: "signs-parent-needs-help",
    to: "/resources/signs-parent-needs-help",
    title: "10 Signs Your Aging Parent Needs Help at Home",
    excerpt:
      "The quiet signals — unopened mail, weight loss, a fridge full of expired food — that adult children usually notice first, and what to do next.",
    date: "2026-06-24",
    readMins: 9,
    category: "Planning",
  },
  {
    slug: "live-in-vs-24-hour-care",
    to: "/resources/live-in-vs-24-hour-care",
    title: "Live-In Care vs 24-Hour Care: The Real Cost Difference",
    excerpt:
      "Two arrangements that sound similar and cost very differently. What each includes, what each costs in 2026, and which one your situation actually needs.",
    date: "2026-06-20",
    readMins: 11,
    category: "Costs",
  },
  {
    slug: "medicare-medicaid-home-care",
    to: "/resources/medicare-medicaid-home-care",
    title: "Does Medicare Pay for Home Care? A Plain-English Guide",
    excerpt:
      "What Medicare, Medicare Advantage, and Medicaid actually cover for home health and non-medical home care — and where private pay picks up.",
    date: "2026-06-16",
    readMins: 10,
    category: "Costs",
  },
  {
    slug: "memory-care-at-home-vs-facility",
    to: "/resources/memory-care-at-home-vs-facility",
    title: "Memory Care at Home vs Memory Care Facility: Which Is Right?",
    excerpt:
      "A decision framework based on stage, safety, cost, and quality of life — with the questions to ask before either path.",
    date: "2026-06-13",
    readMins: 12,
    category: "Dementia",
  },
  {
    slug: "fall-prevention-seniors",
    to: "/resources/fall-prevention-seniors",
    title: "Fall Prevention at Home: A Room-by-Room Guide",
    excerpt:
      "One in four older adults falls each year. A practical room-by-room walkthrough of the fixes that reduce that risk the most.",
    date: "2026-06-09",
    readMins: 8,
    category: "Safety",
  },
  {
    slug: "aging-in-place-checklist",
    to: "/resources/aging-in-place-checklist",
    title: "The Aging-in-Place Checklist Every Family Should Have",
    excerpt:
      "A practical, room-by-room guide to keeping an older adult safe at home — plus what to plan for before it's urgent.",
    date: "2026-06-02",
    readMins: 8,
    category: "Planning",
  },
  {
    slug: "companion-vs-personal-care",
    to: "/resources/companion-vs-personal-care",
    title: "Companion Care vs Personal Care vs Skilled Nursing",
    excerpt:
      "The three tiers of in-home care explained: what each one covers, who provides it, what it costs, and how to know which one you actually need.",
    date: "2026-05-25",
    readMins: 9,
    category: "Guides",
  },
  {
    slug: "how-to-choose-a-caregiver",
    to: "/resources/how-to-choose-a-caregiver",
    title: "How to Choose an In-Home Caregiver (Without Losing Sleep)",
    excerpt:
      "The seven questions to ask, the red flags to walk away from, and how to tell verification from marketing.",
    date: "2026-05-18",
    readMins: 10,
    category: "Guides",
  },
  {
    slug: "dementia-care-tips",
    to: "/resources/dementia-care-tips",
    title: "10 Small Changes That Make Dementia Care at Home Easier",
    excerpt:
      "Lighting, routine, language, and environment tweaks that consistently help — endorsed by geriatric care managers.",
    date: "2026-04-27",
    readMins: 7,
    category: "Dementia",
  },
];


const categories = ["All", "Planning", "Guides", "Costs", "Safety", "Dementia", "Health"] as const;
type Category = (typeof categories)[number];

export const Route = createFileRoute("/resources/")({
  head: () =>
    marketingHead({
      path: "/resources",
      title: "Resources — Guides for family caregivers of older adults",
      description:
        "Practical, expert-reviewed guides for family caregivers: costs of home care, signs a parent needs help, Medicare vs Medicaid, fall prevention, dementia care, and more.",
      jsonLd: {
        "@context": "https://schema.org",
        "@type": "Blog",
        name: "CareMatch Resources",
        url: `${SITE_URL}/resources`,
        blogPost: posts.map((p) => ({
          "@type": "BlogPosting",
          headline: p.title,
          url: `${SITE_URL}${p.to}`,
          datePublished: p.date,
          description: p.excerpt,
          articleSection: p.category,
        })),
      },
    }),
  component: ResourcesHub,
});

function ResourcesHub() {
  const [category, setCategory] = useState<Category>("All");
  const [query, setQuery] = useState("");

  const featured = posts.find((p) => p.featured) ?? posts[0];
  const rest = posts.filter((p) => p.slug !== featured.slug);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rest.filter((p) => {
      const okCat = category === "All" || p.category === category;
      const okQ =
        !q ||
        p.title.toLowerCase().includes(q) ||
        p.excerpt.toLowerCase().includes(q);
      return okCat && okQ;
    });
  }, [rest, category, query]);

  return (
    <PageShell>
      <PageHero
        eyebrow="Resources"
        title="Guides for the questions no one hands you a manual for."
        lead="Practical, expert-reviewed articles for family caregivers — from planning ahead to handling the hard days. Free, updated regularly, no email required."
      />

      {/* Featured post */}
      <section className="mx-auto max-w-6xl px-5 pt-8 lg:px-10">
        <Link
          to={featured.to}
          className="group grid gap-8 rounded-3xl border border-border bg-card p-6 transition-colors hover:border-primary/40 md:grid-cols-12 md:gap-10 md:p-10"
        >
          <div className="md:col-span-7">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.15em] text-primary">
                <Sparkles className="size-3.5" /> Featured
              </span>
              <span className="text-[11px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
                {featured.category} · {featured.readMins} min read
              </span>
            </div>
            <h2 className="mt-4 font-serif text-4xl leading-tight tracking-tight md:text-5xl">
              {featured.title}
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
              {featured.excerpt}
            </p>
            <p className="mt-6 inline-flex items-center gap-2 text-base font-semibold text-primary">
              Read the guide
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
            </p>
          </div>
          <div className="md:col-span-5">
            <div className="relative flex h-full min-h-[220px] flex-col justify-between overflow-hidden rounded-2xl bg-gradient-to-br from-primary/15 via-primary/5 to-transparent p-6">
              <BookOpen className="size-8 text-primary/60" strokeWidth={1.5} />
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary/70">
                  Updated
                </p>
                <p className="mt-1 font-serif text-2xl">
                  {new Date(featured.date).toLocaleDateString(undefined, {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
              </div>
            </div>
          </div>
        </Link>
      </section>

      {/* Filter + Search */}
      <section className="mx-auto mt-14 max-w-6xl px-5 lg:px-10">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap gap-2">
            {categories.map((c) => {
              const active = c === category;
              return (
                <button
                  key={c}
                  onClick={() => setCategory(c)}
                  className={`rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
                    active
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-background text-foreground/70 hover:border-primary/40 hover:text-foreground"
                  }`}
                >
                  {c}
                </button>
              );
            })}
          </div>
          <label className="relative flex w-full items-center md:w-72">
            <Search className="absolute left-4 size-4 text-muted-foreground" aria-hidden />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search guides…"
              className="w-full rounded-full border border-border bg-background py-2.5 pl-11 pr-4 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </label>
        </div>

        {/* Grid */}
        <ul className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((p) => (
            <li key={p.slug}>
              <Link
                to={p.to}
                className="group flex h-full flex-col rounded-3xl border border-border bg-card p-6 transition-colors hover:border-primary/40 hover:bg-secondary/30"
              >
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-primary">
                  {p.category}
                </p>
                <h3 className="mt-3 font-serif text-xl leading-snug">{p.title}</h3>
                <p className="mt-3 flex-1 text-base text-muted-foreground">{p.excerpt}</p>
                <p className="mt-5 flex items-center justify-between text-sm text-muted-foreground">
                  <span>
                    {new Date(p.date).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}{" "}
                    · {p.readMins} min
                  </span>
                  <ArrowRight className="size-4 text-primary transition-transform group-hover:translate-x-1" />
                </p>
              </Link>
            </li>
          ))}
        </ul>

        {filtered.length === 0 && (
          <p className="mt-10 rounded-2xl border border-dashed border-border bg-secondary/30 p-8 text-center text-muted-foreground">
            No guides match that search yet. Try another category or reset the filter.
          </p>
        )}
      </section>

      {/* Newsletter card */}
      <section className="mx-auto max-w-6xl px-5 py-20 lg:px-10">
        <div className="relative overflow-hidden rounded-3xl bg-primary p-8 text-primary-foreground md:p-12">
          <span
            aria-hidden
            className="pointer-events-none absolute -right-6 -top-10 select-none font-serif text-[10rem] italic leading-none text-primary-foreground/[0.08] md:text-[14rem]"
          >
            &
          </span>
          <div className="relative z-10 grid gap-8 md:grid-cols-12 md:items-center">
            <div className="md:col-span-7">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary-foreground/60">
                One monthly note
              </p>
              <h2 className="mt-3 font-serif text-3xl leading-tight md:text-4xl">
                The Caregiver Notebook — a short, useful email once a month.
              </h2>
              <p className="mt-4 max-w-xl text-lg text-primary-foreground/85">
                New guides, a family-favorite tip, and one small thing you can do this
                week for the older adult in your life. No spam. Unsubscribe anytime.
              </p>
            </div>
            <form
              className="md:col-span-5"
              onSubmit={(e) => {
                e.preventDefault();
                alert("Thanks — we'll be in touch. (Newsletter wiring coming soon.)");
              }}
            >
              <label className="block">
                <span className="sr-only">Email address</span>
                <div className="flex flex-col gap-2 rounded-2xl bg-primary-foreground/10 p-2 sm:flex-row">
                  <div className="flex flex-1 items-center gap-2 rounded-xl bg-background px-4 text-foreground">
                    <Mail className="size-4 text-muted-foreground" aria-hidden />
                    <input
                      required
                      type="email"
                      placeholder="you@family.com"
                      className="w-full bg-transparent py-3 text-base focus:outline-none"
                    />
                  </div>
                  <button
                    type="submit"
                    className="rounded-xl bg-primary-foreground px-5 py-3 text-sm font-semibold text-primary transition-colors hover:bg-primary-foreground/90"
                  >
                    Subscribe
                  </button>
                </div>
              </label>
              <p className="mt-3 text-xs text-primary-foreground/60">
                We'll never sell your email. One-click unsubscribe on every message.
              </p>
            </form>
          </div>
        </div>
      </section>

      <CTASection />
    </PageShell>
  );
}
