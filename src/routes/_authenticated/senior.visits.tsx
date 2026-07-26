import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Plus, Star } from "lucide-react";
import {
  VisitCard,
  PageSkeleton,
  EmptyState,
  ErrorState,
  RouteErrorBoundary,
} from "@/components/carematch";
import type { VisitCardData, VisitStatus } from "@/components/carematch";
import { listMyVisits, type VisitRow } from "@/lib/bookings.functions";


export const Route = createFileRoute("/_authenticated/senior/visits")({
  component: SeniorVisits,
  errorComponent: RouteErrorBoundary,
});

const STATUS_MAP: Record<string, VisitStatus> = {
  requested: "upcoming",
  confirmed: "upcoming",
  in_progress: "in-progress",
  completed: "completed",
  cancelled: "issue",
};

type Tab = "upcoming" | "past" | "cancelled";

function initialsOf(name: string | null) {
  if (!name) return "?";
  return name
    .split(" ")
    .map((s) => s[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function formatSchedule(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  if (sameDay) {
    return d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  }
  return d.toLocaleDateString(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function toVisitCard(row: VisitRow): VisitCardData {
  return {
    id: row.id,
    providerName: row.provider_name ?? "Caregiver",
    providerInitials: initialsOf(row.provider_name),
    serviceType: row.service_type,
    scheduledStart: formatSchedule(row.scheduled_at),
    status: STATUS_MAP[row.status] ?? "upcoming",
    amount:
      row.status === "completed"
        ? Math.round((row.hourly_rate_cents * row.duration_minutes) / 60 / 100)
        : undefined,
  };
}

function SeniorVisits() {
  const navigate = useNavigate();
  const fetchVisits = useServerFn(listMyVisits);
  const [tab, setTab] = useState<Tab>("upcoming");
  const visitsQ = useQuery({
    queryKey: ["senior", "visits"],
    queryFn: () => fetchVisits(),
  });

  if (visitsQ.isPending) {
    return <PageSkeleton title="visits" cards={4} />;
  }
  if (visitsQ.isError) {
    return (
      <ErrorState
        title="We couldn't load your visits"
        error={visitsQ.error}
        onRetry={() => visitsQ.refetch()}
      />
    );
  }

  const rows = visitsQ.data ?? [];
  const now = Date.now();
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  const today = rows.filter((r) => {
    const t = new Date(r.scheduled_at).getTime();
    return t >= now - 4 * 60 * 60 * 1000 && t <= todayEnd.getTime() && r.status !== "completed" && r.status !== "cancelled";
  });
  const upcoming = rows.filter(
    (r) =>
      new Date(r.scheduled_at).getTime() > todayEnd.getTime() &&
      r.status !== "completed" &&
      r.status !== "cancelled",
  );
  const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;
  const needsRating = rows.filter(
    (r) =>
      r.status === "completed" &&
      !r.senior_rating &&
      new Date(r.scheduled_at).getTime() >= thirtyDaysAgo,
  );
  const past = rows
    .filter((r) => r.status === "completed")
    .sort((a, b) => new Date(b.scheduled_at).getTime() - new Date(a.scheduled_at).getTime());
  const cancelled = rows
    .filter((r) => r.status === "cancelled")
    .sort((a, b) => new Date(b.scheduled_at).getTime() - new Date(a.scheduled_at).getTime());

  const upcomingCount = today.length + upcoming.length;
  const openVisit = (id: string) => navigate({ to: "/senior/visits/$id", params: { id } });

  const tabs: { id: Tab; label: string; count: number }[] = [
    { id: "upcoming", label: "Upcoming", count: upcomingCount },
    { id: "past", label: "Past", count: past.length },
    { id: "cancelled", label: "Cancelled", count: cancelled.length },
  ];

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl">Your visits</h1>
          <p className="mt-2 text-lg text-muted-foreground">
            Upcoming, in progress, and past — all in one place.
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate({ to: "/senior/book" })}
          className="inline-flex min-h-12 items-center gap-2 rounded-full bg-primary px-5 text-base font-semibold text-primary-foreground shadow-soft hover:bg-primary/90"
        >
          <Plus className="size-5" /> Book a visit
        </button>
      </div>

      {rows.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            title="No visits yet"
            description="When you book a caregiver, your visits will show up here."
            action={
              <button
                type="button"
                onClick={() => navigate({ to: "/senior/book" })}
                className="inline-flex min-h-14 items-center gap-2 rounded-full bg-primary px-6 text-base font-semibold text-primary-foreground shadow-soft hover:bg-primary/90"
              >
                <Plus className="size-5" />
                Book your first visit
              </button>
            }
          />
        </div>
      ) : (
        <>
          {needsRating.length > 0 && (
            <section className="mt-8 rounded-3xl border-2 border-primary/40 bg-primary/5 p-5">
              <div className="flex items-center gap-2">
                <Star className="size-5 text-primary" />
                <h2 className="font-serif text-xl">Please rate your recent visits</h2>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                Your feedback helps us match you with caregivers you love.
              </p>
              <div className="mt-4 grid gap-3">
                {needsRating.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => openVisit(r.id)}
                    className="flex items-center justify-between gap-3 rounded-2xl border border-input bg-card p-4 text-left hover:bg-secondary"
                  >
                    <span className="min-w-0">
                      <span className="block truncate font-semibold">
                        {r.provider_name ?? "Caregiver"}
                      </span>
                      <span className="block text-sm text-muted-foreground">
                        {formatSchedule(r.scheduled_at)} · {r.service_type}
                      </span>
                    </span>
                    <span className="rounded-full bg-primary px-4 py-1.5 text-sm font-semibold text-primary-foreground">
                      Rate
                    </span>
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* Filter tabs */}
          <div className="mt-8 flex gap-2 overflow-x-auto rounded-full border border-border bg-card p-1.5">
            {tabs.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={`inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-full px-4 text-base font-semibold transition ${
                  tab === t.id
                    ? "bg-primary text-primary-foreground shadow-soft"
                    : "text-muted-foreground hover:bg-secondary"
                }`}
              >
                {t.label}
                {t.count > 0 && (
                  <span
                    className={`inline-flex min-w-6 items-center justify-center rounded-full px-1.5 py-0.5 text-xs font-bold ${
                      tab === t.id
                        ? "bg-primary-foreground/20 text-primary-foreground"
                        : "bg-secondary text-secondary-foreground"
                    }`}
                  >
                    {t.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {tab === "upcoming" && (
            <>
              {upcomingCount === 0 ? (
                <div className="mt-8">
                  <EmptyState
                    title="No upcoming visits"
                    description="Book a caregiver whenever you're ready."
                  />
                </div>
              ) : (
                <>
                  {today.length > 0 && (
                    <Section title="Today">
                      {today.map((r) => (
                        <VisitCard
                          key={r.id}
                          visit={toVisitCard(r)}
                          onCall={() => window.location.assign("tel:18002273628")}
                          onChange={() => openVisit(r.id)}
                        />
                      ))}
                    </Section>
                  )}
                  {upcoming.length > 0 && (
                    <Section title="Coming up">
                      {upcoming.map((r) => (
                        <VisitCard
                          key={r.id}
                          visit={toVisitCard(r)}
                          onChange={() => openVisit(r.id)}
                        />
                      ))}
                    </Section>
                  )}
                </>
              )}
            </>
          )}

          {tab === "past" && (
            <>
              {past.length === 0 ? (
                <div className="mt-8">
                  <EmptyState
                    title="No past visits yet"
                    description="Completed visits will show up here."
                  />
                </div>
              ) : (
                <Section title="Completed">
                  {past.map((r) => (
                    <VisitCard
                      key={r.id}
                      visit={toVisitCard(r)}
                      onChange={() => openVisit(r.id)}
                    />
                  ))}
                </Section>
              )}
            </>
          )}

          {tab === "cancelled" && (
            <>
              {cancelled.length === 0 ? (
                <div className="mt-8">
                  <EmptyState
                    title="No cancelled visits"
                    description="Cancelled or missed visits will show up here."
                  />
                </div>
              ) : (
                <Section title="Cancelled">
                  {cancelled.map((r) => (
                    <VisitCard
                      key={r.id}
                      visit={toVisitCard(r)}
                      onChange={() => openVisit(r.id)}
                    />
                  ))}
                </Section>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-8">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </h2>
      <div className="mt-3 grid gap-4">{children}</div>
    </section>
  );
}
