import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Clock, Inbox, Users, Briefcase, Calendar, AlertTriangle, ShieldAlert } from "lucide-react";
import { getAdminOverview, checkIsAdmin } from "@/lib/admin.functions";
import {
  PageSkeleton,
  EmptyState,
  ErrorState,
  RouteErrorBoundary,
} from "@/components/carematch";

export const Route = createFileRoute("/_authenticated/admin/")({
  component: QueuePage,
  errorComponent: RouteErrorBoundary,
  beforeLoad: async () => {
    // Admin-only. Redirect through /dashboard (not /admin — that's this
    // route) so non-admin staff land on whichever page they can actually use.
    const { isAdmin } = await checkIsAdmin();
    if (!isAdmin) throw redirect({ to: "/dashboard" });
  },
});

function QueuePage() {
  const fn = useServerFn(getAdminOverview);
  const q = useQuery({ queryKey: ["admin", "overview"], queryFn: () => fn() });

  if (q.isPending) return <PageSkeleton title="queue" cards={4} />;
  if (q.isError) return <ErrorState error={q.error} onRetry={() => q.refetch()} />;

  const d = q.data!;

  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs uppercase tracking-widest text-muted-foreground">Operations</p>
        <h1 className="font-serif text-2xl lg:text-3xl">Console</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Snapshot of platform activity. Live-call queue is not yet enabled — pending booking requests
          are the primary intake channel.
        </p>
      </header>

      {d.queue.requested > 0 && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 size-5 text-amber-700" />
            <div className="flex-1 text-sm">
              <p className="font-semibold text-amber-900">
                {d.queue.requested} booking {d.queue.requested === 1 ? "request needs" : "requests need"} matching
              </p>
              <p className="mt-0.5 text-amber-800">
                Concierge SLA is 15 minutes for unmatched requests. Drill in to assign a provider.
              </p>
              <Link to="/admin/bookings" className="mt-2 inline-flex text-xs font-semibold text-amber-900 underline">
                Open queue →
              </Link>
            </div>
          </div>
        </div>
      )}

      <section className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        <QueueTile to="/admin/bookings" icon={Inbox} label="Unmatched bookings" value={d.queue.requested} tone={d.queue.requested > 0 ? "warn" : "ok"} />
        <QueueTile to="/admin/credentials" icon={ShieldAlert} label="Credentials pending" value={d.trust?.verifications_pending ?? 0} />
        <QueueTile to="/admin/trust-safety" icon={ShieldAlert} label="Open incidents" value={d.trust?.incidents_open ?? 0} tone={(d.trust?.incidents_open ?? 0) > 0 ? "danger" : "ok"} />
        <QueueTile to="/admin/support" icon={Inbox} label="Support tickets" value={d.trust?.tickets_open ?? 0} />
      </section>

      <div className="grid gap-3 md:grid-cols-4">
        <Kpi label="Booking requests" value={d.queue.requested} hint="pending confirmation" tone={d.queue.requested > 0 ? "warn" : undefined} />
        <Kpi label="Confirmed" value={d.queue.confirmed} hint="upcoming visits" />
        <Kpi label="In progress" value={d.queue.in_progress} hint="live visits" />
        <Kpi label="Bookings (7d)" value={d.totals.bookings_7d} />
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <SmallStat icon={Users} label="Seniors" value={d.totals.seniors} />
        <SmallStat icon={Briefcase} label="Providers (total)" value={d.totals.providers} />
        <SmallStat icon={Briefcase} label="Active providers" value={d.totals.active_providers} />
      </div>

      <section className="rounded-2xl border border-border bg-card">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h2 className="flex items-center gap-2 font-semibold">
            <Inbox className="size-4 text-primary" /> Recent bookings
          </h2>
          <Link to="/admin/bookings" className="text-xs font-semibold text-primary">
            View all →
          </Link>
        </div>
        {d.recent_bookings.length === 0 ? (
          <div className="p-6">
            <EmptyState
              icon={<Calendar className="size-6" />}
              title="No bookings yet"
              description="Once seniors book care, activity will appear here."
            />
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {d.recent_bookings.map((b) => (
              <li key={b.id} className="flex items-center gap-3 px-4 py-3 text-sm">
                <span className="rounded-full bg-secondary px-2 py-0.5 text-[11px] font-semibold uppercase text-muted-foreground">
                  {b.status}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">
                    {b.senior_name ?? "Senior"} · {b.service_type}
                  </p>
                  <p className="truncate text-muted-foreground">
                    {b.provider_name ?? "Unassigned"} ·{" "}
                    {new Date(b.scheduled_at).toLocaleString(undefined, {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="size-3" />
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function Kpi({ label, value, hint, tone }: { label: string; value: number; hint?: string; tone?: "danger" | "warn" }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <p className="text-xs uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className="mt-1 font-serif text-2xl tabular-nums">{value}</p>
      {hint && (
        <p
          className={`mt-0.5 text-xs ${
            tone === "danger" ? "text-destructive" : tone === "warn" ? "text-amber-700" : "text-muted-foreground"
          }`}
        >
          {hint}
        </p>
      )}
    </div>
  );
}

function SmallStat({ icon: Icon, label, value }: { icon: typeof Users; label: string; value: number }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-4">
      <span className="grid size-10 place-items-center rounded-lg bg-primary/10 text-primary">
        <Icon className="size-5" />
      </span>
      <div>
        <p className="text-xs uppercase tracking-widest text-muted-foreground">{label}</p>
        <p className="font-serif text-xl tabular-nums">{value}</p>
      </div>
    </div>
  );
}

function QueueTile({ to, icon: Icon, label, value, tone }: { to: string; icon: typeof Users; label: string; value: number; tone?: "warn" | "danger" | "ok" }) {
  const toneCls = tone === "danger"
    ? "border-destructive/40 bg-destructive/5"
    : tone === "warn"
      ? "border-amber-500/40 bg-amber-500/5"
      : "border-border bg-card";
  return (
    <Link to={to} className={`flex items-center gap-3 rounded-xl border p-4 hover:shadow-soft ${toneCls}`}>
      <span className="grid size-10 place-items-center rounded-lg bg-primary/10 text-primary">
        <Icon className="size-5" />
      </span>
      <div className="flex-1">
        <p className="text-xs uppercase tracking-widest text-muted-foreground">{label}</p>
        <p className="font-serif text-xl tabular-nums">{value}</p>
      </div>
    </Link>
  );
}
