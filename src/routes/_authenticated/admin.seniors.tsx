import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Search, Users } from "lucide-react";
import { listAdminSeniors, checkIsAdmin } from "@/lib/admin.functions";
import { PageSkeleton, EmptyState, ErrorState, RouteErrorBoundary } from "@/components/carematch";

export const Route = createFileRoute("/_authenticated/admin/seniors")({
  component: SeniorsPage,
  errorComponent: RouteErrorBoundary,
  beforeLoad: async () => {
    const { isAdmin } = await checkIsAdmin();
    if (!isAdmin) throw redirect({ to: "/admin" });
  },
});

function fmtMoney(cents: number | null) {
  if (cents === null) return "—";
  return `$${(cents / 100).toLocaleString(undefined, { maximumFractionDigits: 0 })}/mo`;
}
function fmtRelative(iso: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function SeniorsPage() {
  const fn = useServerFn(listAdminSeniors);
  const q = useQuery({ queryKey: ["admin", "seniors"], queryFn: () => fn() });
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const all = q.data ?? [];
    const needle = query.trim().toLowerCase();
    if (!needle) return all;
    return all.filter(
      (s) =>
        (s.full_name ?? "").toLowerCase().includes(needle) ||
        (s.city ?? "").toLowerCase().includes(needle),
    );
  }, [q.data, query]);

  if (q.isPending) return <PageSkeleton title="seniors" cards={4} />;
  if (q.isError) return <ErrorState error={q.error} onRetry={() => q.refetch()} />;

  return (
    <div className="space-y-5">
      <header>
        <p className="text-xs uppercase tracking-widest text-muted-foreground">Members</p>
        <h1 className="font-serif text-2xl lg:text-3xl">Seniors</h1>
      </header>

      <section className="rounded-2xl border border-border bg-card">
        <div className="flex items-center gap-2 border-b border-border p-3">
          <div className="flex flex-1 items-center gap-2 rounded-lg border border-input bg-background px-3 py-1.5">
            <Search className="size-4 text-muted-foreground" />
            <input
              placeholder="Search by name or city…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full bg-transparent text-sm outline-none"
            />
          </div>
          <span className="text-xs text-muted-foreground">
            {filtered.length} of {q.data?.length ?? 0}
          </span>
        </div>

        {filtered.length === 0 ? (
          <div className="p-6">
            <EmptyState
              icon={<Users className="size-6" />}
              title={q.data?.length === 0 ? "No seniors yet" : "No matches"}
              description={
                q.data?.length === 0
                  ? "New senior accounts will appear here once they sign up."
                  : "Try a different search term."
              }
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 text-left font-medium">Name</th>
                  <th className="px-3 py-2 text-left font-medium">City</th>
                  <th className="px-3 py-2 text-left font-medium">Budget</th>
                  <th className="px-3 py-2 text-right font-medium">Family links</th>
                  <th className="px-3 py-2 text-left font-medium">Last booking</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s) => (
                  <tr key={s.id} className="border-t border-border hover:bg-secondary/40">
                    <td className="px-3 py-2">
                      <Link
                        to="/admin/users"
                        search={{ q: s.full_name ?? "" }}
                        className="font-medium hover:underline"
                      >
                        {s.full_name ?? "Unnamed"}
                      </Link>
                    </td>
                    <td className="px-3 py-2 text-muted-foreground">{s.city ?? "—"}</td>
                    <td className="px-3 py-2">{fmtMoney(s.monthly_budget_cents)}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{s.linked_family}</td>
                    <td className="px-3 py-2 text-muted-foreground">
                      {fmtRelative(s.last_booking_at)}
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
