import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { CheckCircle2, XCircle, FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  listCredentialQueue,
  decideCredential,
  signCredentialDocument,
  type PendingCredential,
} from "@/lib/admin-credentials.functions";
import { adminListBackgroundChecks, adminAdjudicate } from "@/lib/background-checks.functions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { RouteErrorBoundary } from "@/components/carematch";

export const Route = createFileRoute("/_authenticated/admin/credentials")({
  component: CredentialsQueue,
  errorComponent: RouteErrorBoundary,
});

function CredentialsQueue() {
  const listFn = useServerFn(listCredentialQueue);
  const decideFn = useServerFn(decideCredential);
  const signFn = useServerFn(signCredentialDocument);

  const [status, setStatus] = useState<"pending" | "passed" | "failed" | "expired">("pending");
  const [selected, setSelected] = useState<PendingCredential | null>(null);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  const q = useQuery({
    queryKey: ["admin", "credentials", status],
    queryFn: () => listFn({ data: { status } }),
  });

  const rows = q.data ?? [];

  const decide = async (decision: "passed" | "failed") => {
    if (!selected) return;
    setBusy(true);
    try {
      await decideFn({ data: { id: selected.id, decision, note: note || null } });
      toast.success(`Credential ${decision}`);
      setSelected(null);
      setNote("");
      await q.refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not update");
    } finally {
      setBusy(false);
    }
  };

  const openDoc = async (path: string) => {
    try {
      const { url } = await signFn({ data: { path } });
      window.open(url, "_blank", "noopener");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not open document");
    }
  };

  return (
    <div>
      <header className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-serif text-2xl">Credentials queue</h1>
          <p className="text-sm text-muted-foreground">
            Approve or reject provider credential submissions. Approving unlocks the associated
            service tier automatically.
          </p>
        </div>
        <div className="flex gap-1 rounded-lg border border-border bg-card p-1 text-xs">
          {(["pending", "passed", "failed", "expired"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={`rounded-md px-3 py-1.5 font-semibold capitalize ${
                status === s ? "bg-primary text-primary-foreground" : "text-muted-foreground"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </header>

      <div className="grid gap-3 lg:grid-cols-[1fr_360px]">
        <div className="rounded-2xl border border-border bg-card">
          {q.isLoading ? (
            <div className="p-6 text-sm text-muted-foreground">Loading…</div>
          ) : rows.length === 0 ? (
            <div className="p-6 text-sm text-muted-foreground">Nothing in this queue.</div>
          ) : (
            <ul className="divide-y divide-border">
              {rows.map((r) => {
                const ageDays = Math.floor((Date.now() - new Date(r.created_at).getTime()) / (1000 * 60 * 60 * 24));
                const ageChip = ageDays >= 3
                  ? { cls: "bg-destructive/15 text-destructive", label: `${ageDays}d` }
                  : ageDays >= 1
                    ? { cls: "bg-amber-500/15 text-amber-700", label: `${ageDays}d` }
                    : { cls: "bg-emerald-500/15 text-emerald-700", label: "<24h" };
                return (
                  <li key={r.id}>
                    <button
                      onClick={() => {
                        setSelected(r);
                        setNote(r.notes ?? "");
                      }}
                      className={`flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm hover:bg-secondary/50 ${
                        selected?.id === r.id ? "bg-secondary/60" : ""
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="truncate font-semibold">
                          {r.provider_name ?? "Provider"} · {r.kind.replace(/_/g, " ")}
                        </div>
                        <div className="truncate text-xs text-muted-foreground">
                          {r.issuing_state ? `${r.issuing_state} · ` : ""}
                          {r.issued_on ? `issued ${new Date(r.issued_on).toLocaleDateString()} · ` : ""}
                          submitted {new Date(r.created_at).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        {status === "pending" && (
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${ageChip.cls}`}>
                            {ageChip.label}
                          </span>
                        )}
                        <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-semibold uppercase capitalize">
                          {r.status}
                        </span>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {selected ? (
          <aside className="sticky top-20 h-fit rounded-2xl border border-border bg-card p-4">
            <div className="mb-3">
              <h2 className="font-serif text-lg">{selected.provider_name ?? "Provider"}</h2>
              <p className="text-xs text-muted-foreground">
                {selected.kind.replace(/_/g, " ")} · {selected.status}
              </p>
            </div>
            <dl className="mb-3 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-xs">
              <dt className="text-muted-foreground">Issued</dt>
              <dd>{selected.issued_on ?? "—"}</dd>
              <dt className="text-muted-foreground">Expires</dt>
              <dd>{selected.expires_on ?? "—"}</dd>
              <dt className="text-muted-foreground">State</dt>
              <dd>{selected.issuing_state ?? "—"}</dd>
            </dl>

            {selected.document_path ? (
              <button
                onClick={() => openDoc(selected.document_path!)}
                className="mb-3 inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
              >
                <FileText className="size-3" /> Open document
              </button>
            ) : (
              <p className="mb-3 text-xs italic text-muted-foreground">No document uploaded.</p>
            )}

            <label className="mb-1 block text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Note
            </label>
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              placeholder="Optional review note"
            />

            <div className="mt-3 flex gap-2">
              <Button
                onClick={() => decide("passed")}
                disabled={busy || selected.status === "passed"}
                className="flex-1"
              >
                {busy ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="size-4" />
                )}
                Approve
              </Button>
              <Button
                onClick={() => decide("failed")}
                disabled={busy || selected.status === "failed"}
                variant="destructive"
                className="flex-1"
              >
                <XCircle className="size-4" /> Reject
              </Button>
            </div>
          </aside>
        ) : (
          <aside className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            Select a submission to review.
          </aside>
        )}
      </div>

      <BackgroundChecksSection />
    </div>
  );
}

function BackgroundChecksSection() {
  const listFn = useServerFn(adminListBackgroundChecks);
  const adjFn = useServerFn(adminAdjudicate);
  const q = useQuery({ queryKey: ["admin", "bg-checks"], queryFn: () => listFn({ data: {} }) });

  const adj = async (id: string, decision: "cleared" | "adverse_action" | "pre_adverse_action") => {
    try {
      await adjFn({ data: { id, decision } });
      toast.success("Updated");
      await q.refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    }
  };

  return (
    <section className="mt-10 space-y-3">
      <h2 className="text-lg font-semibold">Background checks</h2>
      <div className="overflow-x-auto rounded-2xl border border-border">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-left text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-3 py-2">Provider</th>
              <th className="px-3 py-2">Vendor</th>
              <th className="px-3 py-2">Package</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Adjudication</th>
              <th className="px-3 py-2">Ordered</th>
              <th className="px-3 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {(q.data ?? []).map((r) => (
              <tr key={r.id} className="border-t border-border">
                <td className="px-3 py-2 font-mono text-xs">{r.provider_id.slice(0, 8)}</td>
                <td className="px-3 py-2">{r.vendor}</td>
                <td className="px-3 py-2 capitalize">{r.package_tier.replace(/_/g, " ")}</td>
                <td className="px-3 py-2 capitalize">{r.status.replace(/_/g, " ")}</td>
                <td className="px-3 py-2 capitalize">{r.adjudication.replace(/_/g, " ")}</td>
                <td className="px-3 py-2 text-muted-foreground">
                  {new Date(r.ordered_at).toLocaleDateString()}
                </td>
                <td className="px-3 py-2 space-x-1">
                  <Button size="sm" variant="outline" onClick={() => adj(r.id, "cleared")}>Clear</Button>
                  <Button size="sm" variant="outline" onClick={() => adj(r.id, "pre_adverse_action")}>Pre-adverse</Button>
                  <Button size="sm" variant="destructive" onClick={() => adj(r.id, "adverse_action")}>Adverse</Button>
                </td>
              </tr>
            ))}
            {(q.data ?? []).length === 0 && (
              <tr><td colSpan={7} className="px-3 py-6 text-center text-muted-foreground">No background checks yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

