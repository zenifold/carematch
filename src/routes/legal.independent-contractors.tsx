import { createFileRoute, Link } from "@tanstack/react-router";
import { FileText, ShieldCheck, Scale } from "lucide-react";
import { PageShell, PageHero, marketingHead } from "@/components/marketing/PageShell";

export const Route = createFileRoute("/legal/independent-contractors")({
  head: () =>
    marketingHead({
      path: "/legal/independent-contractors",
      title: "Independent Contractor Policy — CompanionCare",
      description:
        "How CompanionCare works with independent Helpers and Companions. Platform role, provider classification, insurance, and what CompanionCare does and does not do as a technology marketplace.",
    }),
  component: ICPage,
});

function ICPage() {
  return (
    <PageShell>
      <PageHero
        eyebrow="Legal · Platform policy"
        title="Independent contractor policy"
        lead="CompanionCare is a technology platform. Marketplace helpers are independent contractors, not CompanionCare employees. Personal care aides and clinicians are employed by our licensed partner agencies."
      />

      <section className="mx-auto max-w-3xl px-5 py-16 lg:px-10 space-y-10 text-lg leading-relaxed">
        <div>
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary"><ShieldCheck className="size-5" /></span>
            <h2 className="font-serif text-2xl">What CompanionCare is</h2>
          </div>
          <p className="mt-3 text-muted-foreground">
            CompanionCare operates a technology marketplace that helps older adults and their families find, book, and pay
            independent local Helpers and Companions. CompanionCare is not a home care agency, employment agency, or
            health care provider for Tiers 1 and 2.
          </p>
        </div>

        <div>
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary"><FileText className="size-5" /></span>
            <h2 className="font-serif text-2xl">How providers are classified</h2>
          </div>
          <p className="mt-3 text-muted-foreground">
            Helpers and Companions are independent contractors who use CompanionCare to reach members. They:
          </p>
          <ul className="mt-3 space-y-2 text-muted-foreground list-disc pl-6">
            <li>Set their own hourly rate within a suggested market range</li>
            <li>Choose their own schedule, availability, and service area</li>
            <li>Decide which bookings to accept or decline</li>
            <li>Are free to provide services to other platforms and clients</li>
            <li>Are responsible for their own taxes and, where applicable, their own insurance</li>
          </ul>
          <p className="mt-3 text-muted-foreground">
            CompanionCare does not train providers on how to perform care, prescribe methods of work, require uniforms, or
            supervise the manner in which services are delivered. Platform requirements are limited to identity
            verification, background screening, punctuality, professional conduct, and adherence to the platform's{" "}
            <Link to="/legal/scope-of-practice" className="font-medium text-primary hover:underline">scope-of-practice policy</Link>.
          </p>
        </div>

        <div>
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary"><Scale className="size-5" /></span>
            <h2 className="font-serif text-2xl">Insurance & liability</h2>
          </div>
          <p className="mt-3 text-muted-foreground">
            CompanionCare carries platform-level general and professional liability coverage. Marketplace helpers are
            required to maintain their own general liability coverage and, if driving members, valid auto insurance.
            Personal care and healthcare services are delivered by licensed partner agencies that carry professional
            malpractice and workers' compensation insurance for their own employees.
          </p>

        </div>

        <div>
          <h2 className="font-serif text-2xl">Service-by-service summary</h2>
          <div className="mt-4 overflow-hidden rounded-2xl border border-border">
            <table className="w-full text-base">
              <thead className="bg-secondary text-left">
                <tr>
                  <th className="p-3 font-semibold">Service</th>
                  <th className="p-3 font-semibold">Helper relationship</th>
                  <th className="p-3 font-semibold">Employer</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                <tr><td className="p-3">Marketplace</td><td className="p-3">Independent contractor</td><td className="p-3">Self-employed</td></tr>
                <tr><td className="p-3">Partners (personal care)</td><td className="p-3">W-2 aide of a licensed home care agency</td><td className="p-3">Partner agency</td></tr>
                <tr><td className="p-3">Healthcare (skilled)</td><td className="p-3">W-2 clinician of a home health agency</td><td className="p-3">Partner agency</td></tr>
              </tbody>
            </table>
          </div>
        </div>


        <p className="text-sm text-muted-foreground">
          This page describes CompanionCare's operating model in plain language. It is not legal advice and does not
          replace the platform Terms of Service, which govern your use of CompanionCare.
        </p>
      </section>
    </PageShell>
  );
}
