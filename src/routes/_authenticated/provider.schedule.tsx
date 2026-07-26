import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { CalendarDays } from "lucide-react";
import { listProviderJobs, type ProviderJob } from "@/lib/provider.functions";
import {
  PageSkeleton,
  EmptyState,
  ErrorState,
  RouteErrorBoundary,
} from "@/components/carematch";

export const Route = createFileRoute("/_authenticated/provider/schedule")({
  component: SchedulePage,
  errorComponent: RouteErrorBoundary,
});

function startOfWeek(d: Date): Date {
  const out = new Date(d);
  out.setHours(0, 0, 0, 0);
  out.setDate(out.getDate() - ((out.getDay() + 6) % 7));
  return out;
}
function addDays(d: Date, n: number): Date {
  const out = new Date(d);
  out.setDate(out.getDate() + n);
  return out;
}
function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}
function fmtMoney(cents: number) {
  return `$${(cents / 100).toFixed(0)}`;
}

function SchedulePage() {
  const jobsFn = useServerFn(listProviderJobs);
  const jobsQ = useQuery({ queryKey: ["provider", "jobs"], queryFn: () => jobsFn() });

  const [weekOffset, setWeekOffset] = useState(0);
  const weekStart = useMemo(() => {
    const s = startOfWeek(new Date());
    return addDays(s, weekOffset * 7);
  }, [weekOffset]);

  if (jobsQ.isPending) return <PageSkeleton title="schedule" cards={3} />;
  if (jobsQ.isError) return <ErrorState error={jobsQ.error} onRetry={() => jobsQ.refetch()} />;

  const jobs = (jobsQ.data ?? []).filter((j) => j.status !== "cancelled");

  const days = Array.from({ length: 7 }).map((_, i) => {
    const day = addDays(weekStart, i);
    const nextDay = addDays(day, 1);
    const shifts = jobs
      .filter((j) => {
        const at = new Date(j.scheduled_at);
        return at >= day && at < nextDay;
      })
      .sort((a, b) => a.scheduled_at.localeCompare(b.scheduled_at));
    return { day, shifts };
  });

  const now = new Date();
  const nextVisit = jobs.find((j) => new Date(j.scheduled_at) >= now);
  const label = `Week of ${weekStart.toLocaleDateString(undefined, { month: "short", day: "numeric" })}`;

  const allEmpty = days.every((d) => d.shifts.length === 0);

  const weekShifts = days.flatMap((d) => d.shifts);
  const weekHours = weekShifts.reduce((s, j) => s + j.duration_minutes / 60, 0);
  const weekGross = weekShifts.reduce(
    (s, j) => s + Math.round((j.hourly_rate_cents * j.duration_minutes) / 60),
    0,
  );
  const weekConfirmed = weekShifts.filter((s) => s.status !== "requested").length;

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-widest text-muted-foreground">{label}</p>
          <h1 className="font-serif text-2xl lg:text-3xl">Schedule</h1>
        </div>
        <div className="flex gap-2 text-xs">
          <button onClick={() => setWeekOffset((n) => n - 1)} className="rounded-lg border border-input bg-background px-3 py-1.5">
            ← Prev week
          </button>
          <button onClick={() => setWeekOffset(0)} className="rounded-lg border border-input bg-background px-3 py-1.5">
            This week
          </button>
          <button onClick={() => setWeekOffset((n) => n + 1)} className="rounded-lg border border-input bg-background px-3 py-1.5">
            Next week →
          </button>
        </div>
      </header>

      {!allEmpty && (
        <div className="grid gap-3 sm:grid-cols-4">
          <WeekStat label="Shifts" value={String(weekShifts.length)} />
          <WeekStat label="Confirmed" value={`${weekConfirmed}/${weekShifts.length}`} />
          <WeekStat label="Hours" value={weekHours.toFixed(1)} />
          <WeekStat label="Gross" value={fmtMoney(weekGross)} />
        </div>
      )}


      {allEmpty ? (
        <EmptyState
          icon={<CalendarDays className="size-6" />}
          title="Nothing scheduled this week"
          description="Accept invites from the jobs board to fill your calendar."
          action={
            <Link
              to="/provider/jobs"
              className="inline-flex rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
            >
              Browse jobs
            </Link>
          }
        />
      ) : (
        <div className="grid gap-3 lg:grid-cols-7">
          {days.map(({ day, shifts }) => {
            const isToday =
              day.getFullYear() === now.getFullYear() &&
              day.getMonth() === now.getMonth() &&
              day.getDate() === now.getDate();
            return (
              <div key={day.toISOString()} className="rounded-xl border border-border bg-card p-3">
                <div className="mb-2 flex items-baseline justify-between">
                  <p className="text-sm font-bold">{day.toLocaleDateString(undefined, { weekday: "short" })}</p>
                  <p className="text-xs text-muted-foreground">
                    {day.toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                  </p>
                </div>
                <div className="space-y-2">
                  {shifts.length === 0 ? (
                    <p className="rounded-md border border-dashed border-border p-2 text-center text-[10px] text-muted-foreground">
                      Open
                    </p>
                  ) : (
                    shifts.map((s) => (
                      <ShiftPill key={s.id} shift={s} highlighted={isToday} />
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {nextVisit && <NextVisitCard shift={nextVisit} />}
    </div>
  );
}

function ShiftPill({ shift, highlighted }: { shift: ProviderJob; highlighted?: boolean }) {
  const pay = Math.round((shift.hourly_rate_cents * shift.duration_minutes) / 60);
  return (
    <div
      className={`rounded-md border p-2 text-xs ${
        highlighted
          ? "border-primary/40 bg-primary/5"
          : shift.status === "requested"
          ? "border-amber-500/30 bg-amber-500/5"
          : "border-border bg-secondary/40"
      }`}
    >
      <p className="font-semibold">{fmtTime(shift.scheduled_at)}</p>
      <p className="text-muted-foreground">{shift.senior_name ?? "Senior"}</p>
      <p className="text-[10px] text-muted-foreground">
        {shift.service_type} · {fmtMoney(pay)}
      </p>
    </div>
  );
}

function NextVisitCard({ shift }: { shift: ProviderJob }) {
  const pay = Math.round((shift.hourly_rate_cents * shift.duration_minutes) / 60);
  return (
    <section className="rounded-2xl border border-border bg-card p-5">
      <h2 className="font-serif text-xl">Next visit · {shift.senior_name ?? "Senior"}</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        {new Date(shift.scheduled_at).toLocaleString(undefined, {
          weekday: "short",
          month: "short",
          day: "numeric",
          hour: "numeric",
          minute: "2-digit",
        })}{" "}
        · {shift.service_type} · {fmtMoney(pay)}
      </p>
      {shift.senior_city && (
        <p className="mt-2 text-sm text-muted-foreground">Location: {shift.senior_city}</p>
      )}
      {shift.notes && (
        <div className="mt-3 rounded-lg border border-border p-3 text-sm">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Care notes</p>
          <p className="mt-1">{shift.notes}</p>
        </div>
      )}
    </section>
  );
}

function WeekStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-3">
      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
        {label}
      </p>
      <p className="mt-0.5 font-serif text-xl tabular-nums">{value}</p>
    </div>
  );
}

