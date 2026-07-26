import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { PageShell, PageHero, CTASection, marketingHead } from "@/components/marketing/PageShell";

const faqs = [
  {
    q: "How much does CareMatch cost?",
    a: "Hourly rates range from $18–$26/hr for household help, $20–$28/hr for companionship, and $24–$34/hr for personal care. Monthly plans start around $800 for essentials and scale with hours and care level. Use the budget slider on the pricing page to preview real plans at your price.",
  },
  {
    q: "How does CareMatch verify caregivers?",
    a: "Every helper clears five checks: (1) identity proofing with live selfie + government ID, (2) national multi-jurisdiction background check, (3) credential verification for licensed roles, (4) continuous monthly re-checks, and (5) live selfie + GPS check-in at every single visit.",
  },
  {
    q: "Can I cancel or reschedule a visit?",
    a: "Yes. Cancel or reschedule any visit up to 4 hours before it starts, at no charge. Life happens, and the platform is built around that.",
  },
  {
    q: "What if something goes wrong during a visit?",
    a: "Call our 24/7 concierge at 1-800-CAREMATCH. Every helper is covered by CareMatch's insurance, and our safety team responds within minutes — not business days.",
  },
  {
    q: "Can my family see what's happening?",
    a: "Only if the senior invites them. Older adults approve every family connection and can revoke access anytime. Family members see visits, verifications, and budget — never private messages the senior hasn't shared.",
  },
  {
    q: "Does CareMatch accept Medicare, Medicaid, or long-term care insurance?",
    a: "Skilled care visits can be billed to insurance where eligible via CareMatch's licensed partners. Household help, companionship, and personal care are typically private-pay. Our concierge can walk you through what's coverable in your state.",
  },
  {
    q: "What if I don't have a smartphone?",
    a: "You never need one. Everything CareMatch does digitally can be done by phone with a real concierge team. Same options, same helpers, same care.",
  },
  {
    q: "How do I know the person showing up is the right person?",
    a: "At every visit, the helper takes a live selfie at your door. CareMatch matches it to their verified ID and confirms GPS at the arrival address — you see 'verified on arrival' before they ring the bell.",
  },
  {
    q: "What areas does CareMatch serve?",
    a: "CareMatch matches families with verified helpers across all 50 U.S. states, in major metros and many smaller communities. Call the concierge for local availability in your ZIP code.",
  },
  {
    q: "Is CareMatch different from Care.com or Honor?",
    a: "CareMatch runs a marketplace model with continuous monthly re-verification, live selfie + GPS check-in at every visit, and a transparent budget optimizer. We are trust-first: seniors approve every action and family members propose but don't override.",
  },
];

export const Route = createFileRoute("/faq")({
  head: () =>
    marketingHead({
      path: "/faq",
      title: "CareMatch FAQ — Verification, pricing, and safety",
      description:
        "Answers to the most common CareMatch questions: how verification works, what it costs, cancellation policy, insurance coverage, and family access controls.",
      jsonLd: {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: faqs.map((f) => ({
          "@type": "Question",
          name: f.q,
          acceptedAnswer: { "@type": "Answer", text: f.a },
        })),
      },
    }),
  component: FaqPage,
});

function Row({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <li className="surface-card overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-4 p-5 text-left hover:bg-secondary/50"
      >
        <span className="text-xl font-semibold">{q}</span>
        <ChevronDown className={`size-6 shrink-0 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} aria-hidden />
      </button>
      {open && <div className="border-t border-border p-5 text-lg text-foreground">{a}</div>}
    </li>
  );
}

function FaqPage() {
  return (
    <PageShell>
      <PageHero
        eyebrow="FAQ"
        title="Answers, in plain language."
        lead="The questions families most often ask before booking their first visit."
      />
      <section className="mx-auto max-w-4xl px-5 py-16 lg:px-10">
        <ul className="flex flex-col gap-3">
          {faqs.map((f) => (
            <Row key={f.q} q={f.q} a={f.a} />
          ))}
        </ul>
      </section>
      <CTASection />
    </PageShell>
  );
}
