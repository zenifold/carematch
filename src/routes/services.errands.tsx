import { createFileRoute } from "@tanstack/react-router";
import { marketingHead } from "@/components/marketing/PageShell";
import { ServiceDetail, serviceJsonLd } from "@/components/marketing/ServiceDetail";

const faqs = [
  { q: "Do CareMatch helpers drive their own car?", a: "Most errand and transport helpers drive their own insured vehicle. If your parent prefers to ride in their own car, we can match with a helper who drives your vehicle instead." },
  { q: "Is transport safe for seniors with mobility needs?", a: "Yes. Helpers matched for transport are trained on safe transfers and steady curbside pickups. For wheelchair-accessible transport, mention that during intake so we match appropriately." },
  { q: "Can errands include prescription pickups?", a: "Yes, with your written authorization on file. Helpers can also handle grocery runs, dry cleaning, post office, banking (deposits only), and library returns." },
];

export const Route = createFileRoute("/services/errands")({
  head: () =>
    marketingHead({
      path: "/services/errands",
      title: "Errands & Transport for Seniors — Verified drivers you know",
      description:
        "Grocery runs, pharmacy pickups, and rides to doctor's appointments with a verified helper who knows your parent. Insured drivers, live check-ins, from $20/hr.",
      jsonLd: serviceJsonLd({
        name: "Errands and transport",
        path: "/services/errands",
        description:
          "Errands, grocery runs, pharmacy pickups, and rides to appointments — with a familiar, verified helper.",
        price: "20",
        faqs,
      }),
    }),
  component: () => (
    <ServiceDetail
      title="Errands and rides — with a familiar helper, not a stranger."
      lead="A ride to the doctor. A grocery run. A prescription pickup. Booked with a verified helper who already knows your parent."
      intro={
        <>
          <p>
            One of the hardest parts of aging is losing the freedom to run a quick errand.
            CareMatch pairs you with a verified helper who can drive to the pharmacy,
            wait through a doctor's visit, or handle a grocery list — and stays consistent
            so it feels like family, not a rotating cast of drivers.
          </p>
        </>
      }
      includes={[
        "Grocery shopping (with or without a list)",
        "Pharmacy and prescription pickups",
        "Rides to medical appointments",
        "Post office, dry cleaning, bank deposits",
        "Waiting time during appointments",
        "Help carrying and unloading",
      ]}
      whoItsFor={[
        "Seniors no longer driving",
        "Adults recovering from surgery",
        "Family who live too far to run errands themselves",
        "Anyone tired of asking neighbors for rides",
      ]}
      priceRange="$20–$35 / hour + mileage where applicable"
      verificationTier="Identity + background check + valid driver's license + insurance + monthly re-checks"
      faqs={faqs}
    />
  ),
});
