import { createFileRoute } from "@tanstack/react-router";
import { PageShell, marketingHead } from "@/components/marketing/PageShell";
import { LegalDocument } from "@/components/marketing/LegalDocument";
import { PRIVACY_POLICY } from "@/lib/legal";

export const Route = createFileRoute("/legal/privacy")({
  head: () =>
    marketingHead({
      path: "/legal/privacy",
      title: "Privacy Policy | CompanionCare",
      description: "CompanionCare's Privacy Policy.",
    }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <PageShell>
      <LegalDocument body={PRIVACY_POLICY.body} />
    </PageShell>
  );
}
