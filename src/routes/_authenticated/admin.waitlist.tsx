import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ClipboardList, Mail, MapPin, Check, Undo2, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { PageSkeleton, EmptyState, ErrorState, RouteErrorBoundary } from "@/components/carematch";
import {
  listWaitlistSignups,
  getWaitlistCounts,
  markWaitlistContacted,
  WAITLIST_SEGMENTS,
  type WaitlistRow,
  type WaitlistSegment,
} from "@/lib/waitlist.functions";

/**
 * Working list for pre-launch signups from /coming-soon.
 *
 * Defaults to uncontacted-only, because the job here is "who haven't we replied
 * to yet" rather than browsing history. `contacted_at` is the only mutable
 * field — this is a queue, not a CRM, and anything richer belongs in whatever
 * tool actually owns outreach later.
 */

export const Route = createFileRoute("/_authenticated/admin/waitlist")({
  component: AdminWaitlist,
  errorComponent: RouteErrorBoundary,
});

const SEGMENT_LABELS: Record<WaitlistSegment, string> = {
  senior: "Older adult",
  family: "Family",
  caregiver: "Caregiver",
  partner: "Organization",
};

const SEGMENT_TONE: Record<WaitlistSegment, string> = {
  senior: "bg-primary/10 text-primary",
  family: "bg-accent/15 text-accent",
  caregiver: "bg-sage-100 text-sage-700",
  partner: "bg-secondary text-secondary-foreground",
};

type StatusFilter = "new" | "contacted" | "all";

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/** Renders the segment-specific jsonb without hardcoding each segment's shape. */
function DetailList({ details }: { details: WaitlistRow["details"] }) {
  const entries = Object.entries(details).filter(
    ([, v]) => v !== null && v !== "" && !(Array.isArray(v) && v.length === 0),
  );
  if (entries.length === 0) {
    return <p className="text-sm text-muted-foreground">No extra detail given.</p>;
  }
  return (
    <dl className="grid gap-x-6 gap-y-1.5 sm:grid-cols-[10rem_minmax(0,1fr)]">
      {entries.map(([key, value]) => (
        <div key={key} className="sm:col-span-2 sm:grid sm:grid-cols-subgrid">
          <dt className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {key.replace(/_/g, " ")}
          </dt>
          <dd className="text-sm">{Array.isArray(value) ? value.join(", ") : String(value)}</dd>
        </div>
      ))}
    </dl>
  );
}

function SignupCard({
  row,
  onToggle,
  busy,
}: {
  row: WaitlistRow;
  onToggle: () => void;
  busy: boolean;
}) {
  const contacted = Boolean(row.contacted_at);
  const location = [row.city, row.state].filter(Boolean).join(", ");

  return (
    <li className="surface-card p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider ${SEGMENT_TONE[row.segment]}`}
            >
              {SEGMENT_LABELS[row.segment]}
            </span>
            {contacted && (
              <span className="inline-flex items-center gap-1 rounded-full bg-success/15 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-success">
                <Check className="size-3" aria-hidden /> Contacted
              </span>
            )}
            <span className="text-xs text-muted-foreground">{fmtDate(row.created_at)}</span>
          </div>

          <p className="mt-2 font-serif text-xl">{row.name}</p>

          <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
            <a
              href={`mailto:${row.email}`}
              className="inline-flex items-center gap-1.5 text-primary hover:underline"
            >
              <Mail className="size-3.5" aria-hidden /> {row.email}
            </a>
            {row.phone && <span className="text-muted-foreground">{row.phone}</span>}
            {location && (
              <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                <MapPin className="size-3.5" aria-hidden /> {location}
              </span>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={onToggle}
          disabled={busy}
          className={`inline-flex min-h-10 shrink-0 items-center gap-2 rounded-full px-4 text-sm font-semibold disabled:opacity-60 ${
            contacted
              ? "border border-input bg-card hover:bg-secondary"
              : "bg-primary text-primary-foreground hover:bg-primary/90"
          }`}
        >
          {busy ? (
            <Loader2 className="size-4 animate-spin" aria-hidden />
          ) : contacted ? (
            <Undo2 className="size-4" aria-hidden />
          ) : (
            <Check className="size-4" aria-hidden />
          )}
          {contacted ? "Mark as new" : "Mark contacted"}
        </button>
      </div>

      <div className="mt-4 border-t border-border pt-4">
        <DetailList details={row.details ?? {}} />
      </div>
    </li>
  );
}

function AdminWaitlist() {
  const qc = useQueryClient();
  const [segment, setSegment] = useState<"all" | WaitlistSegment>("all");
  const [status, setStatus] = useState<StatusFilter>("new");

  const listFn = useServerFn(listWaitlistSignups);
  const countsFn = useServerFn(getWaitlistCounts);
  const markFn = useServerFn(markWaitlistContacted);

  const list = useQuery({
    queryKey: ["waitlist", segment, status],
    queryFn: () => listFn({ data: { segment, status } }),
  });
  const counts = useQuery({ queryKey: ["waitlist-counts"], queryFn: () => countsFn() });

  const mark = useMutation({
    mutationFn: (vars: { id: string; contacted: boolean }) => markFn({ data: vars }),
    onSuccess: (_r, vars) => {
      toast.success(vars.contacted ? "Marked contacted" : "Moved back to new");
      qc.invalidateQueries({ queryKey: ["waitlist"] });
      qc.invalidateQueries({ queryKey: ["waitlist-counts"] });
    },
    onError: (e: unknown) =>
      toast.error(e instanceof Error ? e.message : "Could not update that signup"),
  });

  const rows = list.data ?? [];

  return (
    <div className="space-y-6">
      <header>
        <div className="flex items-center gap-2 text-primary">
          <ClipboardList className="size-5" />
          <p className="text-xs font-bold uppercase tracking-widest">Pre-launch</p>
        </div>
        <h1 className="mt-1 font-serif text-3xl lg:text-4xl">Waitlist</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Everyone who left their details on the coming-soon page.
          {counts.data ? (
            <>
              {" "}
              <span className="font-medium text-foreground">
                {counts.data.uncontacted} of {counts.data.total}
              </span>{" "}
              still waiting to hear back.
            </>
          ) : null}
        </p>
      </header>

      <div className="flex flex-wrap gap-2">
        {(["new", "contacted", "all"] as StatusFilter[]).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setStatus(s)}
            aria-pressed={status === s}
            className={`min-h-10 rounded-full px-4 text-sm font-semibold capitalize ${
              status === s
                ? "bg-foreground text-background"
                : "border border-input bg-card hover:bg-secondary"
            }`}
          >
            {s}
          </button>
        ))}
        <span aria-hidden className="mx-1 w-px self-stretch bg-border" />
        {(["all", ...WAITLIST_SEGMENTS] as const).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setSegment(s)}
            aria-pressed={segment === s}
            className={`min-h-10 rounded-full px-4 text-sm font-semibold ${
              segment === s
                ? "bg-primary text-primary-foreground"
                : "border border-input bg-card hover:bg-secondary"
            }`}
          >
            {s === "all" ? "All types" : SEGMENT_LABELS[s]}
            {s !== "all" && counts.data?.[s] ? (
              <span className="ml-1.5 tabular-nums opacity-70">{counts.data[s]}</span>
            ) : null}
          </button>
        ))}
      </div>

      {list.isPending ? (
        <PageSkeleton />
      ) : list.isError ? (
        <ErrorState
          title="Couldn't load the waitlist"
          description={list.error instanceof Error ? list.error.message : "Please try again."}
          onRetry={() => list.refetch()}
        />
      ) : rows.length === 0 ? (
        <EmptyState
          title={status === "new" ? "Nobody waiting" : "Nothing here"}
          description={
            status === "new"
              ? "Everyone who has signed up has been contacted. New signups will appear here."
              : "No signups match these filters yet."
          }
        />
      ) : (
        <ul className="space-y-4">
          {rows.map((row) => (
            <SignupCard
              key={row.id}
              row={row}
              busy={mark.isPending && mark.variables?.id === row.id}
              onToggle={() => mark.mutate({ id: row.id, contacted: !row.contacted_at })}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
