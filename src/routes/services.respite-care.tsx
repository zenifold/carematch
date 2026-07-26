import { createFileRoute } from "@tanstack/react-router";
import { marketingHead } from "@/components/marketing/PageShell";
import { ServiceDetail, serviceJsonLd } from "@/components/marketing/ServiceDetail";

const faqs = [
  { q: "How short or long can respite visits be?", a: "As short as 3 hours or as long as multiple days. Common patterns include a weekly 4-hour block, an overnight, or a weekend while the family caregiver travels." },
  { q: "Can respite include personal care?", a: "Yes. If your loved one needs bathing, transfers, or medication support during respite hours, we'll match with a CNA/HHA at the personal care rate." },
  { q: "Is respite care covered by insurance?", a: "Some long-term care policies and Medicaid waivers cover respite hours. Our concierge can help you check eligibility in your state." },
];

export const Route = createFileRoute("/services/respite-care")({
  head: () =>
    marketingHead({
      path: "/services/respite-care",
      title: "Respite Care — Short-term relief for family caregivers",
      description:
        "Respite care for family caregivers: 4-hour blocks, overnights, or weekend coverage with a verified helper. Trusted, licensed, and insured. From $28/hr.",
      jsonLd: serviceJsonLd({
        name: "Respite care",
        path: "/services/respite-care",
        description:
          "Short-term in-home respite care for family caregivers — hourly, overnight, or multi-day coverage by verified helpers.",
        price: "22",
        faqs,
      }),
    }),
  component: () => (
    <ServiceDetail
      title="Respite care — because caregivers need care, too."
      lead="A few hours, an overnight, or a weekend of trusted coverage — so the family caregiver can rest, work, travel, or just breathe."
      intro={
        <>
          <p>
            Caregiver burnout is real, and it's the biggest single risk to a loved one
            aging in place. CareMatch respite care gives you a verified helper you can
            step away from with confidence — for a few hours or a full weekend.
          </p>
        </>
      }
      includes={[
        "Hourly respite blocks (3 hours+)",
        "Overnight coverage",
        "Weekend and multi-day coverage",
        "Personal care during respite (CNA/HHA)",
        "Meal prep and medication reminders",
        "Real-time updates while you're away",
      ]}
      whoItsFor={[
        "Family caregivers who haven't taken a day off in months",
        "Spouses caring for a partner with dementia",
        "Adult children juggling work and care",
        "Anyone traveling out of town with a loved one at home",
      ]}
      priceRange="$28–$50 / hour (higher for skilled overnight)"
      verificationTier="Identity + background + credentials (where applicable) + monthly re-checks"
      faqs={faqs}
    />
  ),
});
