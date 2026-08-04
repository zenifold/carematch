import { createFileRoute } from "@tanstack/react-router";
import { Phone, Mail, MessageCircle, Clock, ShieldCheck } from "lucide-react";
import {
  PageShell,
  PageHero,
  marketingHead,
  PHONE,
  PHONE_HREF,
  SITE_URL,
} from "@/components/marketing/PageShell";

export const Route = createFileRoute("/contact")({
  head: () =>
    marketingHead({
      path: "/contact",
      title: "Contact CompanionCare — 24/7 phone concierge & support",
      description:
        "Reach CompanionCare's concierge 24/7 at 1-800-COMPANION. Get personal help matching a caregiver, ask about pricing, or reach our safety team any time — day or night.",
      jsonLd: [
        {
          "@context": "https://schema.org",
          "@type": "LocalBusiness",
          name: "CompanionCare",
          image: `${SITE_URL}/og-default.jpg`,
          url: `${SITE_URL}/contact`,
          telephone: "+1-800-COMPANION",
          priceRange: "$$",
          areaServed: { "@type": "Country", name: "United States" },
          address: {
            "@type": "PostalAddress",
            addressCountry: "US",
          },
          openingHoursSpecification: [
            {
              "@type": "OpeningHoursSpecification",
              dayOfWeek: [
                "Monday",
                "Tuesday",
                "Wednesday",
                "Thursday",
                "Friday",
                "Saturday",
                "Sunday",
              ],
              opens: "00:00",
              closes: "23:59",
            },
          ],
        },
      ],
    }),
  component: ContactPage,
});

function ContactPage() {
  return (
    <PageShell>
      <PageHero
        eyebrow="Contact"
        title="Prefer to talk? We do too."
        lead="A real person answers 24 hours a day, 7 days a week. No phone tree, no bots — call us and a concierge picks up."
      />

      <section className="mx-auto max-w-5xl px-5 py-16 lg:px-10">
        <div className="grid gap-6 md:grid-cols-2">
          <a href={PHONE_HREF} className="surface-card block p-8 hover:bg-secondary/40">
            <Phone className="size-8 text-primary" aria-hidden />
            <h2 className="mt-4 text-2xl font-semibold">Call our concierge</h2>
            <p className="mt-2 text-lg text-primary">{PHONE}</p>
            <p className="mt-1 text-sm text-muted-foreground">Available 24/7 — humans, not bots</p>
          </a>
          <a href="mailto:hello@getcompanioncare.com" className="surface-card block p-8 hover:bg-secondary/40">
            <Mail className="size-8 text-primary" aria-hidden />
            <h2 className="mt-4 text-2xl font-semibold">Email us</h2>
            <p className="mt-2 text-lg text-primary">hello@getcompanioncare.com</p>
            <p className="mt-1 text-sm text-muted-foreground">We reply within 4 business hours</p>
          </a>
          <div className="surface-card p-8">
            <MessageCircle className="size-8 text-primary" aria-hidden />
            <h2 className="mt-4 text-2xl font-semibold">Safety concerns</h2>
            <p className="mt-2 text-lg">Call {PHONE} and ask for the safety team.</p>
            <p className="mt-1 text-sm text-muted-foreground">
              We respond to safety concerns within minutes, not business days.
            </p>
          </div>
          <div className="surface-card p-8">
            <Clock className="size-8 text-primary" aria-hidden />
            <h2 className="mt-4 text-2xl font-semibold">Response times</h2>
            <ul className="mt-3 space-y-1 text-base text-muted-foreground">
              <li>Phone: answered in under 60 seconds</li>
              <li>Email: within 4 business hours</li>
              <li>Safety escalations: within minutes, 24/7</li>
            </ul>
          </div>
        </div>

        <div className="mt-10 surface-card flex items-start gap-4 p-6">
          <ShieldCheck className="mt-1 size-7 text-primary" aria-hidden />
          <div>
            <h3 className="text-xl font-semibold">Media, press & partnerships</h3>
            <p className="mt-2 text-base text-muted-foreground">
              For press inquiries email <a className="text-primary underline" href="mailto:press@getcompanioncare.com">press@getcompanioncare.com</a>.
              For partnership or referral opportunities email{" "}
              <a className="text-primary underline" href="mailto:partners@getcompanioncare.com">partners@getcompanioncare.com</a>.
            </p>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
