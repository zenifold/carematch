import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { ShieldAlert, ShieldCheck, Filter, MessageSquareWarning, Check, X } from "lucide-react";
import {
  PageSkeleton,
  EmptyState,
  ErrorState,
  RouteErrorBoundary,
} from "@/components/carematch";
import {
  listAllIncidents,
  updateIncident,
  type IncidentRow,
  type IncidentStatus,
} from "@/lib/incidents.functions";
import {
  listMessageFlags,
  resolveMessageFlag,
  type MessageFlagRow,
} from "@/lib/message-flags.functions";

export const Route = createFileRoute("/_authenticated/admin/trust-safety")({
  component: TrustSafetyPage,
  errorComponent: RouteErrorBoundary,
});

const STATUS_LABELS: Record<IncidentStatus, string> = {
  open: "Open",
  triaged: "Triaged",
  resolved: "Resolved",
  dismissed: "Dismissed",
};

const CATEGORY_LABELS: Record<IncidentRow["category"], string> = {
  no_show: "No-show",
  safety: "Safety",
  abuse: "Abuse",
  theft: "Theft",
  quality: "Quality",
  billing: "Billing",
  other: "Other",
};

const SEVERITY = ["Info", "Low", "Elevated", "Urgent"];

function TrustSafetyPage() {
  const fetchAll = useServerFn(listAllIncidents);
  const update = useServerFn(updateIncident);
  const qc = useQueryClient();

  const q = useQuery({ queryKey: ["incidents", "all"], queryFn: () => fetchAll() });
  const [statusFilter, setStatusFilter] = useState<IncidentStatus | "all">("open");
  const [minSeverity, setMinSeverity] = useState<0 | 1 | 2 | 3 | 4>(0);
  const [openId, setOpenId] = useState<string | null>(null);

  const mut = useMutation({
    mutationFn: update,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["incidents", "all"] });
      toast.success("Incident updated");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Update failed"),
  });

  const rows = q.data ?? [];
  const filtered = useMemo(
    () =>
      rows.filter(
        (r) =>
          (statusFilter === "all" || r.status === statusFilter) &&
          r.severity >= minSeverity,
      ),
    [rows, statusFilter, minSeverity],
  );

  const counts = useMemo(() => {
    const c = { open: 0, triaged: 0, resolved: 0, dismissed: 0 } as Record<IncidentStatus, number>;
    for (const r of rows) c[r.status]++;
    return c;
  }, [rows]);

  if (q.isPending) return <PageSkeleton title="trust & safety" cards={4} />;
  if (q.isError) return <ErrorState error={q.error} onRetry={() => q.refetch()} />;

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-widest text-muted-foreground">24/7 escalation</p>
          <h1 className="font-serif text-2xl lg:text-3xl">Trust & Safety</h1>
        </div>
      </header>

      <div className="grid gap-3 sm:grid-cols-4">
        <Kpi label="Open" value={counts.open} accent="destructive" />
        <Kpi label="Triaged" value={counts.triaged} />
        <Kpi label="Resolved" value={counts.resolved} />
        <Kpi label="Dismissed" value={counts.dismissed} />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-muted-foreground">
          <Filter className="mr-1 inline size-3.5" />
          Filter
        </span>
        {(["open", "triaged", "resolved", "dismissed", "all"] as const).map((k) => (
          <button
            key={k}
            onClick={() => setStatusFilter(k)}
            className={`rounded-full border px-3 py-1 text-xs font-semibold ${
              statusFilter === k
                ? "border-primary bg-primary/10 text-primary"
                : "border-border bg-background hover:bg-secondary"
            }`}
          >
            {k === "all" ? "All" : STATUS_LABELS[k]}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-muted-foreground">Min severity</span>
        {([0, 1, 2, 3, 4] as const).map((s) => (
          <button
            key={s}
            onClick={() => setMinSeverity(s)}
            className={`rounded-full border px-3 py-1 text-xs font-semibold ${
              minSeverity === s
                ? "border-primary bg-primary/10 text-primary"
                : "border-border bg-background hover:bg-secondary"
            }`}
          >
            {s === 0 ? "Any" : `≥ ${SEVERITY[s - 1]}`}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<ShieldCheck className="size-6" />}
          title="Queue is clear"
          description="No incidents match this filter."
        />
      ) : (
        <ul className="space-y-2">
          {filtered.map((r) => (
            <li key={r.id} className="rounded-2xl border border-border bg-card">
              <button
                onClick={() => setOpenId(openId === r.id ? null : r.id)}
                className="flex w-full items-start gap-3 p-4 text-left hover:bg-secondary/30"
              >
                <span
                  className={`mt-1 grid size-9 shrink-0 place-items-center rounded-full ${
                    r.severity >= 4
                      ? "bg-destructive/15 text-destructive"
                      : r.severity === 3
                      ? "bg-amber-500/20 text-amber-700"
                      : "bg-secondary text-foreground"
                  }`}
                >
                  <ShieldAlert className="size-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold">{CATEGORY_LABELS[r.category]}</p>
                    <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-bold uppercase">
                      {STATUS_LABELS[r.status]}
                    </span>
                    <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-bold uppercase">
                      {SEVERITY[r.severity - 1]}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(r.created_at).toLocaleString(undefined, {
                        month: "short",
                        day: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{r.summary}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Reporter: {r.reporter_name ?? "Unknown"}
                    {r.subject_name ? ` · Subject: ${r.subject_name}` : ""}
                  </p>
                </div>
              </button>

              {openId === r.id && (
                <div className="space-y-3 border-t border-border p-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                      Full report
                    </p>
                    <p className="mt-1 whitespace-pre-wrap text-sm">{r.summary}</p>
                  </div>
                  {(r.booking_id || r.subject_user_id) && (
                    <div>
                      <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                        Linked evidence
                      </p>
                      <div className="mt-1 flex flex-wrap gap-2 text-xs">
                        {r.booking_id && (
                          <a
                            href={`/admin/bookings?highlight=${r.booking_id}`}
                            className="rounded-full border border-border bg-background px-3 py-1 font-semibold hover:bg-secondary"
                          >
                            Booking · {r.booking_id.slice(0, 8)}
                          </a>
                        )}
                        {r.subject_user_id && (
                          <a
                            href={`/admin/users?highlight=${r.subject_user_id}`}
                            className="rounded-full border border-border bg-background px-3 py-1 font-semibold hover:bg-secondary"
                          >
                            Subject · {(r.subject_name ?? r.subject_user_id.slice(0, 8))}
                          </a>
                        )}
                        <span className="rounded-full bg-secondary px-3 py-1 text-muted-foreground">
                          Filed {new Date(r.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                        </span>
                      </div>
                    </div>
                  )}
                  {r.resolution_notes && (
                    <div>
                      <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                        Resolution notes
                      </p>
                      <p className="mt-1 whitespace-pre-wrap text-sm">{r.resolution_notes}</p>
                    </div>
                  )}
                  <ResolveForm
                    row={r}
                    disabled={mut.isPending}
                    onSubmit={(patch) => mut.mutate({ data: { id: r.id, ...patch } })}
                  />
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      <MessageFlagsSection />
    </div>
  );
}

const REASON_LABELS: Record<MessageFlagRow["reason"], string> = {
  phone_number: "Phone number",
  email_address: "Email address",
  offplatform_phrase: "Off-platform phrase",
};

function MessageFlagsSection() {
  const fetchFlags = useServerFn(listMessageFlags);
  const resolve = useServerFn(resolveMessageFlag);
  const qc = useQueryClient();

  const q = useQuery({
    queryKey: ["admin", "message-flags"],
    queryFn: () => fetchFlags({ data: { status: "unreviewed" } }),
  });

  const mut = useMutation({
    mutationFn: resolve,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "message-flags"] });
      toast.success("Flag reviewed");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Update failed"),
  });

  const rows = q.data ?? [];

  return (
    <section className="space-y-3 border-t border-border pt-6">
      <header>
        <p className="text-xs uppercase tracking-widest text-muted-foreground">
          Automated · marketplace retention
        </p>
        <h2 className="font-serif text-xl">Off-platform message flags</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Messages auto-flagged for a phone number, email address, or phrase
          suggesting a move off the platform (e.g. "venmo me," "text me
          directly"). Not blocked — just surfaced for review.
        </p>
      </header>

      {q.isPending ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : q.isError ? (
        <ErrorState error={q.error} onRetry={() => q.refetch()} />
      ) : rows.length === 0 ? (
        <EmptyState
          icon={<ShieldCheck className="size-6" />}
          title="Nothing to review"
          description="No unreviewed off-platform flags right now."
        />
      ) : (
        <ul className="space-y-2">
          {rows.map((r) => (
            <li
              key={r.id}
              className="flex items-start gap-3 rounded-2xl border border-border bg-card p-4"
            >
              <span className="mt-1 grid size-9 shrink-0 place-items-center rounded-full bg-amber-500/15 text-amber-700">
                <MessageSquareWarning className="size-4" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold">{r.sender_name ?? "Unknown sender"}</p>
                  <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-bold uppercase">
                    {REASON_LABELS[r.reason]}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(r.created_at).toLocaleString(undefined, {
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <p className="mt-1 whitespace-pre-wrap rounded-lg bg-secondary/40 p-2 text-sm">
                  {r.matched_text}
                </p>
              </div>
              <div className="flex shrink-0 gap-1.5">
                <button
                  type="button"
                  disabled={mut.isPending}
                  onClick={() => mut.mutate({ data: { id: r.id, dismissed: true } })}
                  className="inline-flex items-center gap-1 rounded-lg border border-input bg-background px-2.5 py-1.5 text-xs font-semibold hover:bg-secondary disabled:opacity-50"
                  title="Dismiss — false positive"
                >
                  <X className="size-3.5" /> Dismiss
                </button>
                <button
                  type="button"
                  disabled={mut.isPending}
                  onClick={() => mut.mutate({ data: { id: r.id, dismissed: false } })}
                  className="inline-flex items-center gap-1 rounded-lg bg-primary px-2.5 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                  title="Mark handled"
                >
                  <Check className="size-3.5" /> Handled
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function Kpi({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent?: "destructive";
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <p className="text-xs uppercase tracking-widest text-muted-foreground">{label}</p>
      <p
        className={`mt-1 font-serif text-2xl ${
          accent === "destructive" && value > 0 ? "text-destructive" : ""
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function ResolveForm({
  row,
  disabled,
  onSubmit,
}: {
  row: IncidentRow;
  disabled: boolean;
  onSubmit: (patch: {
    status?: IncidentStatus;
    severity?: number;
    resolution_notes?: string | null;
  }) => void;
}) {
  const [status, setStatus] = useState<IncidentStatus>(row.status);
  const [severity, setSeverity] = useState(row.severity);
  const [notes, setNotes] = useState(row.resolution_notes ?? "");

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit({
          status,
          severity,
          resolution_notes: notes.trim() ? notes.trim() : null,
        });
      }}
      className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]"
    >
      <label className="text-xs">
        <span className="text-muted-foreground">Status</span>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as IncidentStatus)}
          className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
        >
          {(Object.keys(STATUS_LABELS) as IncidentStatus[]).map((s) => (
            <option key={s} value={s}>
              {STATUS_LABELS[s]}
            </option>
          ))}
        </select>
      </label>
      <label className="text-xs">
        <span className="text-muted-foreground">Severity · {SEVERITY[severity - 1]}</span>
        <input
          type="range"
          min={1}
          max={4}
          value={severity}
          onChange={(e) => setSeverity(Number(e.target.value))}
          className="mt-2 w-full"
        />
      </label>
      <label className="text-xs sm:col-span-3">
        <span className="text-muted-foreground">Resolution notes</span>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
          placeholder="What action was taken? Any follow-ups?"
        />
      </label>
      <div className="sm:col-span-3">
        <button
          type="submit"
          disabled={disabled}
          className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          Save changes
        </button>
      </div>
    </form>
  );
}
