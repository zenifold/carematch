import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { CalendarClock, CheckCircle2, Download, Eye, LifeBuoy, Wallet } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  BudgetBar,
  PageSkeleton,
  EmptyState,
  ErrorState,
  RouteErrorBoundary,
} from "@/components/carematch";
import { listMyVisits, type VisitRow } from "@/lib/bookings.functions";
import { getSeniorPreferences } from "@/lib/senior-preferences.functions";

export const Route = createFileRoute("/_authenticated/senior/money")({
  component: SeniorMoney,
  errorComponent: RouteErrorBoundary,
});

function centsToDollars(cents: number) {
  return Math.round(cents / 100);
}

function computeVisitCost(row: VisitRow) {
  return Math.round((row.hourly_rate_cents * row.duration_minutes) / 60 / 100);
}

function downloadReceipt(r: VisitRow, amount: number) {
  const when = new Date(r.scheduled_at);
  const lines = [
    "CareMatch — Visit Receipt",
    "",
    `Visit ID:     ${r.id}`,
    `Date:         ${when.toLocaleString()}`,
    `Caregiver:    ${r.provider_name ?? "Caregiver"}`,
    `Service:      ${r.service_type}`,
    `Duration:     ${Math.round(r.duration_minutes / 60)}h (${r.duration_minutes} min)`,
    `Hourly rate:  $${(r.hourly_rate_cents / 100).toFixed(2)}`,
    `Total:        $${amount.toFixed(2)}`,
    "",
    "Thank you for using CareMatch.",
  ];
  const blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `carematch-receipt-${r.id.slice(0, 8)}.txt`;
  a.click();
  URL.revokeObjectURL(url);
}

function SeniorMoney() {
  const fetchVisits = useServerFn(listMyVisits);
  const fetchPrefs = useServerFn(getSeniorPreferences);
  const visitsQ = useQuery({
    queryKey: ["senior", "visits"],
    queryFn: () => fetchVisits(),
  });

  const profileQ = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return null;
      const { data } = await supabase
        .from("profiles")
        .select("monthly_budget_cents")
        .eq("id", u.user.id)
        .maybeSingle();
      return data;
    },
  });

  const prefsQ = useQuery({
    queryKey: ["senior", "preferences"],
    queryFn: () => fetchPrefs(),
  });

  if (visitsQ.isPending || profileQ.isPending) {
    return <PageSkeleton title="money" cards={3} />;
  }
  if (visitsQ.isError) {
    return (
      <ErrorState
        title="We couldn't load your billing"
        error={visitsQ.error}
        onRetry={() => visitsQ.refetch()}
      />
    );
  }

  const fmt = (n: number) =>
    n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

  const rows = visitsQ.data ?? [];
  const budget = centsToDollars(profileQ.data?.monthly_budget_cents ?? 120000);

  // Sum spend for the current calendar month from completed visits.
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
  const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1).getTime();
  const twoWeeksOut = now.getTime() + 14 * 24 * 60 * 60 * 1000;

  const spent = rows
    .filter((r) => r.status === "completed" && new Date(r.scheduled_at).getTime() >= monthStart)
    .reduce((sum, r) => sum + computeVisitCost(r), 0);

  // Traffic-light framing
  const pct = budget > 0 ? spent / budget : 0;
  const light: "green" | "amber" | "red" = pct >= 0.9 ? "red" : pct >= 0.65 ? "amber" : "green";
  const completedThisMonth = rows.filter(
    (r) => r.status === "completed" && new Date(r.scheduled_at).getTime() >= monthStart,
  ).length;
  const remaining = Math.max(0, budget - spent);
  const daysLeft = Math.max(1, Math.ceil((nextMonthStart - now.getTime()) / (24 * 60 * 60 * 1000)));

  const lightCopy: Record<typeof light, { chip: string; classes: string; summary: string }> = {
    green: {
      chip: "On track",
      classes: "border-emerald-300/60 bg-emerald-50 text-emerald-800",
      summary: `You've used ${fmt(spent)} of ${fmt(budget)} this month across ${completedThisMonth} visit${
        completedThisMonth === 1 ? "" : "s"
      }. ${fmt(remaining)} left with ${daysLeft} day${daysLeft === 1 ? "" : "s"} to go.`,
    },
    amber: {
      chip: "Watch closely",
      classes: "border-amber-300/60 bg-amber-50 text-amber-900",
      summary: `You've used ${fmt(spent)} of ${fmt(budget)} this month. ${fmt(
        remaining,
      )} left with ${daysLeft} day${daysLeft === 1 ? "" : "s"} to go — we'd space out extra visits.`,
    },
    red: {
      chip: "Over plan",
      classes: "border-destructive/40 bg-destructive/10 text-destructive",
      summary: `You've used ${fmt(spent)} of ${fmt(
        budget,
      )} this month. Call the concierge and we'll adjust the plan together.`,
    },
  };

  // Upcoming charges — next 14 days of not-yet-completed visits
  const upcoming = rows
    .filter(
      (r) =>
        (r.status === "requested" || r.status === "confirmed" || r.status === "in_progress") &&
        new Date(r.scheduled_at).getTime() >= now.getTime() &&
        new Date(r.scheduled_at).getTime() <= twoWeeksOut,
    )
    .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime())
    .slice(0, 6);

  const upcomingTotal = upcoming.reduce((s, r) => s + computeVisitCost(r), 0);

  // Group completed visits by ISO week for the running-total ledger.
  const completed = rows
    .filter((r) => r.status === "completed")
    .sort((a, b) => new Date(b.scheduled_at).getTime() - new Date(a.scheduled_at).getTime());

  function weekKey(iso: string) {
    const d = new Date(iso);
    const day = d.getDay();
    const monday = new Date(d);
    monday.setDate(d.getDate() - ((day + 6) % 7));
    monday.setHours(0, 0, 0, 0);
    return monday.toISOString();
  }
  function weekLabel(key: string) {
    const start = new Date(key);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    const sameMonth = start.getMonth() === end.getMonth();
    const f = (d: Date) => d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
    return sameMonth ? `Week of ${f(start)}` : `${f(start)} – ${f(end)}`;
  }

  const weekMap = new Map<string, VisitRow[]>();
  for (const r of completed) {
    const k = weekKey(r.scheduled_at);
    const list = weekMap.get(k) ?? [];
    list.push(r);
    weekMap.set(k, list);
  }
  const weeks = Array.from(weekMap.entries()).slice(0, 6);

  const familyCanSee = prefsQ.data?.family_can_see ?? false;

  return (
    <div>
      <h1 className="font-serif text-3xl">Your money</h1>
      <p className="mt-2 text-lg text-muted-foreground">
        No surprises. See every charge before it happens.
      </p>

      {/* Traffic light + narrative */}
      <section className={`mt-6 rounded-3xl border-2 p-6 ${lightCopy[light].classes}`}>
        <div className="flex items-center gap-3">
          <span
            className={`inline-flex h-3 w-3 rounded-full ${
              light === "green"
                ? "bg-emerald-500"
                : light === "amber"
                  ? "bg-amber-500"
                  : "bg-destructive"
            }`}
            aria-hidden
          />
          <p className="text-xs font-bold uppercase tracking-widest">{lightCopy[light].chip}</p>
        </div>
        <p className="mt-3 text-lg leading-relaxed">{lightCopy[light].summary}</p>
        <div className="mt-4">
          <BudgetBar spent={spent} budget={budget} />
        </div>
        {familyCanSee ? (
          <p className="mt-4 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
            <Eye className="size-3.5" aria-hidden /> Approved family can see this page.
          </p>
        ) : null}
      </section>

      {/* Upcoming charges */}
      <section className="mt-8">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <CalendarClock className="size-5 text-primary" />
            <h2 className="font-serif text-2xl">Coming up (next 2 weeks)</h2>
          </div>
          {upcoming.length > 0 ? (
            <p className="text-sm text-muted-foreground">
              About <span className="font-semibold text-foreground">{fmt(upcomingTotal)}</span>
            </p>
          ) : null}
        </div>
        {upcoming.length === 0 ? (
          <div className="mt-4">
            <EmptyState
              icon={<CalendarClock className="size-6" />}
              title="Nothing scheduled"
              description="When you book a visit it'll show up here with the estimated cost."
              action={
                <Link
                  to="/senior/book"
                  className="inline-flex min-h-11 items-center gap-2 rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
                >
                  Book a visit
                </Link>
              }
            />
          </div>
        ) : (
          <ul className="mt-4 grid gap-3">
            {upcoming.map((r) => {
              const when = new Date(r.scheduled_at);
              return (
                <li
                  key={r.id}
                  className="flex items-start justify-between gap-4 rounded-2xl border border-border bg-card p-5"
                >
                  <div className="flex min-w-0 flex-1 items-start gap-3">
                    <span className="mt-1 grid size-10 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
                      <CalendarClock className="size-5" />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-base font-semibold">
                        {r.provider_name ?? "Caregiver TBD"} · {Math.round(r.duration_minutes / 60)}
                        h
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {when.toLocaleDateString(undefined, {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                        })}{" "}
                        ·{" "}
                        {when.toLocaleTimeString(undefined, {
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </p>
                      <p className="text-xs text-muted-foreground">Charged after check-out</p>
                    </div>
                  </div>
                  <p className="shrink-0 font-serif text-xl">~{fmt(computeVisitCost(r))}</p>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="mt-8">
        <div className="flex items-center gap-2">
          <Wallet className="size-5 text-primary" />
          <h2 className="font-serif text-2xl">Recent activity</h2>
        </div>
        {weeks.length === 0 ? (
          <div className="mt-4">
            <EmptyState
              icon={<Wallet className="size-6" />}
              title="No charges yet"
              description="You'll see every visit and charge here after your first completed booking."
            />
          </div>
        ) : (
          <div className="mt-4 grid gap-6">
            {weeks.map(([key, visits]) => {
              const weekTotal = visits.reduce((s, r) => s + computeVisitCost(r), 0);
              return (
                <div key={key}>
                  <div className="flex items-baseline justify-between gap-3">
                    <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                      {weekLabel(key)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Total <span className="font-bold text-foreground">{fmt(weekTotal)}</span>
                    </p>
                  </div>
                  <ul className="mt-3 grid gap-3">
                    {visits.map((r) => {
                      const amount = computeVisitCost(r);
                      return (
                        <li
                          key={r.id}
                          className="flex items-start justify-between gap-4 rounded-2xl border border-border bg-card p-5"
                        >
                          <div className="flex min-w-0 flex-1 items-start gap-3">
                            <span className="mt-1 grid size-10 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
                              <CheckCircle2 className="size-5" />
                            </span>
                            <div className="min-w-0">
                              <p className="truncate text-base font-semibold">
                                {r.provider_name ?? "Caregiver"} ·{" "}
                                {Math.round(r.duration_minutes / 60)}h
                              </p>
                              <p className="text-sm text-muted-foreground">{r.service_type}</p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(r.scheduled_at).toLocaleDateString(undefined, {
                                  weekday: "short",
                                  month: "short",
                                  day: "numeric",
                                })}
                              </p>
                              <button
                                type="button"
                                onClick={() => downloadReceipt(r, amount)}
                                className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-primary underline-offset-4 hover:underline"
                              >
                                <Download className="size-4" /> Download receipt
                              </button>
                            </div>
                          </div>
                          <p className="shrink-0 font-serif text-xl">{fmt(amount)}</p>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <div className="mt-8 rounded-2xl bg-sage-50 p-5 text-sm text-sage-700">
        <p>
          Every visit is billed only after check-out, based on the actual time logged — never
          before. Questions about a charge or a refund go straight to a real person, no hold music.
        </p>
        <Link
          to="/senior/help"
          className="mt-3 inline-flex items-center gap-2 font-semibold text-sage-800 underline-offset-4 hover:underline"
        >
          <LifeBuoy className="size-4" /> Question about a charge? Talk to us.
        </Link>
      </div>
    </div>
  );
}
