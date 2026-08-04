import { createFileRoute } from "@tanstack/react-router";
import { marketingHead } from "@/components/marketing/PageShell";
import { ServiceDetail, serviceJsonLd } from "@/components/marketing/ServiceDetail";

const faqs = [
  { q: "Is companionship care the same as personal care?", a: "No. Companionship focuses on conversation, activities, and outings — not bathing, dressing, or medication management. If you need hands-on personal care, choose our Personal Care service." },
  { q: "How long is a typical companionship visit?", a: "Most families book 2–8 hour visits, 1–5 times per week. There's no minimum — we can start small and grow from there." },
  { q: "Can the same helper come every week?", a: "Yes. CompanionCare prioritizes consistent matches so your loved one sees the same familiar face — trust builds over time." },
];

export const Route = createFileRoute("/services/companionship")({
  head: () =>
    marketingHead({
      path: "/services/companionship",
      title: "Companionship Care — Verified helpers for older adults",
      description:
        "Verified companionship care for seniors: conversation, activities, walks, and appointment company. Consistent matches, 5-stage verification, transparent pricing from $20/hr.",
      jsonLd: serviceJsonLd({
        name: "Companionship care",
        path: "/services/companionship",
        description:
          "Verified companionship care for older adults — conversation, activities, walks, and appointment company.",
        price: "20",
        faqs,
      }),
    }),
  component: () => (
    <ServiceDetail
      title="Companionship care — the antidote to isolation."
      lead="Verified helpers who show up for conversation, walks, hobbies, and the small daily moments that make home feel like home."
      intro={
        <>
          <p>
            Loneliness is a health risk on par with smoking. CompanionCare's companionship
            helpers are trained to make regular visits meaningful — playing cards, walking
            the neighborhood, gardening, driving to appointments, or simply sharing a cup
            of coffee.
          </p>
          <p>
            Every companionship helper on CompanionCare has cleared identity proofing,
            a national background check, and reference verification. Continuous monthly
            re-checks keep the profile current, and every visit begins with a live
            selfie + GPS check-in.
          </p>
        </>
      }
      includes={[
        "Conversation and activities at home",
        "Walks, outings, and drives",
        "Company at medical appointments",
        "Meal companionship",
        "Light hobbies (gardening, crafts, reading)",
        "Family check-ins with your consent",
      ]}
      whoItsFor={[
        "Older adults living alone",
        "Seniors recovering from surgery or loss",
        "Families who live far away",
        "Anyone who wants a familiar face on a regular schedule",
      ]}
      priceRange="$20–$35 / hour"
      verificationTier="Identity + background check + references + monthly re-checks"
      faqs={faqs}
    />
  ),
});
