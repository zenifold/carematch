import { createFileRoute } from "@tanstack/react-router";
import { marketingHead } from "@/components/marketing/PageShell";
import { ServiceDetail, serviceJsonLd } from "@/components/marketing/ServiceDetail";

const faqs = [
  { q: "Is CompanionCare just a cleaning service?", a: "No. Housekeeping helpers on CompanionCare are the same trusted people who can also provide companionship and errand help — so one relationship covers many needs, and you don't have to explain your home to a new person every week." },
  { q: "Do I need to supply cleaning products?", a: "By default helpers use your home's supplies (most seniors prefer familiar products). You can also request eco-friendly or unscented options when booking." },
  { q: "Can housekeeping be recurring?", a: "Yes. Set weekly, bi-weekly, or monthly recurring visits with the same helper. Cancel or reschedule up to 24 hours ahead with no fee." },
];

export const Route = createFileRoute("/services/housekeeping")({
  head: () =>
    marketingHead({
      path: "/services/housekeeping",
      title: "Housekeeping for Seniors — Trusted, verified home helpers",
      description:
        "Verified in-home housekeeping for older adults: cleaning, laundry, meal prep. Same helper every week, no long contracts.",
      jsonLd: serviceJsonLd({
        name: "Housekeeping",
        path: "/services/housekeeping",
        description:
          "Trusted in-home housekeeping for older adults: cleaning, laundry, and meal prep, delivered by verified helpers.",
        faqs,
      }),
    }),
  component: () => (
    <ServiceDetail
      title="A clean home, a familiar face."
      lead="Cleaning, laundry, and meal prep from helpers who know your kitchen, your linens, and how you like the pillows on the couch."
      intro={
        <>
          <p>
            Housekeeping isn't just about a clean house — it's about the calm that comes
            from knowing someone reliable will be there Tuesday morning. CompanionCare pairs
            you with a verified helper who returns visit after visit, so the small details
            of your home stay right.
          </p>
        </>
      }
      includes={[
        "Weekly, bi-weekly, or monthly cleaning",
        "Laundry and linens",
        "Meal prep and grocery unpacking",
        "Refrigerator clean-outs",
        "Light organizing",
        "Seasonal deep-clean visits",
      ]}
      whoItsFor={[
        "Seniors aging in place",
        "Adults recovering from injury",
        "Family caregivers who need one thing off the plate",
        "Anyone who wants a consistent, verified helper",
      ]}
      verificationTier="Identity + background check + monthly re-checks + live check-in"
      faqs={faqs}
    />
  ),
});
