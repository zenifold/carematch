import { createFileRoute, redirect } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Calendar, Loader2, Search } from "lucide-react";
import { toast } from "sonner";
import {
  listAdminBookings,
  listAdminProviders,
  adminReassignBooking,
  checkIsAdmin,
} from "@/lib/admin.functions";
import { PageSkeleton, EmptyState, ErrorState, RouteErrorBoundary } from "@/components/carematch";

export const Route = createFileRoute("/_authenticated/admin/bookings")({
  component: BookingsPage,
  errorComponent: RouteErrorBoundary,
  beforeLoad: async () => {
    const { isAdmin } = await checkIsAdmin();
    if (!isAdmin) throw redirect({ to: "/admin" });
  },
});

const STATUS_OPTIONS = [
  "all",
  "requested",
  "confirmed",
  "in_progress",
  "completed",
  "cancelled",
] as const;
type StatusOpt = (typeof STATUS_OPTIONS)[number];

const statusPill: Record<string, string> = {
  requested: "bg-amber-500/15 text-amber-700",
  confirmed: "bg-secondary text-foreground",
  in_progress: "bg-primary/10 text-primary",
  completed: "bg-emerald-500/15 text-emerald-700",
  cancelled: "bg-destructive/15 text-destructive",
};

function BookingsPage() {
  const fn = useServerFn(listAdminBookings);
  const qc = useQueryClient();
  const [status, setStatus] = useState<StatusOpt>("all");
  const [search, setSearch] = useState("");
  const [reassigning, setReassigning] = useState<{ id: string; senior_name: string | null } | null>(
    null,
  );
  const q = useQuery({
    queryKey: ["admin", "bookings", status],
    queryFn: () => fn({ data: { status: status === "all" ? null : status } }),
  });

  const allRows = q.data ?? [];

  const rows = useMemo(() => {
    const s = search.trim().toLowerCase();
    if (!s) return allRows;
    return allRows.filter((r) =>
      [r.senior_name, r.provider_name, r.service_type, r.id, r.status].some((v) =>
        (v ?? "").toLowerCase().includes(s),
      ),
    );
  }, [allRows, search]);

  if (q.isPending) return <PageSkeleton title="bookings" cards={4} />;
  if (q.isError) return <ErrorState error={q.error} onRetry={() => q.refetch()} />;

  const counts = allRows.reduce<Record<string, number>>((acc, r) => {
    acc[r.status] = (acc[r.status] ?? 0) + 1;
    return acc;
  }, {});
  const unmatched = rows.filter((r) => r.status === "requested");
  const grossCents = rows.reduce(
    (s, r) => s + Math.round((r.hourly_rate_cents * r.duration_minutes) / 60),
    0,
  );

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-widest text-muted-foreground">
            Visit operations
          </p>
          <h1 className="font-serif text-2xl lg:text-3xl">Bookings</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {rows.length} in view · {unmatched.length} awaiting a match · $
            {(grossCents / 100).toFixed(0)} gross
          </p>
        </div>
        <button
          onClick={() => {
            const header = [
              "id",
              "senior",
              "provider",
              "scheduled_at",
              "service",
              "status",
              "duration_min",
              "total_cents",
            ];
            const csv = [header.join(",")]
              .concat(
                rows.map((r) =>
                  [
                    r.id,
                    JSON.stringify(r.senior_name ?? ""),
                    JSON.stringify(r.provider_name ?? ""),
                    r.scheduled_at,
                    r.service_type,
                    r.status,
                    String(r.duration_minutes),
                    String(Math.round((r.hourly_rate_cents * r.duration_minutes) / 60)),
                  ].join(","),
                ),
              )
              .join("\n");
            const blob = new Blob([csv], { type: "text/csv" });
            const a = document.createElement("a");
            a.href = URL.createObjectURL(blob);
            a.download = `bookings-${new Date().toISOString().slice(0, 10)}.csv`;
            a.click();
          }}
          className="rounded-lg border border-input bg-background px-3 py-1.5 text-xs font-semibold hover:bg-secondary"
        >
          Export CSV
        </button>
      </header>

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by senior, provider, service, or ID"
          className="w-full rounded-xl border border-input bg-card py-2 pl-9 pr-3 text-sm"
        />
      </div>

      <div className="flex flex-wrap gap-2 text-xs">
        {STATUS_OPTIONS.map((s) => (
          <button
            key={s}
            onClick={() => setStatus(s)}
            className={`rounded-full border px-3 py-1 capitalize ${
              status === s
                ? "border-primary bg-primary/10 text-primary"
                : "border-border bg-card text-muted-foreground"
            }`}
          >
            {s === "all" ? "All" : s.replace(/_/g, " ")}
            {s !== "all" && counts[s] !== undefined ? ` (${counts[s]})` : ""}
          </button>
        ))}
      </div>

      {rows.length === 0 ? (
        <EmptyState
          icon={<Calendar className="size-6" />}
          title="No bookings"
          description={
            status === "all"
              ? "Nothing has been booked yet."
              : `No bookings with status "${status.replace(/_/g, " ")}".`
          }
        />
      ) : (
        <section className="rounded-2xl border border-border bg-card">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 text-left font-medium">Booking</th>
                  <th className="px-3 py-2 text-left font-medium">Senior</th>
                  <th className="px-3 py-2 text-left font-medium">Provider</th>
                  <th className="px-3 py-2 text-left font-medium">When</th>
                  <th className="px-3 py-2 text-left font-medium">Service</th>
                  <th className="px-3 py-2 text-right font-medium">Total</th>
                  <th className="px-3 py-2 text-left font-medium">Status</th>
                  <th className="px-3 py-2 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((b) => {
                  const total = Math.round((b.hourly_rate_cents * b.duration_minutes) / 60);
                  const canReassign = b.status === "requested" || b.status === "confirmed";
                  return (
                    <tr key={b.id} className="border-t border-border hover:bg-secondary/40">
                      <td className="px-3 py-2 font-mono text-xs">{b.id.slice(0, 8)}…</td>
                      <td className="px-3 py-2 font-medium">{b.senior_name ?? "Senior"}</td>
                      <td className="px-3 py-2">{b.provider_name ?? "—"}</td>
                      <td className="px-3 py-2 text-muted-foreground">
                        {new Date(b.scheduled_at).toLocaleString(undefined, {
                          month: "short",
                          day: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                        })}{" "}
                        · {b.duration_minutes}m
                      </td>
                      <td className="px-3 py-2">{b.service_type}</td>
                      <td className="px-3 py-2 text-right tabular-nums">
                        ${(total / 100).toFixed(0)}
                      </td>
                      <td className="px-3 py-2">
                        <span
                          className={`rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize ${
                            statusPill[b.status] ?? "bg-secondary"
                          }`}
                        >
                          {b.status.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-right">
                        {canReassign && (
                          <button
                            type="button"
                            onClick={() => setReassigning({ id: b.id, senior_name: b.senior_name })}
                            className="rounded-full border border-border px-2.5 py-1 text-[11px] font-semibold hover:bg-secondary"
                          >
                            Reassign
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {reassigning && (
        <ReassignDialog
          bookingId={reassigning.id}
          seniorName={reassigning.senior_name}
          onClose={() => setReassigning(null)}
          onDone={() => {
            setReassigning(null);
            qc.invalidateQueries({ queryKey: ["admin", "bookings"] });
          }}
        />
      )}
    </div>
  );
}

function ReassignDialog({
  bookingId,
  seniorName,
  onClose,
  onDone,
}: {
  bookingId: string;
  seniorName: string | null;
  onClose: () => void;
  onDone: () => void;
}) {
  const listProviders = useServerFn(listAdminProviders);
  const reassignFn = useServerFn(adminReassignBooking);
  const providersQ = useQuery({ queryKey: ["admin", "providers"], queryFn: () => listProviders() });
  const [providerId, setProviderId] = useState("");

  const reassign = useMutation({
    mutationFn: () => reassignFn({ data: { booking_id: bookingId, provider_id: providerId } }),
    onSuccess: () => {
      toast.success("Booking reassigned");
      onDone();
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Couldn't reassign"),
  });

  const activeProviders = (providersQ.data ?? []).filter((p) => p.is_active);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-5 shadow-lg">
        <h2 className="font-serif text-xl">Reassign booking</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Pick a new caregiver for {seniorName ?? "this senior"}'s visit. The booking resets to
          "requested" so they get a fresh chance to accept.
        </p>
        <select
          value={providerId}
          onChange={(e) => setProviderId(e.target.value)}
          className="mt-4 w-full rounded-xl border border-input bg-background p-2.5 text-sm"
        >
          <option value="">Select a caregiver…</option>
          {activeProviders.map((p) => (
            <option key={p.id} value={p.id}>
              {p.full_name ?? "Unnamed"} · {p.tier}
            </option>
          ))}
        </select>
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-input px-4 py-2 text-sm font-semibold hover:bg-secondary"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!providerId || reassign.isPending}
            onClick={() => reassign.mutate()}
            className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50"
          >
            {reassign.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
            Reassign
          </button>
        </div>
      </div>
    </div>
  );
}
