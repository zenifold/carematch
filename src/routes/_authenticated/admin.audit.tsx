import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ScrollText, Search } from "lucide-react";
import { listAuditLog } from "@/lib/admin-users.functions";
import { PageSkeleton, EmptyState, ErrorState, RouteErrorBoundary } from "@/components/carematch";

export const Route = createFileRoute("/_authenticated/admin/audit")({
  component: AuditPage,
  errorComponent: RouteErrorBoundary,
});

function fmtWhen(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function actionCategory(action: string): string {
  const prefix = action.split(".")[0] ?? action.split("_")[0] ?? action;
  return prefix.toLowerCase();
}

function AuditPage() {
  const fn = useServerFn(listAuditLog);
  const q = useQuery({
    queryKey: ["admin", "audit"],
    queryFn: () => fn({ data: { limit: 150 } }),
  });
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>("all");

  const rows = q.data ?? [];

  const categories = useMemo(() => {
    const set = new Set<string>();
    for (const r of rows) set.add(actionCategory(r.action));
    return Array.from(set).sort();
  }, [rows]);

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (category !== "all" && actionCategory(r.action) !== category) return false;
      if (!needle) return true;
      return (
        r.action.toLowerCase().includes(needle) ||
        (r.actor_name ?? "").toLowerCase().includes(needle) ||
        (r.target_name ?? "").toLowerCase().includes(needle) ||
        JSON.stringify(r.payload ?? {}).toLowerCase().includes(needle)
      );
    });
  }, [rows, search, category]);

  if (q.isPending) return <PageSkeleton title="audit log" cards={5} />;
  if (q.isError) return <ErrorState error={q.error} onRetry={() => q.refetch()} />;

  return (
    <div className="space-y-5">
      <header>
        <p className="text-xs uppercase tracking-widest text-muted-foreground">Console</p>
        <h1 className="font-serif text-2xl lg:text-3xl">Audit log</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Every mutating admin action is recorded here — who did what to whom.
        </p>
      </header>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search actor, target, action, or payload"
            className="w-full rounded-full border border-input bg-background py-2 pl-10 pr-4 text-sm"
          />
        </div>
        <p className="text-xs text-muted-foreground">
          {filtered.length} / {rows.length}
        </p>
      </div>

      {categories.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          <CategoryChip active={category === "all"} onClick={() => setCategory("all")}>
            All
          </CategoryChip>
          {categories.map((c) => (
            <CategoryChip key={c} active={category === c} onClick={() => setCategory(c)}>
              {c}
            </CategoryChip>
          ))}
        </div>
      )}

      <section className="rounded-2xl border border-border bg-card">
        {filtered.length === 0 ? (
          <div className="p-6">
            <EmptyState
              icon={<ScrollText className="size-6" />}
              title={rows.length === 0 ? "No activity yet" : "No matches"}
              description={
                rows.length === 0
                  ? "Admin actions will appear here as they happen."
                  : "Try a different search or category."
              }
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 text-left font-medium">When</th>
                  <th className="px-3 py-2 text-left font-medium">Actor</th>
                  <th className="px-3 py-2 text-left font-medium">Action</th>
                  <th className="px-3 py-2 text-left font-medium">Target</th>
                  <th className="px-3 py-2 text-left font-medium">Details</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.id} className="border-t border-border align-top">
                    <td className="whitespace-nowrap px-3 py-2 text-muted-foreground">{fmtWhen(r.created_at)}</td>
                    <td className="px-3 py-2">{r.actor_name ?? "—"}</td>
                    <td className="px-3 py-2 font-mono text-xs">{r.action}</td>
                    <td className="px-3 py-2">{r.target_name ?? "—"}</td>
                    <td className="px-3 py-2 text-xs text-muted-foreground">
                      {r.payload && Object.keys(r.payload as any).length > 0 ? (
                        <code className="whitespace-pre-wrap break-all">{JSON.stringify(r.payload)}</code>
                      ) : (
                        "—"
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function CategoryChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3 py-1 text-xs font-semibold capitalize ${
        active
          ? "border-primary bg-primary/10 text-primary"
          : "border-border bg-background text-muted-foreground hover:bg-secondary"
      }`}
    >
      {children}
    </button>
  );
}

