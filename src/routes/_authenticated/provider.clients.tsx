import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Users, MapPin, MessageCircle, CalendarClock, Search } from "lucide-react";
import {
  PageSkeleton,
  EmptyState,
  ErrorState,
  RouteErrorBoundary,
} from "@/components/carematch";
import { listProviderJobs, type ProviderJob } from "@/lib/provider.functions";

export const Route = createFileRoute("/_authenticated/provider/clients")({
  component: ProviderClientsPage,
  errorComponent: RouteErrorBoundary,
});

type ClientRow = {
  senior_id: string;
  name: string;
  city: string | null;
  avatar_url: string | null;
  visits: number;
  upcoming: number;
  completed: number;
  lastVisit: string | null;
  nextVisit: string | null;
};

function aggregate(jobs: ProviderJob[]): ClientRow[] {
  const now = Date.now();
  const by = new Map<string, ClientRow>();
  for (const j of jobs) {
    const existing =
      by.get(j.senior_id) ??
      {
        senior_id: j.senior_id,
        name: j.senior_name ?? "Client",
        city: j.senior_city,
        avatar_url: j.senior_avatar_url,
        visits: 0,
        upcoming: 0,
        completed: 0,
        lastVisit: null,
        nextVisit: null,
      };
    existing.visits += 1;
    const t = new Date(j.scheduled_at).getTime();
    if (j.status === "completed") existing.completed += 1;
    if (t >= now && j.status !== "cancelled") {
      existing.upcoming += 1;
      if (!existing.nextVisit || t < new Date(existing.nextVisit).getTime())
        existing.nextVisit = j.scheduled_at;
    } else {
      if (!existing.lastVisit || t > new Date(existing.lastVisit).getTime())
        existing.lastVisit = j.scheduled_at;
    }
    by.set(j.senior_id, existing);
  }
  return Array.from(by.values()).sort((a, b) => b.visits - a.visits);
}

function ProviderClientsPage() {
  const fetchJobs = useServerFn(listProviderJobs);
  const q = useQuery({ queryKey: ["provider", "jobs"], queryFn: () => fetchJobs() });
  const [search, setSearch] = useState("");

  const clients = useMemo(() => aggregate(q.data ?? []), [q.data]);
  const filtered = useMemo(
    () =>
      clients.filter(
        (c) =>
          !search.trim() ||
          c.name.toLowerCase().includes(search.trim().toLowerCase()) ||
          (c.city ?? "").toLowerCase().includes(search.trim().toLowerCase()),
      ),
    [clients, search],
  );

  if (q.isPending) return <PageSkeleton title="clients" cards={3} />;
  if (q.isError) return <ErrorState error={q.error} onRetry={() => q.refetch()} />;

  return (
    <div className="space-y-5">
      <header>
        <p className="text-xs uppercase tracking-widest text-muted-foreground">
          Relationships
        </p>
        <h1 className="font-serif text-2xl lg:text-3xl">Your clients</h1>
        <p className="text-sm text-muted-foreground">
          Seniors you've been matched with — visit history, upcoming, and quick
          actions.
        </p>
      </header>

      <div className="grid gap-3 sm:grid-cols-3">
        <Kpi label="Active clients" value={clients.length} />
        <Kpi
          label="Upcoming visits"
          value={clients.reduce((s, c) => s + c.upcoming, 0)}
        />
        <Kpi
          label="Completed visits"
          value={clients.reduce((s, c) => s + c.completed, 0)}
        />
      </div>

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or city"
          className="w-full rounded-full border border-input bg-background py-2.5 pl-10 pr-4 text-sm"
        />
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<Users className="size-6" />}
          title={clients.length === 0 ? "No clients yet" : "No matches"}
          description={
            clients.length === 0
              ? "Once you accept your first booking, your client will appear here."
              : "Try a different search."
          }
        />
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {filtered.map((c) => (
            <li
              key={c.senior_id}
              className="rounded-2xl border border-border bg-card p-4"
            >
              <div className="flex items-start gap-3">
                {c.avatar_url ? (
                  <img
                    src={c.avatar_url}
                    alt=""
                    className="size-12 rounded-full object-cover"
                  />
                ) : (
                  <span className="grid size-12 place-items-center rounded-full bg-secondary text-sm font-bold">
                    {c.name
                      .split(" ")
                      .map((p) => p[0])
                      .join("")
                      .slice(0, 2)}
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{c.name}</p>
                  {c.city && (
                    <p className="flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="size-3" />
                      {c.city}
                    </p>
                  )}
                  <div className="mt-2 flex flex-wrap gap-1.5 text-[10px] font-bold uppercase">
                    <span className="rounded-full bg-secondary px-2 py-0.5">
                      {c.visits} visit{c.visits === 1 ? "" : "s"}
                    </span>
                    {c.upcoming > 0 && (
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-primary">
                        {c.upcoming} upcoming
                      </span>
                    )}
                    {c.completed > 0 && (
                      <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-emerald-700">
                        {c.completed} done
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-3 grid gap-1 text-xs text-muted-foreground">
                {c.nextVisit && (
                  <p className="flex items-center gap-1.5">
                    <CalendarClock className="size-3.5 text-primary" />
                    Next{" "}
                    {new Date(c.nextVisit).toLocaleString(undefined, {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </p>
                )}
                {c.lastVisit && !c.nextVisit && (
                  <p>
                    Last visit{" "}
                    {new Date(c.lastVisit).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                    })}
                  </p>
                )}
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                <Link
                  to="/provider/messages"
                  className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1.5 text-xs font-semibold hover:bg-secondary"
                >
                  <MessageCircle className="size-3.5" /> Message
                </Link>
                <Link
                  to="/provider/schedule"
                  className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1.5 text-xs font-semibold hover:bg-secondary"
                >
                  <CalendarClock className="size-3.5" /> Schedule
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Kpi({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <p className="text-xs uppercase tracking-widest text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 font-serif text-2xl">{value}</p>
    </div>
  );
}
