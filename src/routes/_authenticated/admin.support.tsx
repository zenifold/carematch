import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Inbox, X, Send, Lock } from "lucide-react";
import { toast } from "sonner";
import {
  listSupportInbox,
  getTicket,
  postTicketMessage,
  updateTicket,
  assignTicketToMe,
  type SupportTicketRow,
} from "@/lib/support.functions";
import { PageSkeleton, EmptyState, ErrorState, RouteErrorBoundary } from "@/components/carematch";

export const Route = createFileRoute("/_authenticated/admin/support")({
  component: SupportPage,
  errorComponent: RouteErrorBoundary,
});

const priorityTone: Record<string, string> = {
  urgent: "bg-destructive/10 text-destructive",
  high: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  normal: "bg-secondary text-foreground",
  low: "bg-muted text-muted-foreground",
};
const statusTone: Record<string, string> = {
  open: "bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-300",
  pending: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  resolved: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
  closed: "bg-muted text-muted-foreground",
};

function fmt(iso: string) {
  return new Date(iso).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

function SupportPage() {
  const listFn = useServerFn(listSupportInbox);
  const [status, setStatus] = useState<"all" | "open" | "pending" | "resolved" | "closed">("open");
  const [assignee, setAssignee] = useState<"all" | "me" | "unassigned">("all");
  const [selected, setSelected] = useState<string | null>(null);

  const q = useQuery({
    queryKey: ["admin", "support", status, assignee],
    queryFn: () => listFn({ data: { status, assignee, limit: 150 } }),
  });

  return (
    <div className="space-y-5">
      <header>
        <p className="text-xs uppercase tracking-widest text-muted-foreground">Console</p>
        <h1 className="font-serif text-2xl lg:text-3xl">Support inbox</h1>
      </header>

      <section className="rounded-2xl border border-border bg-card">
        <div className="flex flex-wrap items-center gap-2 border-b border-border p-3">
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as typeof status)}
            className="rounded-lg border border-input bg-background px-2 py-1.5 text-sm"
          >
            <option value="all">All statuses</option>
            <option value="open">Open</option>
            <option value="pending">Pending</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>
          <select
            value={assignee}
            onChange={(e) => setAssignee(e.target.value as typeof assignee)}
            className="rounded-lg border border-input bg-background px-2 py-1.5 text-sm"
          >
            <option value="all">Anyone</option>
            <option value="me">Assigned to me</option>
            <option value="unassigned">Unassigned</option>
          </select>
          <span className="text-xs text-muted-foreground">{q.data?.length ?? 0} tickets</span>
        </div>

        {q.isPending ? (
          <div className="p-4"><PageSkeleton title="tickets" cards={4} /></div>
        ) : q.isError ? (
          <ErrorState error={q.error} onRetry={() => q.refetch()} />
        ) : (q.data ?? []).length === 0 ? (
          <div className="p-6">
            <EmptyState icon={<Inbox className="size-6" />} title="Inbox zero" description="No tickets match these filters." />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 text-left font-medium">Subject</th>
                  <th className="px-3 py-2 text-left font-medium">Requester</th>
                  <th className="px-3 py-2 text-left font-medium">Portal</th>
                  <th className="px-3 py-2 text-left font-medium">Priority</th>
                  <th className="px-3 py-2 text-left font-medium">Status</th>
                  <th className="px-3 py-2 text-left font-medium">Assignee</th>
                  <th className="px-3 py-2 text-left font-medium">Last activity</th>
                </tr>
              </thead>
              <tbody>
                {(q.data ?? []).map((t: SupportTicketRow) => (
                  <tr key={t.id} onClick={() => setSelected(t.id)}
                    className="cursor-pointer border-t border-border hover:bg-secondary/40">
                    <td className="px-3 py-2 font-medium">{t.subject}</td>
                    <td className="px-3 py-2 text-muted-foreground">{t.requester_name ?? t.requester_email ?? "—"}</td>
                    <td className="px-3 py-2 text-muted-foreground text-xs uppercase">{t.portal}</td>
                    <td className="px-3 py-2">
                      <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase ${priorityTone[t.priority]}`}>{t.priority}</span>
                    </td>
                    <td className="px-3 py-2">
                      <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase ${statusTone[t.status]}`}>{t.status}</span>
                    </td>
                    <td className="px-3 py-2 text-muted-foreground">{t.assignee_name ?? "—"}</td>
                    <td className="px-3 py-2 text-muted-foreground">{fmt(t.last_activity_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {selected && <TicketDrawer ticketId={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}

function TicketDrawer({ ticketId, onClose }: { ticketId: string; onClose: () => void }) {
  const qc = useQueryClient();
  const getFn = useServerFn(getTicket);
  const postFn = useServerFn(postTicketMessage);
  const updFn = useServerFn(updateTicket);
  const assignFn = useServerFn(assignTicketToMe);

  const q = useQuery({
    queryKey: ["admin", "support", "ticket", ticketId],
    queryFn: () => getFn({ data: { ticket_id: ticketId } }),
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["admin", "support"] });
  };

  const [reply, setReply] = useState("");
  const [internal, setInternal] = useState(false);

  const postM = useMutation({
    mutationFn: () => postFn({ data: { ticket_id: ticketId, body: reply.trim(), internal } }),
    onSuccess: () => {
      setReply("");
      invalidate();
    },
    onError: (e: any) => toast.error(e.message ?? "Failed"),
  });

  type UpdatePatch = {
    ticket_id: string;
    status?: "open" | "pending" | "resolved" | "closed";
    priority?: "low" | "normal" | "high" | "urgent";
    assignee_id?: string | null;
  };
  const updateM = useMutation({
    mutationFn: (patch: UpdatePatch) => updFn({ data: patch }),
    onSuccess: () => {
      toast.success("Updated");
      invalidate();
    },
    onError: (e: any) => toast.error(e.message ?? "Failed"),
  });


  const assignM = useMutation({
    mutationFn: () => assignFn({ data: { ticket_id: ticketId } }),
    onSuccess: () => {
      toast.success("Assigned to you");
      invalidate();
    },
    onError: (e: any) => toast.error(e.message ?? "Failed"),
  });

  const t = q.data?.ticket;
  const msgs = q.data?.messages ?? [];

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40" onClick={onClose}>
      <aside onClick={(e) => e.stopPropagation()} className="flex h-full w-full max-w-2xl flex-col bg-background shadow-2xl">
        <header className="sticky top-0 flex items-start justify-between gap-3 border-b border-border bg-background/95 p-4 backdrop-blur">
          <div className="min-w-0 flex-1">
            {t ? (
              <>
                <h2 className="truncate font-serif text-lg">{t.subject}</h2>
                <p className="text-xs text-muted-foreground">
                  {t.requester_name ?? "—"} · {t.portal} · opened {fmt(t.created_at)}
                </p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Loading…</p>
            )}
          </div>
          <button onClick={onClose} className="grid size-8 place-items-center rounded-lg hover:bg-secondary">
            <X className="size-4" />
          </button>
        </header>

        {t && (
          <div className="flex flex-wrap items-center gap-2 border-b border-border p-3">
            <select
              value={t.status}
              onChange={(e) => updateM.mutate({ ticket_id: ticketId, status: e.target.value as any })}
              className="rounded-lg border border-input bg-background px-2 py-1 text-xs"
            >
              {["open", "pending", "resolved", "closed"].map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <select
              value={t.priority}
              onChange={(e) => updateM.mutate({ ticket_id: ticketId, priority: e.target.value as any })}
              className="rounded-lg border border-input bg-background px-2 py-1 text-xs"
            >
              {["low", "normal", "high", "urgent"].map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
            <button
              onClick={() => assignM.mutate()}
              className="rounded-lg border border-input bg-card px-2 py-1 text-xs hover:bg-secondary"
            >
              {t.assignee_name ? `Assignee: ${t.assignee_name}` : "Assign to me"}
            </button>
          </div>
        )}

        <div className="flex-1 space-y-3 overflow-y-auto p-4">
          {msgs.map((m) => (
            <div key={m.id} className={`rounded-2xl border p-3 text-sm ${m.internal ? "border-amber-200 bg-amber-50 dark:border-amber-900/40 dark:bg-amber-950/20" : "border-border bg-card"}`}>
              <div className="mb-1 flex items-center gap-2 text-xs text-muted-foreground">
                <span className="font-medium text-foreground">{m.author_name ?? "—"}</span>
                {m.internal && (
                  <span className="inline-flex items-center gap-1 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-amber-800 dark:bg-amber-900/40 dark:text-amber-200">
                    <Lock className="size-3" /> internal
                  </span>
                )}
                <span>· {fmt(m.created_at)}</span>
              </div>
              <p className="whitespace-pre-wrap">{m.body}</p>
            </div>
          ))}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (reply.trim()) postM.mutate();
          }}
          className="border-t border-border bg-card p-3"
        >
          <textarea
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            rows={3}
            placeholder={internal ? "Internal note — only staff will see this" : "Reply to requester"}
            className="w-full resize-none rounded-lg border border-input bg-background p-2 text-sm outline-none focus:border-primary"
          />
          <div className="mt-2 flex items-center justify-between gap-2">
            <label className="flex items-center gap-2 text-xs text-muted-foreground">
              <input type="checkbox" checked={internal} onChange={(e) => setInternal(e.target.checked)} />
              Internal note
            </label>
            <button
              type="submit"
              disabled={postM.isPending || !reply.trim()}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              <Send className="size-3" /> Send
            </button>
          </div>
        </form>
      </aside>
    </div>
  );
}
