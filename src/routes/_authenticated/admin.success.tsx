import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { CheckSquare, Plus, X } from "lucide-react";
import { toast } from "sonner";
import { listCsTasks, createCsTask, updateCsTask, assignCsTaskToMe, type CsTaskRow } from "@/lib/admin-cs.functions";
import { PageSkeleton, EmptyState, ErrorState, RouteErrorBoundary } from "@/components/carematch";

export const Route = createFileRoute("/_authenticated/admin/success")({
  component: CsPage,
  errorComponent: RouteErrorBoundary,
});

const priorityTone: Record<string, string> = {
  high: "bg-destructive/10 text-destructive",
  normal: "bg-secondary text-foreground",
  low: "bg-muted text-muted-foreground",
};
const columns: { key: CsTaskRow["status"]; label: string }[] = [
  { key: "open", label: "Open" },
  { key: "in_progress", label: "In progress" },
  { key: "snoozed", label: "Snoozed" },
  { key: "done", label: "Done" },
];

function fmtDue(iso: string | null) {
  if (!iso) return "no due date";
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function CsPage() {
  const listFn = useServerFn(listCsTasks);
  const q = useQuery({ queryKey: ["admin", "cs"], queryFn: () => listFn() });
  const [showNew, setShowNew] = useState(false);

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Console</p>
          <h1 className="font-serif text-2xl lg:text-3xl">Customer success</h1>
        </div>
        <button
          onClick={() => setShowNew(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="size-4" /> New task
        </button>
      </header>

      {q.isPending ? (
        <PageSkeleton title="tasks" cards={4} />
      ) : q.isError ? (
        <ErrorState error={q.error} onRetry={() => q.refetch()} />
      ) : (q.data ?? []).length === 0 ? (
        <EmptyState icon={<CheckSquare className="size-6" />} title="No tasks yet" description="Add a task to get started." />
      ) : (
        <div className="grid gap-4 lg:grid-cols-4">
          {columns.map((col) => {
            const items = (q.data ?? []).filter((t) => t.status === col.key);
            return (
              <section key={col.key} className="rounded-2xl border border-border bg-card p-3">
                <header className="mb-2 flex items-center justify-between">
                  <h2 className="text-sm font-semibold">{col.label}</h2>
                  <span className="text-xs text-muted-foreground">{items.length}</span>
                </header>
                <ul className="space-y-2">
                  {items.map((t) => (
                    <CsTaskCard key={t.id} task={t} />
                  ))}
                  {items.length === 0 && <li className="rounded-lg border border-dashed border-border p-3 text-xs text-muted-foreground">No tasks</li>}
                </ul>
              </section>
            );
          })}
        </div>
      )}

      {showNew && <NewTaskDialog onClose={() => setShowNew(false)} />}
    </div>
  );
}

function CsTaskCard({ task }: { task: CsTaskRow }) {
  const qc = useQueryClient();
  const upd = useServerFn(updateCsTask);
  const assign = useServerFn(assignCsTaskToMe);

  const invalidate = () => qc.invalidateQueries({ queryKey: ["admin", "cs"] });

  const updM = useMutation({
    mutationFn: (patch: { id: string; status?: CsTaskRow["status"]; priority?: CsTaskRow["priority"] }) => upd({ data: patch }),
    onSuccess: invalidate,
    onError: (e: any) => toast.error(e.message ?? "Failed"),
  });
  const assignM = useMutation({
    mutationFn: () => assign({ data: { id: task.id } }),
    onSuccess: () => {
      toast.success("Assigned to you");
      invalidate();
    },
  });

  return (
    <li className="rounded-lg border border-border bg-background p-3 text-sm">
      <div className="flex items-start justify-between gap-2">
        <p className="font-medium">{task.title}</p>
        <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase ${priorityTone[task.priority]}`}>
          {task.priority}
        </span>
      </div>
      {task.notes && <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{task.notes}</p>}
      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        {task.target_name && <span>User: {task.target_name}</span>}
        <span>Due: {fmtDue(task.due_at)}</span>
        {task.assignee_name ? (
          <span>· {task.assignee_name}</span>
        ) : (
          <button onClick={() => assignM.mutate()} className="text-primary hover:underline">
            Assign me
          </button>
        )}
      </div>
      <div className="mt-2 flex flex-wrap gap-1">
        {columns
          .filter((c) => c.key !== task.status)
          .map((c) => (
            <button
              key={c.key}
              onClick={() => updM.mutate({ id: task.id, status: c.key })}
              className="rounded border border-input bg-card px-2 py-0.5 text-[10px] hover:bg-secondary"
            >
              → {c.label}
            </button>
          ))}
      </div>
    </li>
  );
}

function NewTaskDialog({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const create = useServerFn(createCsTask);
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [priority, setPriority] = useState<"low" | "normal" | "high">("normal");
  const [due, setDue] = useState("");

  const m = useMutation({
    mutationFn: () =>
      create({
        data: {
          title: title.trim(),
          notes: notes.trim() || null,
          priority,
          due_at: due ? new Date(due).toISOString() : null,
        },
      }),
    onSuccess: () => {
      toast.success("Task created");
      qc.invalidateQueries({ queryKey: ["admin", "cs"] });
      onClose();
    },
    onError: (e: any) => toast.error(e.message ?? "Failed"),
  });

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" onClick={onClose}>
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={(e) => {
          e.preventDefault();
          m.mutate();
        }}
        className="w-full max-w-md space-y-3 rounded-2xl bg-background p-5 shadow-2xl"
      >
        <header className="flex items-center justify-between">
          <h2 className="font-serif text-lg">New task</h2>
          <button type="button" onClick={onClose} className="grid size-8 place-items-center rounded-lg hover:bg-secondary">
            <X className="size-4" />
          </button>
        </header>
        <input
          required
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
        />
        <textarea
          rows={3}
          placeholder="Notes (optional)"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="w-full resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm"
        />
        <div className="flex gap-2">
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value as any)}
            className="rounded-lg border border-input bg-background px-2 py-1.5 text-sm"
          >
            <option value="low">Low</option>
            <option value="normal">Normal</option>
            <option value="high">High</option>
          </select>
          <input
            type="datetime-local"
            value={due}
            onChange={(e) => setDue(e.target.value)}
            className="flex-1 rounded-lg border border-input bg-background px-2 py-1.5 text-sm"
          />
        </div>
        <button
          type="submit"
          disabled={m.isPending}
          className="w-full rounded-lg bg-primary py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          Create
        </button>
      </form>
    </div>
  );
}
