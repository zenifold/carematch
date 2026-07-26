import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Flag, Megaphone, Trash2, Plus } from "lucide-react";
import { toast } from "sonner";
import {
  listFlags,
  upsertFlag,
  deleteFlag,
  listBroadcasts,
  createBroadcast,
  deleteBroadcast,
  type FlagRow,
  type BroadcastRow,
} from "@/lib/admin-ops.functions";
import { PageSkeleton, EmptyState, ErrorState, RouteErrorBoundary } from "@/components/carematch";

export const Route = createFileRoute("/_authenticated/admin/settings")({
  component: SettingsPage,
  errorComponent: RouteErrorBoundary,
});

function fmt(iso: string | null | undefined) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

function SettingsPage() {
  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs uppercase tracking-widest text-muted-foreground">Console</p>
        <h1 className="font-serif text-2xl lg:text-3xl">System settings</h1>
      </header>
      <FlagsSection />
      <BroadcastsSection />
    </div>
  );
}

function FlagsSection() {
  const qc = useQueryClient();
  const listFn = useServerFn(listFlags);
  const upFn = useServerFn(upsertFlag);
  const delFn = useServerFn(deleteFlag);

  const q = useQuery({ queryKey: ["admin", "flags"], queryFn: () => listFn() });
  const [showNew, setShowNew] = useState(false);

  const invalidate = () => qc.invalidateQueries({ queryKey: ["admin", "flags"] });
  const upM = useMutation({
    mutationFn: (input: { key: string; enabled: boolean; description?: string | null; rollout_percent?: number }) => upFn({ data: input }),
    onSuccess: invalidate,
    onError: (e: any) => toast.error(e.message ?? "Failed"),
  });
  const delM = useMutation({
    mutationFn: (key: string) => delFn({ data: { key } }),
    onSuccess: () => { toast.success("Flag deleted"); invalidate(); },
    onError: (e: any) => toast.error(e.message ?? "Failed"),
  });

  return (
    <section className="rounded-2xl border border-border bg-card">
      <header className="flex items-center justify-between border-b border-border p-4">
        <div>
          <h2 className="flex items-center gap-2 font-serif text-lg"><Flag className="size-4" /> Feature flags</h2>
          <p className="text-xs text-muted-foreground">Toggle experimental features by key.</p>
        </div>
        <button
          onClick={() => setShowNew(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="size-3" /> New flag
        </button>
      </header>
      {q.isPending ? (
        <div className="p-4"><PageSkeleton title="flags" cards={2} /></div>
      ) : q.isError ? (
        <ErrorState error={q.error} onRetry={() => q.refetch()} />
      ) : (q.data ?? []).length === 0 ? (
        <div className="p-6"><EmptyState icon={<Flag className="size-6" />} title="No flags" description="Add one to start toggling features." /></div>
      ) : (
        <ul className="divide-y divide-border">
          {(q.data ?? []).map((f: FlagRow) => (
            <li key={f.key} className="flex flex-wrap items-center gap-3 p-4">
              <div className="min-w-0 flex-1">
                <p className="font-mono text-sm">{f.key}</p>
                {f.description && <p className="text-xs text-muted-foreground">{f.description}</p>}
                <p className="text-[10px] text-muted-foreground">Updated {fmt(f.updated_at)}</p>
              </div>
              <label className="inline-flex items-center gap-2 text-xs">
                <input
                  type="checkbox"
                  checked={f.enabled}
                  onChange={(e) => upM.mutate({ key: f.key, enabled: e.target.checked, description: f.description, rollout_percent: f.rollout_percent })}
                />
                Enabled
              </label>
              <div className="flex items-center gap-2 text-xs">
                <span className="text-muted-foreground">Rollout</span>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={f.rollout_percent}
                  onChange={(e) => {
                    const n = Math.max(0, Math.min(100, parseInt(e.target.value || "0", 10)));
                    upM.mutate({ key: f.key, enabled: f.enabled, description: f.description, rollout_percent: n });
                  }}
                  className="w-16 rounded-lg border border-input bg-background px-2 py-1 text-xs"
                />
                %
              </div>
              <button onClick={() => { if (window.confirm(`Delete flag ${f.key}?`)) delM.mutate(f.key); }} className="grid size-8 place-items-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-destructive">
                <Trash2 className="size-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
      {showNew && <NewFlagDialog onClose={() => setShowNew(false)} onCreate={(v) => { upM.mutate(v); setShowNew(false); }} />}
    </section>
  );
}

function NewFlagDialog({ onClose, onCreate }: { onClose: () => void; onCreate: (v: { key: string; description: string | null; enabled: boolean; rollout_percent: number }) => void }) {
  const [key, setKey] = useState("");
  const [desc, setDesc] = useState("");
  const [enabled, setEnabled] = useState(false);
  const [rollout, setRollout] = useState(100);

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" onClick={onClose}>
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={(e) => { e.preventDefault(); onCreate({ key: key.trim(), description: desc.trim() || null, enabled, rollout_percent: rollout }); }}
        className="w-full max-w-md space-y-3 rounded-2xl bg-background p-5 shadow-2xl"
      >
        <h3 className="font-serif text-lg">New feature flag</h3>
        <input required placeholder="key (e.g. new_onboarding)" value={key} onChange={(e) => setKey(e.target.value)} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm font-mono" />
        <input placeholder="Description" value={desc} onChange={(e) => setDesc(e.target.value)} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" />
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} /> Enable on create
        </label>
        <label className="flex items-center gap-2 text-sm">
          Rollout %
          <input type="number" min={0} max={100} value={rollout} onChange={(e) => setRollout(parseInt(e.target.value || "0", 10))} className="w-20 rounded-lg border border-input bg-background px-2 py-1" />
        </label>
        <button type="submit" className="w-full rounded-lg bg-primary py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">Create</button>
      </form>
    </div>
  );
}

function BroadcastsSection() {
  const qc = useQueryClient();
  const listFn = useServerFn(listBroadcasts);
  const createFn = useServerFn(createBroadcast);
  const delFn = useServerFn(deleteBroadcast);
  const q = useQuery({ queryKey: ["admin", "broadcasts"], queryFn: () => listFn() });
  const [showNew, setShowNew] = useState(false);
  const invalidate = () => qc.invalidateQueries({ queryKey: ["admin", "broadcasts"] });

  const createM = useMutation({
    mutationFn: (v: { title: string; body: string; audience: any; ends_at?: string | null }) => createFn({ data: v }),
    onSuccess: () => { toast.success("Broadcast published"); invalidate(); setShowNew(false); },
    onError: (e: any) => toast.error(e.message ?? "Failed"),
  });
  const delM = useMutation({
    mutationFn: (id: string) => delFn({ data: { id } }),
    onSuccess: () => { toast.success("Deleted"); invalidate(); },
    onError: (e: any) => toast.error(e.message ?? "Failed"),
  });

  return (
    <section className="rounded-2xl border border-border bg-card">
      <header className="flex items-center justify-between border-b border-border p-4">
        <div>
          <h2 className="flex items-center gap-2 font-serif text-lg"><Megaphone className="size-4" /> Broadcasts</h2>
          <p className="text-xs text-muted-foreground">Announcements shown to signed-in users.</p>
        </div>
        <button onClick={() => setShowNew(true)} className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90">
          <Plus className="size-3" /> New broadcast
        </button>
      </header>
      {q.isPending ? (
        <div className="p-4"><PageSkeleton title="broadcasts" cards={2} /></div>
      ) : (q.data ?? []).length === 0 ? (
        <div className="p-6"><EmptyState icon={<Megaphone className="size-6" />} title="No broadcasts" description="Add one to communicate with users." /></div>
      ) : (
        <ul className="divide-y divide-border">
          {(q.data ?? []).map((b: BroadcastRow) => (
            <li key={b.id} className="flex flex-wrap items-start gap-3 p-4">
              <div className="min-w-0 flex-1">
                <p className="font-medium">{b.title}</p>
                <p className="text-sm text-muted-foreground">{b.body}</p>
                <p className="mt-1 text-[10px] uppercase tracking-wider text-muted-foreground">
                  {b.audience} · from {fmt(b.starts_at)} {b.ends_at ? `to ${fmt(b.ends_at)}` : "· no end"}
                </p>
              </div>
              <button onClick={() => { if (window.confirm("Delete broadcast?")) delM.mutate(b.id); }} className="grid size-8 place-items-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-destructive">
                <Trash2 className="size-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
      {showNew && <NewBroadcastDialog onClose={() => setShowNew(false)} onCreate={(v) => createM.mutate(v)} />}
    </section>
  );
}

function NewBroadcastDialog({ onClose, onCreate }: { onClose: () => void; onCreate: (v: { title: string; body: string; audience: any; ends_at?: string | null }) => void }) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [audience, setAudience] = useState<"all" | "senior" | "family" | "provider" | "staff">("all");
  const [ends, setEnds] = useState("");

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" onClick={onClose}>
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={(e) => { e.preventDefault(); onCreate({ title: title.trim(), body: body.trim(), audience, ends_at: ends ? new Date(ends).toISOString() : null }); }}
        className="w-full max-w-md space-y-3 rounded-2xl bg-background p-5 shadow-2xl"
      >
        <h3 className="font-serif text-lg">New broadcast</h3>
        <input required placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" />
        <textarea required rows={3} placeholder="Message" value={body} onChange={(e) => setBody(e.target.value)} className="w-full resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm" />
        <div className="flex gap-2">
          <select value={audience} onChange={(e) => setAudience(e.target.value as any)} className="rounded-lg border border-input bg-background px-2 py-1.5 text-sm">
            <option value="all">All users</option>
            <option value="senior">Seniors</option>
            <option value="family">Family</option>
            <option value="provider">Providers</option>
            <option value="staff">Staff</option>
          </select>
          <input
            type="datetime-local"
            value={ends}
            onChange={(e) => setEnds(e.target.value)}
            className="flex-1 rounded-lg border border-input bg-background px-2 py-1.5 text-sm"
            placeholder="Ends at"
          />
        </div>
        <button type="submit" className="w-full rounded-lg bg-primary py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">Publish</button>
      </form>
    </div>
  );
}
