import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Clock, X } from "lucide-react";
import { toast } from "sonner";
import {
  cancelChangeRequest,
  listMyOutgoingRequests,
  type ChangeRequestKind,
  type ChangeRequestPayload,
  type ChangeRequestStatus,
} from "@/lib/change-requests.functions";

function describe(kind: ChangeRequestKind, payload: ChangeRequestPayload) {
  switch (kind) {
    case "budget":
      return `Monthly budget → $${((payload.monthly_budget_cents ?? 0) / 100).toLocaleString()}`;
    case "permission":
      return `Permission → ${payload.permission ?? "?"}`;
    case "cancel_visit":
      return `Cancel a visit`;
    case "care_note":
      return `Care-plan note: "${(payload.note ?? "").slice(0, 60)}${(payload.note ?? "").length > 60 ? "…" : ""}"`;
  }
}

function statusStyle(s: ChangeRequestStatus) {
  switch (s) {
    case "pending":
      return "bg-amber-100 text-amber-900 dark:bg-amber-500/20 dark:text-amber-100";
    case "approved":
      return "bg-emerald-100 text-emerald-900 dark:bg-emerald-500/20 dark:text-emerald-100";
    case "declined":
      return "bg-rose-100 text-rose-900 dark:bg-rose-500/20 dark:text-rose-100";
    default:
      return "bg-secondary text-muted-foreground";
  }
}

export function OutgoingRequestsList({
  seniorId,
  filterKind,
}: {
  seniorId: string;
  filterKind?: ChangeRequestKind;
}) {
  const queryClient = useQueryClient();
  const fetchOutgoing = useServerFn(listMyOutgoingRequests);
  const cancelFn = useServerFn(cancelChangeRequest);

  const q = useQuery({
    queryKey: ["family", "requests", "outgoing", seniorId],
    queryFn: () => fetchOutgoing({ data: { senior_id: seniorId } }),
    enabled: !!seniorId,
  });

  const mut = useMutation({
    mutationFn: (id: string) => cancelFn({ data: { id } }),
    onSuccess: () => {
      toast.success("Request cancelled");
      queryClient.invalidateQueries({ queryKey: ["family", "requests"] });
    },
  });

  const rows = (q.data ?? []).filter((r) => (filterKind ? r.kind === filterKind : true));
  if (rows.length === 0) return null;

  return (
    <section className="rounded-2xl border border-border bg-card p-4">
      <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
        <Clock className="size-4 text-primary" /> Your requests
      </div>
      <ul className="divide-y divide-border">
        {rows.slice(0, 6).map((r) => (
          <li key={r.id} className="flex items-start gap-3 py-2">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">{describe(r.kind, r.payload)}</p>
              <p className="truncate text-xs text-muted-foreground">
                {new Date(r.created_at).toLocaleDateString()} · "{r.reason}"
                {r.decline_reason ? ` · declined: ${r.decline_reason}` : ""}
              </p>
            </div>
            <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${statusStyle(r.status)}`}>
              {r.status}
            </span>
            {r.status === "pending" && (
              <button
                type="button"
                onClick={() => mut.mutate(r.id)}
                className="shrink-0 rounded-full border border-border p-1.5 hover:bg-secondary"
                aria-label="Cancel request"
              >
                <X className="size-3.5" />
              </button>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
