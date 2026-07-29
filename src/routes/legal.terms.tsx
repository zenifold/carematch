import { createFileRoute } from "@tanstack/react-router";
import { PageShell, marketingHead } from "@/components/marketing/PageShell";
import { LegalDocument } from "@/components/marketing/LegalDocument";
import { TERMS_OF_SERVICE } from "@/lib/legal";

export const Route = createFileRoute("/legal/terms")({
  head: () =>
    marketingHead({
      path: "/legal/terms",
      title: "Terms of Service | CareMatch",
      description: "CareMatch's Terms of Service.",
    }),
  component: TermsPage,
});

function TermsPage() {
  return (
    <PageShell>
      <LegalDocument body={TERMS_OF_SERVICE.body} />
    </PageShell>
  );
}
