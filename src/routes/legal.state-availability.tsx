import { createFileRoute, Link } from "@tanstack/react-router";
import { MapPin } from "lucide-react";
import { PageShell, PageHero, CTASection, marketingHead } from "@/components/marketing/PageShell";
import {
  STATE_AVAILABILITY as rows,
  TIER_META,
  type TierAvail,
} from "@/lib/state-availability";

const tierClass: Record<TierAvail, string> = {
  live: "bg-primary/10 text-primary",
  partner: "bg-accent/15 text-accent",
  waitlist: "bg-secondary text-secondary-foreground",
  none: "bg-muted text-muted-foreground",
};

function Badge({ v }: { v: TierAvail }) {
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${tierClass[v]}`}>
      {TIER_META[v].label}
    </span>
  );
}

export const Route = createFileRoute("/legal/state-availability")({
  head: () =>
    marketingHead({
      path: "/legal/state-availability",
      title: "State Availability — Where CompanionCare Operates",
      description:
        "State-by-state availability for CompanionCare Helpers, Companions, Partners (personal care), and Health (skilled referrals). Coverage varies by state licensing and partner network.",
    }),
  component: StateAvailabilityPage,
});

function StateAvailabilityPage() {
  return (
    <PageShell>
      <PageHero
        eyebrow="Legal · Availability"
        title="Where CompanionCare operates"
        lead="Coverage varies by state licensing rules and partner network density. This page reflects our current rollout. If your state isn't live yet, join the waitlist — we'll notify you when it opens."
      />

      <section className="mx-auto max-w-6xl px-5 py-16 lg:px-10">
        <div className="mb-6 flex flex-wrap gap-3 text-sm">
          {(Object.keys(TIER_META) as TierAvail[]).map((k) => (
            <span key={k} className="inline-flex items-center gap-2">
              <Badge v={k} />
              <span className="text-muted-foreground">{TIER_META[k].description}</span>
            </span>
          ))}
        </div>

        <div className="overflow-x-auto rounded-2xl border border-border">
          <table className="w-full min-w-[720px] text-left text-base">
            <thead className="bg-secondary">
              <tr>
                <th className="p-4 font-semibold">State</th>
                <th className="p-4 font-semibold">Helpers</th>
                <th className="p-4 font-semibold">Companions</th>
                <th className="p-4 font-semibold">Partners</th>
                <th className="p-4 font-semibold">Health</th>
                <th className="p-4 font-semibold">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-card">
              {rows.map((r) => (
                <tr key={r.state}>
                  <td className="p-4 font-medium">
                    <span className="inline-flex items-center gap-2">
                      <MapPin className="size-4 text-muted-foreground" aria-hidden /> {r.state}
                    </span>
                  </td>
                  <td className="p-4"><Badge v={r.helpers} /></td>
                  <td className="p-4"><Badge v={r.companions} /></td>
                  <td className="p-4"><Badge v={r.partners} /></td>
                  <td className="p-4"><Badge v={r.health} /></td>
                  <td className="p-4 text-sm text-muted-foreground">{r.note || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="mt-6 text-sm text-muted-foreground">
          "Via partner" means personal care or skilled services are delivered by a licensed home care or Medicare-certified
          home health agency in your state, matched through CompanionCare. CompanionCare is not a home care agency and does not
          employ personal care aides or clinicians.{" "}
          <Link to="/legal/scope-of-practice" className="font-medium text-primary hover:underline">See scope of practice →</Link>
        </p>

      </section>

      <CTASection title="Don't see your state?" lead="Tell us where you are — we'll add you to the waitlist and notify you when we open." />
    </PageShell>
  );
}
