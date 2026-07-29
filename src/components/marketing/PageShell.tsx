import { Link } from "@tanstack/react-router";
import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  Phone,
  Menu,
  X,
  ChevronDown,
  ShieldCheck,
  BadgeCheck,
  Sparkles,
} from "lucide-react";

export const PHONE = "1-800-CAREMATCH";
export const PHONE_HREF = `tel:${PHONE.replace(/[^0-9]/g, "")}`;
export const SITE_URL = "https://carematcher.lovable.app";

type NavLink = { to: string; label: string };

const primaryLinks: NavLink[] = [
  { to: "/how-it-works", label: "How it works" },
  { to: "/services", label: "Services" },
  { to: "/pricing", label: "Pricing" },
  { to: "/trust", label: "Trust" },
  { to: "/resources", label: "Resources" },
];

const audienceLinks: NavLink[] = [
  { to: "/for-families", label: "For families" },
  { to: "/for-caregivers", label: "For caregivers" },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [signInOpen, setSignInOpen] = useState(false);
  const signInRef = useRef<HTMLDivElement>(null);

  // Click-outside-to-close instead of onBlur+setTimeout: blur fires the
  // instant focus moves to a portal Link (mousedown, before its own click
  // completes), so a timed blur-close can race the very click it's meant to
  // allow — the classic "first tap on a dropdown item does nothing" bug.
  // Listening for outside clicks only doesn't fire until well after the
  // Link's own click has already navigated.
  useEffect(() => {
    if (!signInOpen) return;
    const onPointerDown = (e: PointerEvent) => {
      if (signInRef.current && !signInRef.current.contains(e.target as Node)) {
        setSignInOpen(false);
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [signInOpen]);

  const portals = [
    { to: "/senior", label: "Senior portal", description: "For older adults" },
    { to: "/family", label: "Family portal", description: "For family coordinators" },
    { to: "/provider", label: "Provider portal", description: "For marketplace providers" },
    { to: "/dashboard", label: "Staff portal", description: "CareMatch team" },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4 lg:px-10">
        <Link
          to="/"
          className="font-serif text-xl font-bold tracking-tight text-foreground"
        >
          CareMatch
        </Link>
        <nav className="hidden items-center gap-0.5 lg:flex">
          {primaryLinks.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="rounded-full px-2.5 py-1.5 text-xs font-medium text-foreground hover:bg-secondary"
              activeProps={{ className: "bg-secondary text-primary" }}
            >
              {l.label}
            </Link>
          ))}
          <div className="relative" ref={signInRef}>
            <button
              onClick={() => setSignInOpen((o) => !o)}
              aria-expanded={signInOpen}
              className="inline-flex items-center gap-1 rounded-full px-2.5 py-1.5 text-xs font-medium text-foreground hover:bg-secondary"
            >
              Sign in <ChevronDown className={`size-3 transition-transform ${signInOpen ? "rotate-180" : ""}`} />

            </button>
            {signInOpen && (
              <div className="absolute right-0 top-full z-50 mt-2 w-72 overflow-hidden rounded-2xl border border-border bg-card shadow-lifted">
                {portals.map((p) => (
                  <Link
                    key={p.to}
                    to={p.to}
                    onClick={() => setSignInOpen(false)}
                    className="block border-b border-border px-4 py-3 last:border-b-0 hover:bg-secondary"
                  >
                    <p className="text-sm font-semibold">{p.label}</p>
                    <p className="text-xs text-muted-foreground">{p.description}</p>
                  </Link>
                ))}
                <Link
                  to="/auth"
                  onClick={() => setSignInOpen(false)}
                  className="block bg-secondary/50 px-4 py-3 text-xs font-semibold text-primary hover:bg-secondary"
                >
                  Or sign in with email →
                </Link>
              </div>
            )}
          </div>
          <a
            href={PHONE_HREF}
            className="ml-2 inline-flex items-center gap-1.5 rounded-full bg-accent px-3 py-1.5 text-xs font-semibold text-accent-foreground hover:opacity-95"
          >
            <Phone className="size-3" /> {PHONE}
          </a>
          <Link
            to="/auth"
            search={{ mode: "signup" }}
            className="ml-1 rounded-full bg-primary px-3.5 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
          >
            Get started
          </Link>

        </nav>


        <div className="flex items-center gap-2 lg:hidden">
          <a
            href={PHONE_HREF}
            aria-label={`Call ${PHONE}`}
            className="grid size-10 place-items-center rounded-full bg-accent text-accent-foreground"
          >
            <Phone className="size-4" />
          </a>
          <button
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            onClick={() => setOpen((o) => !o)}
            className="grid size-10 place-items-center rounded-full border border-input bg-card"
          >
            {open ? <X className="size-4" /> : <Menu className="size-4" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="max-h-[calc(100dvh-4rem)] overflow-y-auto overscroll-contain border-t border-border bg-background lg:hidden">
          <div className="mx-auto flex max-w-7xl flex-col gap-2 px-5 py-4 pb-8">
            {[...primaryLinks, ...audienceLinks].map((l) => (
              <Link
                key={l.to}
                to={l.to}
                onClick={() => setOpen(false)}
                className="rounded-2xl bg-secondary px-4 py-3 text-base font-medium"
              >
                {l.label}
              </Link>
            ))}
            <div className="mt-2 rounded-2xl border border-border bg-card p-2">
              <p className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Sign in
              </p>
              {portals.map((p) => (
                <Link
                  key={p.to}
                  to={p.to}
                  onClick={() => setOpen(false)}
                  className="block rounded-xl px-3 py-2.5 text-sm font-medium hover:bg-secondary"
                >
                  {p.label}
                  <span className="block text-xs font-normal text-muted-foreground">
                    {p.description}
                  </span>
                </Link>
              ))}
              <Link
                to="/auth"
                onClick={() => setOpen(false)}
                className="block rounded-xl px-3 py-2.5 text-xs font-semibold text-primary hover:bg-secondary"
              >
                Or sign in with email →
              </Link>
            </div>
            <Link
              to="/auth"
              search={{ mode: "signup" }}
              onClick={() => setOpen(false)}
              className="mt-1 rounded-2xl bg-primary px-4 py-3 text-center text-base font-semibold text-primary-foreground"
            >
              Get started
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}

export function SiteFooter() {
  const cols: { title: string; links: { to: string; label: string }[] }[] = [
    {
      title: "Services",
      links: [
        { to: "/services", label: "All services" },
        { to: "/services/marketplace", label: "Marketplace" },
        { to: "/services/partners", label: "Partners (personal care)" },
        { to: "/services/healthcare", label: "Healthcare (skilled referrals)" },
      ],
    },
    {
      title: "CareMatch",
      links: [
        { to: "/how-it-works", label: "How it works" },
        { to: "/trust", label: "Trust & verification" },
        { to: "/pricing", label: "Pricing" },
        { to: "/about", label: "About" },
        { to: "/contact", label: "Contact" },
        { to: "/faq", label: "FAQ" },
      ],
    },
    {
      title: "Who it's for",
      links: [
        { to: "/for-families", label: "For families" },
        { to: "/for-caregivers", label: "For providers" },
        { to: "/resources", label: "Resources & guides" },
      ],
    },
    {
      title: "Legal",
      links: [
        { to: "/legal/terms", label: "Terms of Service" },
        { to: "/legal/privacy", label: "Privacy Policy" },
        { to: "/legal/provider-agreement", label: "Provider Agreement" },
        { to: "/legal/independent-contractors", label: "Independent contractors" },
        { to: "/legal/scope-of-practice", label: "Scope of practice" },
        { to: "/legal/state-availability", label: "State availability" },
      ],
    },
  ];


  return (
    <footer className="border-t border-border bg-secondary/40">
      <div className="mx-auto max-w-7xl px-5 py-12 lg:px-10">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
          <div>
            <Link to="/" className="font-serif text-xl font-bold tracking-tight text-foreground">
              CareMatch
            </Link>
            <p className="mt-3 max-w-xs text-sm text-muted-foreground">
              Verified in-home helpers for older adults — matched to care needs, personality, and budget.
            </p>
            <a
              href={PHONE_HREF}
              className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground"
            >
              <Phone className="size-3.5" /> Call {PHONE}
            </a>
          </div>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-[repeat(4,minmax(0,1fr))]">
            {cols.map((col) => (
              <div key={col.title}>
                <p className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
                  {col.title}
                </p>
                <ul className="mt-3 space-y-2 text-sm">
                  {col.links.map((l) => (
                    <li key={l.to}>
                      <Link to={l.to} className="hover:text-primary">
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-10 flex flex-wrap items-center gap-3 border-t border-border pt-6 text-sm">
          <span className="inline-flex items-center gap-2 rounded-full bg-card px-3 py-1.5 font-medium">
            <ShieldCheck className="size-4 text-primary" /> ID + background verified caregivers
          </span>
          <span className="inline-flex items-center gap-2 rounded-full bg-card px-3 py-1.5 font-medium">
            <BadgeCheck className="size-4 text-primary" /> Encrypted data in transit &amp; at rest
          </span>
          <span className="inline-flex items-center gap-2 rounded-full bg-card px-3 py-1.5 font-medium">
            <Sparkles className="size-4 text-primary" /> Consumer service — not a medical provider
          </span>
          <span className="ml-auto text-muted-foreground">
            © {new Date().getFullYear()} CareMatch. Serving families nationwide.
          </span>
        </div>
      </div>
    </footer>
  );
}

export function FloatingCall() {
  return (
    <a
      href={PHONE_HREF}
      aria-label={`Call ${PHONE}`}
      className="fixed bottom-4 right-4 z-40 inline-flex min-h-10 items-center gap-1.5 rounded-full bg-accent px-3 py-2 text-sm font-semibold text-accent-foreground shadow-lifted hover:opacity-95 sm:bottom-5 sm:right-5 sm:min-h-11 sm:px-4 sm:py-2.5 sm:text-base"
    >
      <Phone className="size-4 sm:size-5" />
      <span className="hidden sm:inline">Call us</span>
    </a>
  );
}

export function PageShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh overflow-x-hidden bg-background text-foreground">
      <SiteHeader />
      <main>{children}</main>
      <SiteFooter />
      <FloatingCall />
    </div>
  );
}

export function PageHero({
  eyebrow,
  title,
  lead,
  children,
}: {
  eyebrow?: string;
  title: string;
  lead?: string;
  children?: ReactNode;
}) {
  return (
    <section className="border-b border-border bg-warm-cream">
      <div className="mx-auto max-w-5xl px-5 py-16 lg:px-10 lg:py-24">
        {eyebrow && (
          <p className="text-sm font-semibold uppercase tracking-widest text-primary">
            {eyebrow}
          </p>
        )}
        <h1 className="mt-3 font-serif text-4xl leading-[1.1] tracking-tight text-balance sm:text-5xl lg:text-6xl">
          {title}
        </h1>
        {lead && (
          <p className="mt-5 max-w-3xl text-xl text-muted-foreground text-pretty">{lead}</p>
        )}
        {children && <div className="mt-8">{children}</div>}
      </div>
    </section>
  );
}

export function CTASection({
  title = "Ready to find your match?",
  lead = "Start with one question. We'll take it from there — online or on the phone.",
}: {
  title?: string;
  lead?: string;
}) {
  return (
    <section className="mx-auto max-w-7xl px-5 py-16 lg:px-10 lg:py-20">
      <div className="surface-card grid items-center gap-8 p-10 md:grid-cols-2 md:p-14">
        <div>
          <h2 className="font-serif text-3xl tracking-tight text-balance sm:text-4xl">{title}</h2>
          <p className="mt-3 text-lg text-muted-foreground text-pretty">{lead}</p>
        </div>
        <div className="flex flex-col gap-3">
          <Link
            to="/auth"
            search={{ mode: "signup" }}
            className="inline-flex items-center justify-center rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-lifted hover:bg-primary/90 sm:px-6 sm:py-3 sm:text-base"
          >
            Get started
          </Link>
          <a
            href={PHONE_HREF}
            className="inline-flex items-center justify-center gap-2 rounded-full border-2 border-accent bg-card px-5 py-2.5 text-sm font-semibold text-accent hover:bg-accent/10 sm:px-6 sm:py-3 sm:text-base"
          >
            <Phone className="size-4 sm:size-5" /> Call {PHONE}
          </a>
        </div>
      </div>
    </section>
  );
}

/** SEO helper: build a leaf-route head() object with self-referencing canonical + og:url. */
export function marketingHead({
  path,
  title,
  description,
  ogType = "website",
  extraMeta = [],
  jsonLd,
}: {
  path: string;
  title: string;
  description: string;
  ogType?: string;
  extraMeta?: { name?: string; property?: string; content: string }[];
  jsonLd?: unknown | unknown[];
}) {
  const url = `${SITE_URL}${path}`;
  const scripts = jsonLd
    ? (Array.isArray(jsonLd) ? jsonLd : [jsonLd]).map((data) => ({
        type: "application/ld+json",
        children: JSON.stringify(data),
      }))
    : undefined;
  return {
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: ogType },
      { property: "og:url", content: url },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: title },
      { name: "twitter:description", content: description },
      ...extraMeta,
    ],
    links: [{ rel: "canonical", href: url }],
    ...(scripts ? { scripts } : {}),
  };
}
