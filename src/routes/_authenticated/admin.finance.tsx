import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { DollarSign, Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  listLedger,
  markPayoutPaid,
  createRefund,
  type LedgerRow,
} from "@/lib/admin-finance.functions";
import { PageSkeleton, EmptyState, ErrorState, RouteErrorBoundary } from "@/components/carematch";

export const Route = createFileRoute("/_authenticated/admin/finance")({
  component: FinancePage,
  errorComponent: RouteErrorBoundary,
});

function money(cents: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(cents / 100);
}
function fmt(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

const entryTone: Record<string, string> = {
  charge: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
  platform_fee: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300",
  provider_payout: "bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-300",
  refund: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  adjustment: "bg-muted text-muted-foreground",
};

function toCsv(rows: LedgerRow[]) {
  const header = "id,entry_type,status,amount,currency,senior,provider,memo,created_at,posted_at\n";
  const body = rows
    .map((r) =>
      [
        r.id,
        r.entry_type,
        r.status,
        (r.amount_cents / 100).toFixed(2),
        r.currency,
        r.senior_name ?? "",
        r.provider_name ?? "",
        (r.memo ?? "").replace(/"/g, '""'),
        r.created_at,
        r.posted_at ?? "",
      ]
        .map((v) => `"${v}"`)
        .join(","),
    )
    .join("\n");
  return header + body;
}

function FinancePage() {
  const listFn = useServerFn(listLedger);
  const qc = useQueryClient();
  const refundFn = useServerFn(createRefund);
  const [entryType, setEntryType] = useState<string>("");
  const [status, setStatus] = useState<string>("");
  const [refundingRow, setRefundingRow] = useState<LedgerRow | null>(null);

  const refundM = useMutation({
    mutationFn: (amount: number) =>
      refundFn({ data: { charge_id: refundingRow!.id, amount_cents: amount } }),
    onSuccess: () => {
      toast.success("Refund recorded");
      setRefundingRow(null);
      qc.invalidateQueries({ queryKey: ["admin", "ledger"] });
    },
    onError: (e: any) => toast.error(e.message ?? "Failed"),
  });

  const q = useQuery({
    queryKey: ["admin", "ledger", entryType, status],
    queryFn: () =>
      listFn({
        data: {
          entry_type: (entryType || null) as any,
          status: (status || null) as any,
          limit: 300,
        },
      }),
  });

  const downloadCsv = () => {
    const rows = q.data ?? [];
    const blob = new Blob([toCsv(rows)], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ledger-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Console</p>
          <h1 className="font-serif text-2xl lg:text-3xl">Finance</h1>
        </div>
        <button
          onClick={downloadCsv}
          disabled={!q.data?.length}
          className="inline-flex items-center gap-2 rounded-lg border border-input bg-card px-3 py-2 text-sm font-medium hover:bg-secondary disabled:opacity-50"
        >
          <Download className="size-4" /> Export CSV
        </button>
      </header>

      <section className="rounded-2xl border border-border bg-card">
        <div className="flex flex-wrap items-center gap-2 border-b border-border p-3">
          <select
            value={entryType}
            onChange={(e) => setEntryType(e.target.value)}
            className="rounded-lg border border-input bg-background px-2 py-1.5 text-sm"
          >
            <option value="">All entries</option>
            <option value="charge">Charges</option>
            <option value="platform_fee">Platform fees</option>
            <option value="provider_payout">Provider payouts</option>
            <option value="refund">Refunds</option>
            <option value="adjustment">Adjustments</option>
          </select>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="rounded-lg border border-input bg-background px-2 py-1.5 text-sm"
          >
            <option value="">All statuses</option>
            <option value="pending">Pending</option>
            <option value="posted">Posted</option>
            <option value="reversed">Reversed</option>
          </select>
          <span className="text-xs text-muted-foreground">{q.data?.length ?? 0} rows</span>
        </div>

        {q.isPending ? (
          <div className="p-4">
            <PageSkeleton title="ledger" cards={4} />
          </div>
        ) : q.isError ? (
          <ErrorState error={q.error} onRetry={() => q.refetch()} />
        ) : (q.data ?? []).length === 0 ? (
          <div className="p-6">
            <EmptyState
              icon={<DollarSign className="size-6" />}
              title="No entries"
              description="Nothing matches these filters."
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 text-left font-medium">Type</th>
                  <th className="px-3 py-2 text-left font-medium">Amount</th>
                  <th className="px-3 py-2 text-left font-medium">Senior</th>
                  <th className="px-3 py-2 text-left font-medium">Provider</th>
                  <th className="px-3 py-2 text-left font-medium">Status</th>
                  <th className="px-3 py-2 text-left font-medium">Memo</th>
                  <th className="px-3 py-2 text-left font-medium">Posted</th>
                  <th className="px-3 py-2 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {(q.data ?? []).map((r) => (
                  <LedgerRowView key={r.id} row={r} onRefundClick={() => setRefundingRow(r)} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {refundingRow && (
        <RefundDialog
          maxCents={refundingRow.amount_cents}
          currency={refundingRow.currency}
          busy={refundM.isPending}
          onCancel={() => setRefundingRow(null)}
          onConfirm={(cents) => refundM.mutate(cents)}
        />
      )}
    </div>
  );
}

function LedgerRowView({ row, onRefundClick }: { row: LedgerRow; onRefundClick: () => void }) {
  const qc = useQueryClient();
  const payFn = useServerFn(markPayoutPaid);
  const invalidate = () => qc.invalidateQueries({ queryKey: ["admin", "ledger"] });

  const payM = useMutation({
    mutationFn: () => payFn({ data: { id: row.id } }),
    onSuccess: () => {
      toast.success("Payout marked paid");
      invalidate();
    },
    onError: (e: any) => toast.error(e.message ?? "Failed"),
  });

  return (
    <tr className="border-t border-border">
      <td className="px-3 py-2">
        <span
          className={`rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase ${entryTone[row.entry_type]}`}
        >
          {row.entry_type.replace("_", " ")}
        </span>
      </td>
      <td className="px-3 py-2 font-mono">{money(row.amount_cents, row.currency)}</td>
      <td className="px-3 py-2 text-muted-foreground">{row.senior_name ?? "—"}</td>
      <td className="px-3 py-2 text-muted-foreground">{row.provider_name ?? "—"}</td>
      <td className="px-3 py-2 text-xs uppercase">{row.status}</td>
      <td className="px-3 py-2 text-xs text-muted-foreground">{row.memo ?? "—"}</td>
      <td className="px-3 py-2 text-muted-foreground">{fmt(row.posted_at)}</td>
      <td className="px-3 py-2 text-right">
        {row.entry_type === "provider_payout" && row.status === "pending" && (
          <button
            onClick={() => payM.mutate()}
            className="rounded border border-input bg-card px-2 py-1 text-xs hover:bg-secondary"
          >
            Mark paid
          </button>
        )}
        {row.entry_type === "charge" && row.status === "posted" && (
          <button
            onClick={onRefundClick}
            className="rounded border border-input bg-card px-2 py-1 text-xs hover:bg-secondary"
          >
            Refund
          </button>
        )}
      </td>
    </tr>
  );
}

function RefundDialog({
  maxCents,
  currency,
  busy,
  onCancel,
  onConfirm,
}: {
  maxCents: number;
  currency: string;
  busy: boolean;
  onCancel: () => void;
  onConfirm: (cents: number) => void;
}) {
  const [dollars, setDollars] = useState((maxCents / 100).toFixed(2));
  const cents = Math.round(Number(dollars) * 100);
  const valid = Number.isFinite(cents) && cents > 0 && cents <= maxCents;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-5 shadow-lg">
        <h2 className="font-serif text-xl">Issue refund</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Up to {money(maxCents, currency)} for this charge.
        </p>
        <label className="mt-4 block text-sm">
          Amount
          <div className="mt-1 flex items-center gap-2">
            <span className="text-muted-foreground">$</span>
            <input
              type="number"
              min={0.01}
              max={maxCents / 100}
              step={0.01}
              value={dollars}
              onChange={(e) => setDollars(e.target.value)}
              className="w-32 rounded-xl border border-input bg-background p-2 text-sm"
            />
          </div>
        </label>
        {!valid && (
          <p className="mt-1 text-xs text-destructive">
            Enter an amount between $0.01 and {money(maxCents, currency)}.
          </p>
        )}
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-full border border-input px-4 py-2 text-sm font-semibold hover:bg-secondary"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!valid || busy}
            onClick={() => onConfirm(cents)}
            className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50"
          >
            {busy ? <Loader2 className="size-4 animate-spin" /> : null}
            Refund
          </button>
        </div>
      </div>
    </div>
  );
}
