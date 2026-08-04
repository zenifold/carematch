import { createFileRoute, Link } from "@tanstack/react-router";
import { MapPin } from "lucide-react";
import { PageShell, PageHero, CTASection, marketingHead } from "@/components/marketing/PageShell";

type TierAvail = "live" | "partner" | "waitlist" | "none";

type StateRow = {
  state: string;
  helpers: TierAvail;
  companions: TierAvail;
  partners: TierAvail;
  health: TierAvail;
  note?: string;
};

const rows: StateRow[] = [
  { state: "Florida", helpers: "live", companions: "live", partners: "partner", health: "partner" },
  { state: "Texas", helpers: "live", companions: "live", partners: "partner", health: "partner" },
  { state: "Arizona", helpers: "live", companions: "live", partners: "partner", health: "partner" },
  { state: "Nevada", helpers: "live", companions: "live", partners: "waitlist", health: "partner" },
  { state: "California", helpers: "live", companions: "live", partners: "partner", health: "partner", note: "Partner-only for personal care (CA home care licensing)." },
  { state: "New York", helpers: "live", companions: "live", partners: "partner", health: "partner", note: "Partner-only for personal care (NY licensed home care)." },

  { state: "Massachusetts", helpers: "live", companions: "waitlist", partners: "partner", health: "partner" },
  { state: "Washington", helpers: "waitlist", companions: "waitlist", partners: "waitlist", health: "waitlist" },
  { state: "Illinois", helpers: "waitlist", companions: "waitlist", partners: "waitlist", health: "waitlist" },
];

const tierMeta: Record<TierAvail, { label: string; className: string }> = {
  live: { label: "Live", className: "bg-primary/10 text-primary" },
  partner: { label: "Via partner", className: "bg-accent/15 text-accent" },
  waitlist: { label: "Waitlist", className: "bg-secondary text-secondary-foreground" },
  none: { label: "Not available", className: "bg-muted text-muted-foreground" },
};

function Badge({ v }: { v: TierAvail }) {
  const m = tierMeta[v];
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${m.className}`}>{m.label}</span>;
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
          {(Object.keys(tierMeta) as TierAvail[]).map((k) => (
            <span key={k} className="inline-flex items-center gap-2">
              <Badge v={k} />
              <span className="text-muted-foreground">
                {k === "live" && "Fully operational"}
                {k === "partner" && "Delivered by licensed agency partner"}
                {k === "waitlist" && "Coming soon — join the list"}
                {k === "none" && "Not currently offered"}
              </span>
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
