import { createFileRoute, Link } from "@tanstack/react-router";
import { Mail, LifeBuoy, ShieldAlert, Handshake } from "lucide-react";
import { PageShell, PageHero, marketingHead, SITE_URL } from "@/components/marketing/PageShell";

/**
 * Email and in-app messaging only — there is no phone line. The LocalBusiness
 * JSON-LD deliberately omits `telephone` and the 24/7 openingHours it used to
 * claim: publishing structured data for a channel that doesn't exist is worse
 * than publishing none, because search engines surface it as a call button.
 */

const SUPPORT = "support@getcompanioncare.com";
const SAFETY = "safety@getcompanioncare.com";

export const Route = createFileRoute("/contact")({
  head: () =>
    marketingHead({
      path: "/contact",
      title: "Contact CompanionCare — support, safety, and partnerships",
      description:
        "Message CompanionCare support and a real person replies within one business day. Safety reports are prioritised ahead of everything else.",
      jsonLd: [
        {
          "@context": "https://schema.org",
          "@type": "Organization",
          name: "CompanionCare",
          image: `${SITE_URL}/og-default.jpg`,
          url: `${SITE_URL}/contact`,
          areaServed: { "@type": "Country", name: "United States" },
          contactPoint: [
            {
              "@type": "ContactPoint",
              contactType: "customer support",
              email: SUPPORT,
              availableLanguage: ["English", "Spanish"],
            },
            {
              "@type": "ContactPoint",
              contactType: "safety",
              email: SAFETY,
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
        title="A real person reads every message."
        lead="We don't run a phone line — we'd rather answer properly in writing than have someone rushed on a call. Every message goes to a person on our team, and you get a reply within one business day."
      />

      <section className="mx-auto max-w-5xl px-5 py-16 lg:px-10">
        <div className="grid gap-6 md:grid-cols-2">
          <a href={`mailto:${SUPPORT}`} className="surface-card block p-8 hover:bg-secondary/40">
            <Mail className="size-8 text-primary" aria-hidden />
            <h2 className="mt-4 text-2xl font-semibold">Email support</h2>
            <p className="mt-2 text-lg break-words text-primary">{SUPPORT}</p>
            <p className="mt-1 text-base text-muted-foreground">
              Best for questions before you have an account. Replies within one business day.
            </p>
          </a>

          <div className="surface-card p-8">
            <LifeBuoy className="size-8 text-primary" aria-hidden />
            <h2 className="mt-4 text-2xl font-semibold">Help inside your account</h2>
            <p className="mt-2 text-base text-muted-foreground">
              Already signed up? Use the <span className="font-semibold text-foreground">Help</span>{" "}
              button in your portal. It opens a tracked thread, and we can see the visit you're
              asking about without you having to explain it from scratch.
            </p>
            <Link
              to="/auth"
              className="mt-4 inline-flex items-center gap-1.5 text-base font-semibold text-primary underline"
            >
              Sign in to your portal
            </Link>
          </div>

          <div className="surface-card p-8">
            <ShieldAlert className="size-8 text-destructive" aria-hidden />
            <h2 className="mt-4 text-2xl font-semibold">Safety concerns</h2>
            <p className="mt-2 text-base text-muted-foreground">
              Report a problem from the visit itself, or email{" "}
              <a className="font-semibold text-primary underline" href={`mailto:${SAFETY}`}>
                {SAFETY}
              </a>
              . Safety reports jump the queue ahead of everything else.
            </p>
            <p className="mt-3 text-base font-semibold text-foreground">
              If someone is in immediate danger, call 911 first.
            </p>
          </div>

          <div className="surface-card p-8">
            <Handshake className="size-8 text-primary" aria-hidden />
            <h2 className="mt-4 text-2xl font-semibold">Press & partnerships</h2>
            <p className="mt-2 text-base text-muted-foreground">
              Press:{" "}
              <a
                className="text-primary underline"
                href="mailto:press@getcompanioncare.com"
              >
                press@getcompanioncare.com
              </a>
              <br />
              Agencies, hospitals and referral partners:{" "}
              <a
                className="text-primary underline"
                href="mailto:partners@getcompanioncare.com"
              >
                partners@getcompanioncare.com
              </a>
            </p>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
