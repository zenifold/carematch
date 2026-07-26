import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { LifeBuoy, X, Send, Plus } from "lucide-react";
import { toast } from "sonner";
import {
  listMyTickets,
  createSupportTicket,
  getTicket,
  postTicketMessage,
} from "@/lib/support.functions";

type Portal = "senior" | "family" | "provider" | "other";

function fmt(iso: string) {
  return new Date(iso).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

const statusTone: Record<string, string> = {
  open: "bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-300",
  pending: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  resolved: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
  closed: "bg-muted text-muted-foreground",
};

export function SupportWidget({ portal }: { portal: Portal }) {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<"list" | "new" | string>("list");

  return (
    <>
      <button
        onClick={() => {
          setOpen(true);
          setView("list");
        }}
        aria-label="Get help"
        className="fixed bottom-20 right-4 z-40 inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-lg hover:bg-primary/90 lg:bottom-6"
      >
        <LifeBuoy className="size-4" /> Help
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-end bg-black/40 p-0 sm:items-center sm:p-4" onClick={() => setOpen(false)}>
          <div
            onClick={(e) => e.stopPropagation()}
            className="flex h-[85dvh] w-full flex-col rounded-t-2xl bg-background shadow-2xl sm:h-[600px] sm:max-w-md sm:rounded-2xl"
          >
            <header className="flex items-center justify-between border-b border-border p-4">
              <div>
                <h2 className="font-serif text-lg">Support</h2>
                <p className="text-xs text-muted-foreground">We usually reply within a few hours.</p>
              </div>
              <button onClick={() => setOpen(false)} className="grid size-8 place-items-center rounded-lg hover:bg-secondary">
                <X className="size-4" />
              </button>
            </header>

            <div className="min-h-0 flex-1 overflow-y-auto">
              {view === "list" ? (
                <TicketList portal={portal} onNew={() => setView("new")} onOpen={(id) => setView(id)} />
              ) : view === "new" ? (
                <NewTicketForm portal={portal} onDone={(id) => setView(id ?? "list")} onCancel={() => setView("list")} />
              ) : (
                <TicketThread ticketId={view} onBack={() => setView("list")} />
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function TicketList({ portal, onNew, onOpen }: { portal: Portal; onNew: () => void; onOpen: (id: string) => void }) {
  const fn = useServerFn(listMyTickets);
  const q = useQuery({ queryKey: ["my-tickets"], queryFn: () => fn() });

  return (
    <div className="space-y-3 p-4">
      <button
        onClick={onNew}
        className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
      >
        <Plus className="size-4" /> New request
      </button>
      {q.isPending ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : (q.data ?? []).length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No open requests yet. Tap <span className="font-medium text-foreground">New request</span> to get in touch.
        </p>
      ) : (
        <ul className="space-y-2">
          {(q.data ?? []).map((t) => (
            <li key={t.id}>
              <button
                onClick={() => onOpen(t.id)}
                className="w-full rounded-lg border border-border bg-card p-3 text-left hover:bg-secondary/40"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-sm font-medium">{t.subject}</p>
                  <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase ${statusTone[t.status]}`}>
                    {t.status}
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{fmt(t.last_activity_at)}</p>
              </button>
            </li>
          ))}
        </ul>
      )}
      <p className="pt-2 text-[11px] text-muted-foreground">Portal: {portal}</p>
    </div>
  );
}

function NewTicketForm({
  portal,
  onDone,
  onCancel,
}: {
  portal: Portal;
  onDone: (id?: string) => void;
  onCancel: () => void;
}) {
  const qc = useQueryClient();
  const create = useServerFn(createSupportTicket);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const m = useMutation({
    mutationFn: () => create({ data: { subject: subject.trim(), body: body.trim(), portal } }),
    onSuccess: (r) => {
      toast.success("Sent — we'll be in touch");
      qc.invalidateQueries({ queryKey: ["my-tickets"] });
      onDone(r.id);
    },
    onError: (e: any) => toast.error(e.message ?? "Failed"),
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (subject.trim().length >= 3 && body.trim().length >= 3) m.mutate();
      }}
      className="space-y-3 p-4"
    >
      <div>
        <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-muted-foreground">Subject</label>
        <input
          required
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-muted-foreground">How can we help?</label>
        <textarea
          required
          rows={6}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          className="w-full resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm"
        />
      </div>
      <div className="flex items-center justify-end gap-2">
        <button type="button" onClick={onCancel} className="rounded-lg border border-input bg-card px-3 py-2 text-sm hover:bg-secondary">
          Cancel
        </button>
        <button
          type="submit"
          disabled={m.isPending}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          <Send className="size-4" /> Send
        </button>
      </div>
    </form>
  );
}

function TicketThread({ ticketId, onBack }: { ticketId: string; onBack: () => void }) {
  const qc = useQueryClient();
  const getFn = useServerFn(getTicket);
  const postFn = useServerFn(postTicketMessage);
  const q = useQuery({ queryKey: ["my-ticket", ticketId], queryFn: () => getFn({ data: { ticket_id: ticketId } }) });
  const [reply, setReply] = useState("");

  const m = useMutation({
    mutationFn: () => postFn({ data: { ticket_id: ticketId, body: reply.trim(), internal: false } }),
    onSuccess: () => {
      setReply("");
      qc.invalidateQueries({ queryKey: ["my-ticket", ticketId] });
      qc.invalidateQueries({ queryKey: ["my-tickets"] });
    },
    onError: (e: any) => toast.error(e.message ?? "Failed"),
  });

  const msgs = (q.data?.messages ?? []).filter((m) => !m.internal);

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b border-border p-3 text-sm">
        <button onClick={onBack} className="rounded-lg border border-input bg-card px-2 py-1 text-xs hover:bg-secondary">
          ← Back
        </button>
        <p className="truncate font-medium">{q.data?.ticket.subject ?? "Loading…"}</p>
      </div>
      <div className="flex-1 space-y-3 overflow-y-auto p-3">
        {msgs.map((m) => (
          <div key={m.id} className="rounded-2xl border border-border bg-card p-3 text-sm">
            <p className="text-xs text-muted-foreground">
              {m.author_name ?? "—"} · {fmt(m.created_at)}
            </p>
            <p className="mt-1 whitespace-pre-wrap">{m.body}</p>
          </div>
        ))}
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (reply.trim()) m.mutate();
        }}
        className="border-t border-border bg-card p-3"
      >
        <textarea
          value={reply}
          onChange={(e) => setReply(e.target.value)}
          rows={2}
          placeholder="Type a reply…"
          className="w-full resize-none rounded-lg border border-input bg-background p-2 text-sm outline-none focus:border-primary"
        />
        <div className="mt-2 flex justify-end">
          <button
            type="submit"
            disabled={m.isPending || !reply.trim()}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            <Send className="size-3" /> Send
          </button>
        </div>
      </form>
    </div>
  );
}
