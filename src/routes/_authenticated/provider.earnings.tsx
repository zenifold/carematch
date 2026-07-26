import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, TrendingUp, Wallet } from "lucide-react";
import { toast } from "sonner";
import { getProviderEarnings } from "@/lib/provider.functions";
import { createSupportTicket } from "@/lib/support.functions";
import { PageSkeleton, EmptyState, ErrorState, RouteErrorBoundary } from "@/components/carematch";

export const Route = createFileRoute("/_authenticated/provider/earnings")({
  component: EarningsPage,
  errorComponent: RouteErrorBoundary,
});

function fmtMoney(cents: number) {
  return `$${(cents / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
function fmtMoneyShort(cents: number) {
  return `$${(cents / 100).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

function EarningsPage() {
  const fn = useServerFn(getProviderEarnings);
  const q = useQuery({ queryKey: ["provider", "earnings"], queryFn: () => fn() });

  const createTicket = useServerFn(createSupportTicket);
  const requestOpsAction = useMutation({
    mutationFn: (subject: string) =>
      createTicket({
        data: { subject, body: `Requested from the Earnings page.`, portal: "provider" },
      }),
    onSuccess: () => toast.success("Sent — Ops will follow up by email"),
    onError: (err) => toast.error(err instanceof Error ? err.message : "Couldn't send request"),
  });

  if (q.isPending) return <PageSkeleton title="earnings" cards={4} />;
  if (q.isError) return <ErrorState error={q.error} onRetry={() => q.refetch()} />;

  const e = q.data!;
  const feePct = (e.platform_fee_bps / 100).toFixed(0);
  const latest = e.history[0];

  // Next Monday for payout schedule
  const nextPayout = new Date();
  nextPayout.setDate(nextPayout.getDate() + ((1 + 7 - nextPayout.getDay()) % 7 || 7));
  const unpaidCents =
    e.this_week.gross_cents - Math.round((e.this_week.gross_cents * e.platform_fee_bps) / 10000);

  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs uppercase tracking-widest text-muted-foreground">Payouts</p>
        <h1 className="font-serif text-2xl lg:text-3xl">Earnings</h1>
      </header>

      <section className="rounded-2xl border border-primary/30 bg-primary/5 p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-widest text-primary">Next payout</p>
            <p className="mt-1 font-serif text-3xl">{fmtMoney(unpaidCents)}</p>
            <p className="text-sm text-muted-foreground">
              Estimated net · pays out{" "}
              {nextPayout.toLocaleDateString(undefined, {
                weekday: "long",
                month: "short",
                day: "numeric",
              })}
            </p>
          </div>
          <div className="text-right text-xs text-muted-foreground">
            <p>{e.this_week.bookings} bookings this week</p>
            <p>{Math.round(e.this_week.hours)}h worked</p>
          </div>
        </div>
      </section>

      <div className="grid gap-3 sm:grid-cols-4">
        <Kpi
          label="This week (in progress)"
          value={fmtMoneyShort(e.this_week.gross_cents)}
          hint={`${e.this_week.bookings} bookings`}
        />
        <Kpi
          label="Last week"
          value={fmtMoneyShort(e.last_week.gross_cents)}
          hint={`${e.last_week.bookings} bookings`}
        />
        <Kpi
          label="Month to date"
          value={fmtMoneyShort(e.month_to_date.gross_cents)}
          hint={`${Math.round(e.month_to_date.hours)}h worked`}
        />
        <Kpi
          label="Year to date"
          value={fmtMoneyShort(e.year_to_date.gross_cents)}
          hint="1099 due Jan 31"
        />
      </div>

      <section className="rounded-2xl border border-border bg-card p-5">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-xl">Fee breakdown</h2>
          <span className="rounded-full bg-primary/10 px-2 py-1 text-xs font-semibold text-primary">
            Platform fee · {feePct}%
          </span>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Platform fee funds background checks, insurance, payment protection, and family
          visibility. See{" "}
          <a href="/pricing" className="underline">
            pricing
          </a>{" "}
          for full breakdown.
        </p>
        {latest ? (
          <div className="mt-4 grid gap-2 text-sm sm:grid-cols-3">
            <FeeRow label="Gross (last week)" value={fmtMoney(latest.gross_cents)} />
            <FeeRow label={`Platform fee (${feePct}%)`} value={`-${fmtMoney(latest.fee_cents)}`} />
            <FeeRow label="Net payout" value={fmtMoney(latest.net_cents)} bold />
          </div>
        ) : (
          <p className="mt-4 text-sm text-muted-foreground">
            No completed bookings yet — your first payout summary will appear here.
          </p>
        )}
      </section>

      <section>
        <h2 className="mb-2 text-sm font-bold uppercase tracking-widest text-muted-foreground">
          Weekly history
        </h2>
        {e.history.length === 0 ? (
          <EmptyState
            icon={<Wallet className="size-6" />}
            title="No earnings yet"
            description="Once you complete bookings, weekly payout summaries appear here."
          />
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-border bg-card">
            <table className="w-full text-sm">
              <thead className="text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 text-left font-medium">Week</th>
                  <th className="px-3 py-2 text-right font-medium">Gross</th>
                  <th className="px-3 py-2 text-right font-medium">Fee</th>
                  <th className="px-3 py-2 text-right font-medium">Net</th>
                </tr>
              </thead>
              <tbody>
                {e.history.map((p) => (
                  <tr key={p.week_start} className="border-t border-border">
                    <td className="px-3 py-2">
                      {new Date(p.week_start).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                      })}
                      {" – "}
                      {new Date(p.week_end).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                      })}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">{fmtMoney(p.gross_cents)}</td>
                    <td className="px-3 py-2 text-right tabular-nums text-muted-foreground">
                      -{fmtMoney(p.fee_cents)}
                    </td>
                    <td className="px-3 py-2 text-right font-semibold tabular-nums">
                      {fmtMoney(p.net_cents)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-5">
          <h3 className="font-serif text-lg">Direct deposit</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Payouts run every Monday to the bank account you have on file.
          </p>
          <button
            type="button"
            disabled={requestOpsAction.isPending}
            onClick={() => requestOpsAction.mutate("Update bank / payout details")}
            className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-input bg-background px-3 py-1.5 text-xs font-semibold hover:bg-secondary disabled:opacity-50"
          >
            {requestOpsAction.isPending ? <Loader2 className="size-3.5 animate-spin" /> : null}
            Update bank
          </button>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5">
          <h3 className="font-serif text-lg">Tax documents</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            1099-NEC available in January for earnings over $600.
          </p>
          <button
            type="button"
            disabled={requestOpsAction.isPending}
            onClick={() => requestOpsAction.mutate("Send my W-9 / 1099 documents")}
            className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-input bg-background px-3 py-1.5 text-xs font-semibold hover:bg-secondary disabled:opacity-50"
          >
            {requestOpsAction.isPending ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <TrendingUp className="size-3.5" />
            )}
            View W-9 / 1099
          </button>
        </div>
      </section>
    </div>
  );
}

function Kpi({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <p className="text-xs uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className="mt-1 font-serif text-2xl">{value}</p>
      <p className="text-xs text-muted-foreground">{hint}</p>
    </div>
  );
}

function FeeRow({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className={`rounded-lg border border-border p-3 ${bold ? "bg-primary/5" : ""}`}>
      <p className="text-xs uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className={`mt-0.5 tabular-nums ${bold ? "font-serif text-xl" : "text-base"}`}>{value}</p>
    </div>
  );
}
