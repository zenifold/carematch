import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Download, HandHeart, Sliders, UserPlus, Wallet } from "lucide-react";
import {
  PageSkeleton,
  EmptyState,
  ErrorState,
  RouteErrorBoundary,
  PermissionBanner,
  RequestChangeDialog,
  OutgoingRequestsList,
} from "@/components/carematch";
import {
  getFamilyBudget,
  getSeniorEditPermission,
  listMyLinkedSeniors,
  listVisitsForSenior,
} from "@/lib/family.functions";
import type { VisitRow } from "@/lib/bookings.functions";
import { BudgetBar } from "@/components/carematch/BudgetBar";

export const Route = createFileRoute("/_authenticated/family/budget")({
  component: FamilyBudget,
  errorComponent: RouteErrorBoundary,
});

function weekKey(iso: string) {
  const d = new Date(iso);
  const day = (d.getDay() + 6) % 7; // Mon = 0
  const monday = new Date(d);
  monday.setDate(d.getDate() - day);
  monday.setHours(0, 0, 0, 0);
  return monday.toISOString().slice(0, 10);
}

function weekLabel(key: string) {
  const start = new Date(key);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
  return `${start.toLocaleDateString(undefined, opts)} – ${end.toLocaleDateString(undefined, opts)}`;
}

function downloadReceipt(v: VisitRow, seniorName: string) {
  const total = (v.hourly_rate_cents * v.duration_minutes) / 60 / 100;
  const lines = [
    `CareMatch receipt`,
    `Visit ID: ${v.id}`,
    `Senior: ${seniorName}`,
    `Date: ${new Date(v.scheduled_at).toLocaleString()}`,
    `Caregiver: ${v.provider_name ?? "—"}`,
    `Service: ${v.service_type}`,
    `Duration: ${(v.duration_minutes / 60).toFixed(2)}h`,
    `Hourly rate: $${(v.hourly_rate_cents / 100).toFixed(2)}`,
    `Total: $${total.toFixed(2)}`,
  ].join("\n");
  const blob = new Blob([lines], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `receipt-${v.id.slice(0, 8)}.txt`;
  a.click();
  URL.revokeObjectURL(url);
}

function fmtMoney(cents: number) {
  return `$${(cents / 100).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

function FamilyBudget() {
  const fetchLinks = useServerFn(listMyLinkedSeniors);
  const fetchBudget = useServerFn(getFamilyBudget);
  const fetchVisits = useServerFn(listVisitsForSenior);
  const fetchPerm = useServerFn(getSeniorEditPermission);

  const linksQ = useQuery({ queryKey: ["family", "links"], queryFn: () => fetchLinks() });
  const primary = linksQ.data?.[0];

  const permQ = useQuery({
    queryKey: ["family", "perm", primary?.senior_id ?? ""],
    enabled: !!primary,
    queryFn: () => fetchPerm({ data: { senior_id: primary!.senior_id } }),
  });
  const canEdit = permQ.data?.can_edit ?? false;

  const budgetQ = useQuery({
    queryKey: ["family", "budget", primary?.senior_id ?? ""],
    enabled: !!primary,
    queryFn: () => fetchBudget({ data: { senior_id: primary!.senior_id } }),
  });

  const visitsQ = useQuery({
    queryKey: ["family", "visits", primary?.senior_id ?? ""],
    enabled: !!primary,
    queryFn: () => fetchVisits({ data: { senior_id: primary!.senior_id } }),
  });

  if (linksQ.isPending) return <PageSkeleton title="budget" cards={3} />;
  if (linksQ.isError)
    return <ErrorState title="We couldn't load your budget" error={linksQ.error} onRetry={() => linksQ.refetch()} />;

  if (!primary) {
    return (
      <div className="space-y-6">
        <Header />
        <EmptyState
          icon={<UserPlus className="size-6" />}
          title="No linked senior"
          description="Once you're linked to a senior, their spend will roll up here."
          action={
            <Link
              to="/family/settings"
              className="inline-flex min-h-14 items-center rounded-full bg-primary px-6 text-base font-semibold text-primary-foreground shadow-soft hover:bg-primary/90"
            >
              Manage links
            </Link>
          }
        />
      </div>
    );
  }

  if (budgetQ.isPending)
    return (
      <div className="space-y-6">
        <Header />
        <PageSkeleton cards={3} />
      </div>
    );
  if (budgetQ.isError)
    return (
      <div className="space-y-6">
        <Header />
        <ErrorState title="We couldn't load the budget" error={budgetQ.error} onRetry={() => budgetQ.refetch()} />
      </div>
    );

  const b = budgetQ.data!;
  const max = Math.max(1, ...b.by_month.map((m) => m.cents));
  const budget = b.monthly_budget_cents ?? 0;
  const utilization = budget > 0 ? Math.min(100, Math.round((b.month_to_date_cents / budget) * 100)) : null;
  const noData = b.by_month.every((m) => m.cents === 0) && b.by_provider.length === 0;

  const delta = b.month_to_date_cents - b.last_month_cents;
  const deltaLabel =
    b.last_month_cents === 0
      ? null
      : `${delta >= 0 ? "+" : "−"}${fmtMoney(Math.abs(delta))} vs last month`;

  return (
    <div className="space-y-8">
      <Header />

      {!canEdit && <PermissionBanner seniorName={primary.full_name} action="change the budget" />}

      <OutgoingRequestsList seniorId={primary.senior_id} filterKind="budget" />

      {budget > 0 && (
        <section className="surface-card p-5 lg:p-6">
          <BudgetBar spent={b.month_to_date_cents} budget={budget} label="This month" />
          {deltaLabel && (
            <p className="mt-3 text-sm text-muted-foreground">{deltaLabel}</p>
          )}
          <div className="mt-4">
            {canEdit ? (
              <Link
                to="/family/settings"
                className="inline-flex min-h-10 items-center gap-2 rounded-full border border-border px-4 text-sm font-semibold hover:bg-secondary"
              >
                <Sliders className="size-4" /> Adjust monthly plan
              </Link>
            ) : (
              <BudgetRequestTrigger seniorId={primary.senior_id} seniorName={primary.full_name} currentCents={budget} />
            )}
          </div>
        </section>
      )}

      <section className="grid gap-3 sm:grid-cols-3">
        <Kpi label="Month to date" value={fmtMoney(b.month_to_date_cents)} hint={deltaLabel ?? undefined} />
        <Kpi label="Last month" value={fmtMoney(b.last_month_cents)} />
        <Kpi
          label="Monthly budget"
          value={budget > 0 ? fmtMoney(budget) : "Not set"}
          hint={
            utilization !== null
              ? `${utilization}% used`
              : "Set a monthly plan in senior preferences to get traffic-light guidance"
          }
        />
      </section>

      {noData ? (
        <EmptyState
          icon={<Wallet className="size-6" />}
          title="No spend yet"
          description="Once visits complete, monthly totals and per-caregiver breakdowns will appear here."
        />
      ) : (
        <>
          <section className="surface-card p-5 lg:p-6">
            <div className="flex items-baseline justify-between">
              <h2 className="font-serif text-2xl">Month over month</h2>
              <p className="text-sm text-muted-foreground">Last 6 months</p>
            </div>
            <div className="mt-6 grid grid-cols-6 items-end gap-3 h-40">
              {b.by_month.map((m, i) => (
                <div key={`${m.month}-${i}`} className="flex flex-col items-center gap-2">
                  <div
                    className="w-full rounded-t-lg bg-primary/80"
                    style={{ height: `${(m.cents / max) * 100}%`, minHeight: m.cents > 0 ? 4 : 0 }}
                    title={fmtMoney(m.cents)}
                  />
                  <p className="text-xs text-muted-foreground">{m.month}</p>
                  <p className="text-xs font-semibold">{fmtMoney(m.cents)}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="surface-card overflow-hidden">
            <div className="border-b border-border p-5">
              <h2 className="font-serif text-2xl">By caregiver · this window</h2>
              <p className="text-sm text-muted-foreground">Completed visits only</p>
            </div>
            {b.by_provider.length === 0 ? (
              <p className="p-5 text-sm text-muted-foreground">No caregivers yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-secondary/40 text-left text-xs uppercase tracking-widest text-muted-foreground">
                    <tr>
                      <th className="px-5 py-3 font-semibold">Caregiver</th>
                      <th className="px-5 py-3 font-semibold">Hours</th>
                      <th className="px-5 py-3 text-right font-semibold">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {b.by_provider.map((p) => (
                      <tr key={p.provider_id}>
                        <td className="px-5 py-3 font-medium">{p.provider_name ?? "Caregiver"}</td>
                        <td className="px-5 py-3 tabular-nums">{p.hours.toFixed(1)}h</td>
                        <td className="px-5 py-3 text-right font-semibold tabular-nums">{fmtMoney(p.cents)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}

      {(() => {
        const completed = (visitsQ.data ?? []).filter((v) => v.status === "completed");
        if (completed.length === 0) return null;
        const byWeek = new Map<string, VisitRow[]>();
        for (const v of completed) {
          const k = weekKey(v.scheduled_at);
          const arr = byWeek.get(k) ?? [];
          arr.push(v);
          byWeek.set(k, arr);
        }
        const weeks = Array.from(byWeek.entries())
          .sort((a, b) => (a[0] < b[0] ? 1 : -1))
          .slice(0, 5);
        const seniorName = primary.full_name ?? "Senior";
        return (
          <section className="surface-card overflow-hidden">
            <div className="border-b border-border p-5">
              <h2 className="font-serif text-2xl">Transactions</h2>
              <p className="text-sm text-muted-foreground">Grouped by week · last 5 weeks</p>
            </div>
            <ul className="divide-y divide-border">
              {weeks.map(([key, items]) => {
                const total = items.reduce(
                  (s, v) => s + (v.hourly_rate_cents * v.duration_minutes) / 60,
                  0,
                );
                return (
                  <li key={key} className="p-5">
                    <div className="flex items-baseline justify-between">
                      <p className="font-semibold">{weekLabel(key)}</p>
                      <p className="font-serif text-lg tabular-nums">{fmtMoney(total)}</p>
                    </div>
                    <ul className="mt-3 space-y-2">
                      {items.map((v) => {
                        const cents = (v.hourly_rate_cents * v.duration_minutes) / 60;
                        return (
                          <li
                            key={v.id}
                            className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-secondary/30 p-3"
                          >
                            <div className="min-w-0">
                              <p className="text-sm font-medium">
                                {v.provider_name ?? "Caregiver"} · {v.service_type}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(v.scheduled_at).toLocaleDateString(undefined, {
                                  weekday: "short",
                                  month: "short",
                                  day: "numeric",
                                })}{" "}
                                · {(v.duration_minutes / 60).toFixed(1)}h
                              </p>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-sm font-semibold tabular-nums">
                                {fmtMoney(cents)}
                              </span>
                              <button
                                type="button"
                                onClick={() => downloadReceipt(v, seniorName)}
                                className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1.5 text-xs font-semibold hover:bg-card"
                              >
                                <Download className="size-3.5" /> Receipt
                              </button>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })()}



      <section className="surface-card p-5 lg:p-6">
        <div className="flex items-start gap-3">
          <HandHeart className="mt-1 size-5 text-primary" />
          <div className="flex-1">
            <h2 className="font-serif text-2xl">Funding navigator</h2>
            <p className="text-sm text-muted-foreground">
              You may qualify for programs like VA Aid &amp; Attendance or Medicaid HCBS waivers.
              We'll add a screener soon.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

function Header() {
  return (
    <div>
      <p className="text-xs uppercase tracking-widest text-muted-foreground">Plan vs. actual</p>
      <h1 className="mt-1 font-serif text-3xl lg:text-4xl">Budget</h1>
    </div>
  );
}

function BudgetRequestTrigger({
  seniorId,
  seniorName,
  currentCents,
}: {
  seniorId: string;
  seniorName: string | null;
  currentCents: number;
}) {
  const [open, setOpen] = useState(false);
  const [dollars, setDollars] = useState(Math.round(currentCents / 100));
  const proposedCents = Math.max(0, Math.round(dollars * 100));
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex min-h-10 items-center gap-2 rounded-full border border-border px-4 text-sm font-semibold hover:bg-secondary"
      >
        <Sliders className="size-4" /> Request a plan change
      </button>
      <RequestChangeDialog
        open={open}
        onOpenChange={setOpen}
        seniorId={seniorId}
        seniorName={seniorName}
        kind="budget"
        title="Request a budget change"
        payload={{ monthly_budget_cents: proposedCents }}
        summary={
          <div className="space-y-2">
            <div className="flex items-center justify-between text-muted-foreground">
              <span>Current</span>
              <span className="font-semibold text-foreground">${(currentCents / 100).toLocaleString()}/mo</span>
            </div>
            <label className="block">
              Proposed
              <div className="mt-1 flex items-center gap-2">
                <span className="text-muted-foreground">$</span>
                <input
                  type="number"
                  min={0}
                  step={50}
                  value={dollars}
                  onChange={(e) => setDollars(Number(e.target.value) || 0)}
                  className="w-32 rounded-xl border border-input bg-background p-2 text-sm"
                />
                <span className="text-muted-foreground">/ month</span>
              </div>
            </label>
          </div>
        }
      />
    </>
  );
}

function Kpi({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <p className="text-xs uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className="mt-1 font-serif text-2xl">{value}</p>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
