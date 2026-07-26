import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getAdminAnalytics } from "@/lib/admin.functions";
import {
  PageSkeleton,
  ErrorState,
  RouteErrorBoundary,
} from "@/components/carematch";

export const Route = createFileRoute("/_authenticated/admin/analytics")({
  component: AnalyticsPage,
  errorComponent: RouteErrorBoundary,
});

function fmtMoney(cents: number) {
  if (cents >= 1_000_000_00) return `$${(cents / 100_000_000).toFixed(2)}M`;
  if (cents >= 1_000_00) return `$${(cents / 100_000).toFixed(1)}k`;
  return `$${(cents / 100).toFixed(0)}`;
}

function AnalyticsPage() {
  const fn = useServerFn(getAdminAnalytics);
  const q = useQuery({ queryKey: ["admin", "analytics"], queryFn: () => fn() });

  if (q.isPending) return <PageSkeleton title="analytics" cards={5} />;
  if (q.isError) return <ErrorState error={q.error} onRetry={() => q.refetch()} />;

  const d = q.data!;

  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs uppercase tracking-widest text-muted-foreground">Operations intelligence</p>
        <h1 className="font-serif text-2xl lg:text-3xl">Analytics</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Live counts from the database. Cohort, funnel, and delta calculations arrive with the analytics warehouse.
        </p>
      </header>

      <Dashboard
        title="Supply"
        metrics={[
          { label: "Providers (total)", value: String(d.supply.providers_total) },
          { label: "Active providers", value: String(d.supply.providers_active) },
          { label: "Silver tier", value: String(d.supply.tier_silver) },
          { label: "Gold tier", value: String(d.supply.tier_gold) },
        ]}
      />

      <Dashboard
        title="Demand"
        metrics={[
          { label: "Bookings (7d)", value: String(d.demand.bookings_7d) },
          { label: "Bookings (30d)", value: String(d.demand.bookings_30d) },
          { label: "Bookings YTD", value: String(d.demand.bookings_ytd) },
          { label: "Unique seniors (30d)", value: String(d.demand.unique_seniors_30d) },
        ]}
      />

      <Dashboard
        title="Trust"
        metrics={[
          { label: "Verifications pending", value: String(d.trust.verifications_pending) },
          { label: "Verifications passed", value: String(d.trust.verifications_passed) },
          { label: "Verifications failed", value: String(d.trust.verifications_failed) },
          { label: "Incidents open", value: String(d.trust.incidents_open), hint: `${d.trust.incidents_7d} filed in last 7d` },
        ]}
      />

      <Dashboard
        title="Financial"
        metrics={[
          { label: "GMV (MTD)", value: fmtMoney(d.financial.gmv_mtd_cents) },
          { label: "GMV (YTD)", value: fmtMoney(d.financial.gmv_ytd_cents) },
          { label: "Completed (30d)", value: String(d.financial.completed_30d) },
          { label: "Take rate", value: "16.0%", hint: "Silver-tier default" },
        ]}
      />

      <section>
        <h2 className="mb-2 text-sm font-bold uppercase tracking-widest text-muted-foreground">
          Bookings — last 14 days
        </h2>
        <Sparkline points={d.trend_14d} />
      </section>

      <section>
        <h2 className="mb-2 text-sm font-bold uppercase tracking-widest text-muted-foreground">
          Service mix (30d)
        </h2>
        {d.service_mix_30d.length === 0 ? (
          <p className="rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">
            No bookings in the last 30 days.
          </p>
        ) : (
          <ul className="grid gap-2">
            {(() => {
              const max = d.service_mix_30d[0].count || 1;
              return d.service_mix_30d.map((s) => (
                <li
                  key={s.service_type}
                  className="rounded-xl border border-border bg-card p-3"
                >
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium capitalize">
                      {s.service_type.replace(/_/g, " ")}
                    </span>
                    <span className="tabular-nums text-muted-foreground">
                      {s.count}
                    </span>
                  </div>
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-secondary">
                    <div
                      className="h-full bg-primary"
                      style={{ width: `${(s.count / max) * 100}%` }}
                    />
                  </div>
                </li>
              ));
            })()}
          </ul>
        )}
      </section>
    </div>
  );
}

function Sparkline({ points }: { points: { date: string; count: number }[] }) {
  if (points.length === 0) return null;
  const max = Math.max(1, ...points.map((p) => p.count));
  const w = 100;
  const h = 30;
  const step = w / Math.max(1, points.length - 1);
  const path = points
    .map((p, i) => `${i === 0 ? "M" : "L"}${(i * step).toFixed(2)},${(h - (p.count / max) * h).toFixed(2)}`)
    .join(" ");
  const total = points.reduce((s, p) => s + p.count, 0);
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-baseline justify-between">
        <p className="font-serif text-2xl tabular-nums">{total}</p>
        <p className="text-xs text-muted-foreground">Peak {max}/day</p>
      </div>
      <svg viewBox={`0 0 ${w} ${h}`} className="mt-2 h-16 w-full" preserveAspectRatio="none">
        <path d={path} fill="none" stroke="currentColor" strokeWidth="1" className="text-primary" />
      </svg>
      <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
        <span>{new Date(points[0].date).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</span>
        <span>{new Date(points[points.length - 1].date).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</span>
      </div>
    </div>
  );
}


type Metric = { label: string; value: string; hint?: string };

function Dashboard({ title, metrics }: { title: string; metrics: Metric[] }) {
  return (
    <section>
      <h2 className="mb-2 text-sm font-bold uppercase tracking-widest text-muted-foreground">{title}</h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map((m) => (
          <div key={m.label} className="rounded-xl border border-border bg-card p-4">
            <p className="text-xs uppercase tracking-widest text-muted-foreground">{m.label}</p>
            <p className="mt-1 font-serif text-2xl tabular-nums">{m.value}</p>
            {m.hint && <p className="mt-1 text-xs text-muted-foreground">{m.hint}</p>}
          </div>
        ))}
      </div>
    </section>
  );
}
