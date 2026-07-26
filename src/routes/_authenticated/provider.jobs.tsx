import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { MapPin, Clock, Briefcase } from "lucide-react";
import { toast } from "sonner";
import { listProviderJobs } from "@/lib/provider.functions";
import { acceptBooking, declineBooking } from "@/lib/bookings.functions";
import {
  PageSkeleton,
  EmptyState,
  ErrorState,
  RouteErrorBoundary,
} from "@/components/carematch";

export const Route = createFileRoute("/_authenticated/provider/jobs")({
  component: JobsPage,
  errorComponent: RouteErrorBoundary,
});

type Tab = "invites" | "active" | "past";
type Sort = "soonest" | "pay" | "duration";

function fmtWhen(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
function fmtMoney(cents: number) {
  return `$${(cents / 100).toFixed(0)}`;
}

function JobsPage() {
  const qc = useQueryClient();
  const jobsFn = useServerFn(listProviderJobs);
  const acceptFn = useServerFn(acceptBooking);
  const declineFn = useServerFn(declineBooking);
  const jobsQ = useQuery({ queryKey: ["provider", "jobs"], queryFn: () => jobsFn() });

  const [tab, setTab] = useState<Tab>("invites");
  const [sort, setSort] = useState<Sort>("soonest");

  const groups = useMemo(() => {
    const all = jobsQ.data ?? [];
    const sorter = (a: typeof all[number], b: typeof all[number]) => {
      if (sort === "pay") return b.hourly_rate_cents - a.hourly_rate_cents;
      if (sort === "duration") return b.duration_minutes - a.duration_minutes;
      return a.scheduled_at.localeCompare(b.scheduled_at);
    };
    return {
      invites: all.filter((j) => j.status === "requested").sort(sorter),
      active: all.filter((j) => j.status === "confirmed" || j.status === "in_progress").sort(sorter),
      past: all.filter((j) => j.status === "completed" || j.status === "cancelled").sort((a, b) => b.scheduled_at.localeCompare(a.scheduled_at)),
    };
  }, [jobsQ.data, sort]);

  const accept = useMutation({
    mutationFn: (id: string) => acceptFn({ data: { id } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["provider"] });
      toast.success("Accepted — visit is on your schedule.");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Update failed"),
  });
  const decline = useMutation({
    mutationFn: (id: string) => declineFn({ data: { id } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["provider"] });
      toast.success("Declined");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Update failed"),
  });

  if (jobsQ.isPending) return <PageSkeleton title="jobs" cards={3} />;
  if (jobsQ.isError) return <ErrorState error={jobsQ.error} onRetry={() => jobsQ.refetch()} />;

  const rows = groups[tab];

  return (
    <div className="space-y-5">
      <header>
        <p className="text-xs uppercase tracking-widest text-muted-foreground">Marketplace</p>
        <h1 className="font-serif text-2xl lg:text-3xl">Jobs</h1>
      </header>

      <div className="flex gap-1 rounded-2xl border border-border bg-secondary/40 p-1 text-sm">
        {(["invites", "active", "past"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 rounded-xl px-3 py-2 font-medium capitalize ${
              tab === t ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
            }`}
          >
            {t === "invites"
              ? `Invites (${groups.invites.length})`
              : t === "active"
              ? `Active (${groups.active.length})`
              : `Past (${groups.past.length})`}
          </button>
        ))}
      </div>

      {tab !== "past" && (
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="text-muted-foreground">Sort</span>
          {(["soonest", "pay", "duration"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setSort(s)}
              className={`rounded-full border px-3 py-1 capitalize ${sort === s ? "border-primary bg-primary/10 text-primary" : "border-border bg-card text-muted-foreground"}`}
            >
              {s === "pay" ? "Highest pay" : s === "duration" ? "Longest" : "Soonest"}
            </button>
          ))}
        </div>
      )}

      {rows.length === 0 ? (
        <EmptyState
          icon={<Briefcase className="size-6" />}
          title={
            tab === "invites"
              ? "No pending invites"
              : tab === "active"
              ? "No active bookings"
              : "No past bookings yet"
          }
          description={
            tab === "invites"
              ? "Families with matching needs will send requests here."
              : tab === "active"
              ? "Accepted invites appear here until they're completed."
              : "Completed and cancelled bookings will show up here."
          }
        />
      ) : (
        <div className="space-y-3">
          {rows.map((j) => {
            const total = Math.round((j.hourly_rate_cents * j.duration_minutes) / 60);
            return (
              <article key={j.id} className="rounded-2xl border border-border bg-card p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-serif text-lg">{j.senior_name ?? "Senior"}</h3>
                      <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                        {j.status}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {j.service_type} · {j.duration_minutes} min
                    </p>
                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <Clock className="size-3" /> {fmtWhen(j.scheduled_at)}
                      </span>
                      {j.senior_city && (
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="size-3" /> {j.senior_city}
                        </span>
                      )}
                    </div>
                    {j.notes && <p className="mt-2 text-sm">{j.notes}</p>}
                  </div>
                  <div className="text-right">
                    <p className="font-serif text-xl">{fmtMoney(j.hourly_rate_cents)}/hr</p>
                    <p className="text-xs text-muted-foreground">{fmtMoney(total)} total</p>
                  </div>
                </div>
                {tab === "invites" && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      onClick={() => accept.mutate(j.id)}
                      disabled={accept.isPending || decline.isPending}
                      className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => decline.mutate(j.id)}
                      disabled={accept.isPending || decline.isPending}
                      className="rounded-lg px-4 py-2 text-sm text-muted-foreground hover:bg-secondary disabled:opacity-50"
                    >
                      Decline
                    </button>
                  </div>
                )}
                {tab === "active" && (
                  <div className="mt-3">
                    <Link
                      to="/provider/visits/$id"
                      params={{ id: j.id }}
                      className="inline-flex rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
                    >
                      {j.status === "in_progress" ? "In progress — check out" : "Check in"}
                    </Link>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
