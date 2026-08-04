import { createFileRoute } from "@tanstack/react-router";
import { PageShell, marketingHead } from "@/components/marketing/PageShell";
import { LegalDocument } from "@/components/marketing/LegalDocument";
import { PROVIDER_AGREEMENT } from "@/lib/legal";

export const Route = createFileRoute("/legal/provider-agreement")({
  head: () =>
    marketingHead({
      path: "/legal/provider-agreement",
      title: "Provider Agreement | CompanionCare",
      description: "CompanionCare's Provider Agreement for marketplace caregivers.",
    }),
  component: ProviderAgreementPage,
});

function ProviderAgreementPage() {
  return (
    <PageShell>
      <LegalDocument body={PROVIDER_AGREEMENT.body} />
    </PageShell>
  );
}
