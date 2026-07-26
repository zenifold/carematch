import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Check, Inbox, X } from "lucide-react";
import { toast } from "sonner";
import {
  approveChangeRequest,
  declineChangeRequest,
  listMyIncomingRequests,
  type ChangeRequestKind,
  type ChangeRequestPayload,
} from "@/lib/change-requests.functions";

function describe(kind: ChangeRequestKind, payload: ChangeRequestPayload): string {
  switch (kind) {
    case "budget":
      return `Change monthly budget to $${((payload.monthly_budget_cents ?? 0) / 100).toLocaleString()}`;
    case "permission":
      return `Change their permission level to "${payload.permission ?? "?"}"`;
    case "cancel_visit":
      return `Cancel a scheduled visit`;
    case "care_note":
      return `Add a care-plan note: "${(payload.note ?? "").slice(0, 120)}"`;
  }
}

export function IncomingRequestsPanel() {
  const queryClient = useQueryClient();
  const fetchIncoming = useServerFn(listMyIncomingRequests);
  const approveFn = useServerFn(approveChangeRequest);
  const declineFn = useServerFn(declineChangeRequest);

  const q = useQuery({
    queryKey: ["senior", "requests", "incoming"],
    queryFn: () => fetchIncoming(),
  });

  const [declineFor, setDeclineFor] = useState<string | null>(null);
  const [reason, setReason] = useState("");

  const approve = useMutation({
    mutationFn: (id: string) => approveFn({ data: { id } }),
    onSuccess: () => {
      toast.success("Approved. The change was applied.");
      queryClient.invalidateQueries({ queryKey: ["senior", "requests"] });
      queryClient.invalidateQueries();
    },
    onError: (e: unknown) => toast.error((e as Error).message ?? "Couldn't approve"),
  });
  const decline = useMutation({
    mutationFn: (v: { id: string; reason?: string }) => declineFn({ data: v }),
    onSuccess: () => {
      toast.success("Declined. We let them know.");
      queryClient.invalidateQueries({ queryKey: ["senior", "requests"] });
      setDeclineFor(null);
      setReason("");
    },
  });

  const pending = (q.data ?? []).filter((r) => r.status === "pending");
  if (q.isPending) return null;
  if (pending.length === 0) return null;

  return (
    <section className="surface-card p-5 lg:p-6">
      <div className="flex items-center gap-2">
        <Inbox className="size-5 text-primary" />
        <h2 className="font-serif text-2xl">Requests from family</h2>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        Family members asked for these changes. You decide.
      </p>
      <ul className="mt-4 space-y-3">
        {pending.map((r) => (
          <li key={r.id} className="rounded-2xl border border-border bg-background p-4">
            <p className="text-sm font-semibold">
              {r.requester_name ?? "A family member"}
            </p>
            <p className="mt-1 text-base">{describe(r.kind, r.payload)}</p>
            {r.reason && (
              <p className="mt-2 rounded-lg bg-secondary/40 p-2 text-sm italic">
                "{r.reason}"
              </p>
            )}
            {declineFor === r.id ? (
              <div className="mt-3 space-y-2">
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  maxLength={500}
                  rows={2}
                  placeholder="Optional: tell them why"
                  className="w-full rounded-xl border border-input bg-background p-2 text-sm"
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => decline.mutate({ id: r.id, reason: reason.trim() || undefined })}
                    disabled={decline.isPending}
                    className="rounded-full bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700"
                  >
                    Confirm decline
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeclineFor(null)}
                    className="rounded-full border border-border px-4 py-2 text-sm"
                  >
                    Back
                  </button>
                </div>
              </div>
            ) : (
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => approve.mutate(r.id)}
                  disabled={approve.isPending}
                  className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-soft hover:bg-primary/90 disabled:opacity-50"
                >
                  <Check className="size-4" /> Approve
                </button>
                <button
                  type="button"
                  onClick={() => setDeclineFor(r.id)}
                  className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-semibold hover:bg-secondary"
                >
                  <X className="size-4" /> Decline
                </button>
              </div>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
