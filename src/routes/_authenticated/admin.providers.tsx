import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ShieldCheck, Search, Briefcase, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { listAdminProviders, adminSetProviderActive, checkIsAdmin } from "@/lib/admin.functions";
import { PageSkeleton, EmptyState, ErrorState, RouteErrorBoundary } from "@/components/carematch";

export const Route = createFileRoute("/_authenticated/admin/providers")({
  component: ProvidersPage,
  errorComponent: RouteErrorBoundary,
  beforeLoad: async () => {
    const { isAdmin } = await checkIsAdmin();
    if (!isAdmin) throw redirect({ to: "/admin" });
  },
});

function ProvidersPage() {
  const fn = useServerFn(listAdminProviders);
  const setActiveFn = useServerFn(adminSetProviderActive);
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["admin", "providers"], queryFn: () => fn() });
  const [query, setQuery] = useState("");

  const setActive = useMutation({
    mutationFn: (vars: { provider_id: string; is_active: boolean }) => setActiveFn({ data: vars }),
    onSuccess: () => {
      toast.success("Provider updated");
      qc.invalidateQueries({ queryKey: ["admin", "providers"] });
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Couldn't update provider"),
  });

  const filtered = useMemo(() => {
    const all = q.data ?? [];
    const needle = query.trim().toLowerCase();
    if (!needle) return all;
    return all.filter(
      (p) =>
        (p.full_name ?? "").toLowerCase().includes(needle) ||
        (p.headline ?? "").toLowerCase().includes(needle) ||
        (p.service_area ?? "").toLowerCase().includes(needle),
    );
  }, [q.data, query]);

  if (q.isPending) return <PageSkeleton title="providers" cards={4} />;
  if (q.isError) return <ErrorState error={q.error} onRetry={() => q.refetch()} />;

  const tierCounts = { bronze: 0, silver: 0, gold: 0 } as Record<string, number>;
  let active = 0;
  for (const p of q.data ?? []) {
    if (p.is_active) active += 1;
    if (p.tier in tierCounts) tierCounts[p.tier] += 1;
  }

  return (
    <div className="space-y-5">
      <header>
        <p className="text-xs uppercase tracking-widest text-muted-foreground">Supply</p>
        <h1 className="font-serif text-2xl lg:text-3xl">Providers</h1>
      </header>

      <div className="grid gap-2 sm:grid-cols-4">
        <PipCard label="Total" value={q.data?.length ?? 0} />
        <PipCard label="Active" value={active} />
        <PipCard label="Silver" value={tierCounts.silver} />
        <PipCard label="Gold" value={tierCounts.gold} />
      </div>

      <section className="rounded-2xl border border-border bg-card">
        <div className="flex items-center gap-2 border-b border-border p-3">
          <div className="flex flex-1 items-center gap-2 rounded-lg border border-input bg-background px-3 py-1.5">
            <Search className="size-4 text-muted-foreground" />
            <input
              placeholder="Search name, headline, or area…"
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
              icon={<Briefcase className="size-6" />}
              title={q.data?.length === 0 ? "No providers yet" : "No matches"}
              description={
                q.data?.length === 0
                  ? "New providers show up here once they complete onboarding."
                  : "Try a different search term."
              }
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 text-left font-medium">Provider</th>
                  <th className="px-3 py-2 text-left font-medium">Tier</th>
                  <th className="px-3 py-2 text-left font-medium">Active</th>
                  <th className="px-3 py-2 text-right font-medium">Rate</th>
                  <th className="px-3 py-2 text-right font-medium">Years</th>
                  <th className="px-3 py-2 text-left font-medium">Area</th>
                  <th className="px-3 py-2 text-left font-medium">Verifications</th>
                  <th className="px-3 py-2 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr key={p.id} className="border-t border-border hover:bg-secondary/40">
                    <td className="px-3 py-2">
                      <Link
                        to="/admin/users"
                        search={{ q: p.full_name ?? "" }}
                        className="font-medium hover:underline"
                      >
                        {p.full_name ?? "Unnamed"}
                      </Link>
                      {p.headline && (
                        <p className="text-[11px] text-muted-foreground">{p.headline}</p>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-primary">
                        {p.tier}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      {p.is_active ? (
                        <span className="text-emerald-700">Yes</span>
                      ) : (
                        <span className="text-muted-foreground">No</span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      ${(p.hourly_rate_cents / 100).toFixed(0)}/hr
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      {p.years_experience ?? "—"}
                    </td>
                    <td className="px-3 py-2 text-muted-foreground">{p.service_area ?? "—"}</td>
                    <td className="px-3 py-2">
                      <span className="inline-flex items-center gap-1 text-xs">
                        <ShieldCheck className="size-3 text-primary" />
                        {p.verifications_passed}/{p.verifications_total}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-right">
                      <button
                        type="button"
                        disabled={setActive.isPending}
                        onClick={() =>
                          setActive.mutate({ provider_id: p.id, is_active: !p.is_active })
                        }
                        className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold disabled:opacity-50 ${
                          p.is_active
                            ? "border-destructive/30 text-destructive hover:bg-destructive/10"
                            : "border-emerald-300/60 text-emerald-700 hover:bg-emerald-50"
                        }`}
                      >
                        {setActive.isPending ? <Loader2 className="size-3 animate-spin" /> : null}
                        {p.is_active ? "Deactivate" : "Activate"}
                      </button>
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

function PipCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-border bg-card p-3">
      <p className="text-[11px] uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className="mt-1 font-serif text-2xl tabular-nums">{value}</p>
    </div>
  );
}
