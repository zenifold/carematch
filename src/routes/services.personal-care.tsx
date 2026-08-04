import { createFileRoute } from "@tanstack/react-router";
import { marketingHead } from "@/components/marketing/PageShell";
import { ServiceDetail, serviceJsonLd } from "@/components/marketing/ServiceDetail";

const faqs = [
  { q: "Are CompanionCare personal care aides licensed?", a: "Yes. Every personal care helper on CompanionCare is a CNA (Certified Nursing Assistant) or HHA (Home Health Aide) verified against their state's licensing board — with monthly re-verification." },
  { q: "Can personal care be billed to insurance?", a: "Some personal care hours may be covered under long-term care insurance or Medicaid waivers depending on your state. Our concierge can walk you through what's eligible in your area." },
  { q: "What tasks are outside the scope of personal care?", a: "Skilled nursing (IVs, wound care, injections) is provided by our licensed clinical partners under our Skilled Care service — not by CNAs/HHAs. Non-medical companionship or housekeeping is a separate service." },
];

export const Route = createFileRoute("/services/personal-care")({
  head: () =>
    marketingHead({
      path: "/services/personal-care",
      title: "Personal Care — CNA/HHA verified in-home caregivers",
      description:
        "Personal care aides for bathing, dressing, mobility, and medication reminders. Licensed CNAs and HHAs, verified monthly. Insurance-eligible where covered.",
      jsonLd: serviceJsonLd({
        name: "Personal care",
        path: "/services/personal-care",
        description:
          "Licensed CNA and HHA personal care aides for bathing, dressing, mobility, and medication reminders.",
        faqs,
      }),
    }),
  component: () => (
    <ServiceDetail
      title="Personal care from licensed CNAs and HHAs."
      lead="Bathing, dressing, mobility support, and medication reminders — delivered with dignity by state-licensed aides."
      intro={
        <>
          <p>
            Personal care is the hands-on help that keeps older adults safe and comfortable
            at home. CompanionCare personal care aides are Certified Nursing Assistants (CNAs)
            or Home Health Aides (HHAs) verified against their state's licensing board
            before their first visit — and re-verified every 30 days.
          </p>
          <p>
            Every visit begins with a live selfie + GPS check-in, so you know exactly who's
            walking through the door and when.
          </p>
        </>
      }
      includes={[
        "Bathing, grooming, and hygiene",
        "Dressing and toileting assistance",
        "Transfers and mobility support",
        "Medication reminders",
        "Meal prep and feeding assistance",
        "Light housekeeping around care tasks",
      ]}
      whoItsFor={[
        "Older adults recovering from surgery or hospitalization",
        "Seniors managing chronic conditions",
        "Adults with limited mobility or fall risk",
        "Families needing dementia-aware personal care",
      ]}
      verificationTier="Identity + background check + CNA/HHA license + monthly re-checks + live check-in"
      faqs={faqs}
    />
  ),
});
