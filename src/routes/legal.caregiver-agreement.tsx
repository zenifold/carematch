import { createFileRoute } from "@tanstack/react-router";
import { PageShell, marketingHead } from "@/components/marketing/PageShell";
import { LegalDocument } from "@/components/marketing/LegalDocument";
import { INDEPENDENT_CONTRACTOR_AGREEMENT } from "@/lib/legal";

export const Route = createFileRoute("/legal/caregiver-agreement")({
  head: () =>
    marketingHead({
      path: "/legal/caregiver-agreement",
      title: "Independent Contractor Agreement | CareMatch",
      description: "CareMatch's Independent Contractor Agreement for providers.",
    }),
  component: CaregiverAgreementPage,
});

function CaregiverAgreementPage() {
  return (
    <PageShell>
      <LegalDocument body={INDEPENDENT_CONTRACTOR_AGREEMENT.body} />
    </PageShell>
  );
}
