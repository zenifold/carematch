import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2, XCircle } from "lucide-react";
import { PageShell, PageHero, marketingHead } from "@/components/marketing/PageShell";

const scopes = [
  {
    tier: "Marketplace",
    to: "/services/marketplace",
    can: ["Grocery shopping, errands, and rides", "House cleaning, laundry, and meal prep", "Friendly visits, walks, and companionship", "Medication reminders (prompts only)", "Handyman, yard, and tech help", "Pet care and dog walks"],
    cant: ["Bathing, dressing, or toileting", "Transfers and mobility assists", "Administering medication", "Wound care, injections, or any clinical task", "Advising on medical conditions"],
  },

  {
    tier: "Partners",
    to: "/services/partners",
    can: ["Bathing, dressing, personal hygiene", "Toileting & incontinence care", "Transfers and mobility support", "Feeding assistance", "Positioning and skin care", "Overnight and dementia-informed care"],
    cant: ["Skilled nursing tasks", "Wound care requiring RN", "Physical, occupational, or speech therapy", "Medication administration outside state scope"],
  },
  {
    tier: "Healthcare",
    to: "/services/healthcare",
    can: ["Skilled nursing visits (RN/LPN)", "Wound care", "Physical, occupational, speech therapy", "Physician-ordered plan of care"],
    cant: ["Provided by CompanionCare directly — referral only to a Medicare-certified home health agency"],
  },
];

export const Route = createFileRoute("/legal/scope-of-practice")({
  head: () =>
    marketingHead({
      path: "/legal/scope-of-practice",
      title: "Scope of Practice — What each CompanionCare service does",
      description:
        "Exactly what Marketplace helpers, Partner personal care aides, and Healthcare clinicians can and cannot do on CompanionCare. Scope-of-practice policy across our three services.",
    }),
  component: ScopePage,
});

function ScopePage() {
  return (
    <PageShell>
      <PageHero
        eyebrow="Legal · Platform policy"
        title="Scope of practice"
        lead="A clear line between social and household support, hands-on personal care, and skilled clinical services — enforced in the app so every helper stays inside what they're trained and licensed to do."
      />


      <section className="mx-auto max-w-5xl px-5 py-16 lg:px-10 space-y-8">
        {scopes.map((s) => (
          <div key={s.tier} className="surface-card p-8">
            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <h2 className="font-serif text-2xl">{s.tier}</h2>
              <Link to={s.to} className="text-sm font-semibold text-primary hover:underline">
                See service details →
              </Link>
            </div>
            <div className="mt-6 grid gap-6 md:grid-cols-2">
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wider text-primary">Can do</h3>
                <ul className="mt-3 space-y-2">
                  {s.can.map((c) => (
                    <li key={c} className="flex items-start gap-3">
                      <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden />
                      <span className="text-base">{c}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Cannot do</h3>
                <ul className="mt-3 space-y-2">
                  {s.cant.map((c) => (
                    <li key={c} className="flex items-start gap-3">
                      <XCircle className="mt-0.5 size-5 shrink-0 text-muted-foreground/60" aria-hidden />
                      <span className="text-base text-muted-foreground">{c}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        ))}

        <div className="rounded-2xl border border-border bg-secondary/40 p-6 text-sm text-muted-foreground">
          <p>
            CompanionCare enforces scope of practice by restricting the task menu each helper can accept. Attempts to
            book out-of-scope tasks are routed to the right service — or, for skilled needs, to a Medicare-certified
            partner via <Link to="/services/healthcare" className="font-medium text-primary hover:underline">CompanionCare Healthcare</Link>.
          </p>
        </div>

      </section>
    </PageShell>
  );
}
