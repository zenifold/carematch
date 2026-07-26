import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Users, HeartHandshake, Phone, MessageCircle } from "lucide-react";
import {
  PageSkeleton,
  EmptyState,
  ErrorState,
  RouteErrorBoundary,
} from "@/components/carematch";
import { listMyLinkedSeniors, listVisitsForSenior } from "@/lib/family.functions";

export const Route = createFileRoute("/_authenticated/family/people")({
  component: FamilyPeople,
  errorComponent: RouteErrorBoundary,
});

function FamilyPeople() {
  const linksFn = useServerFn(listMyLinkedSeniors);
  const visitsFn = useServerFn(listVisitsForSenior);
  const linksQ = useQuery({ queryKey: ["family", "links"], queryFn: () => linksFn() });
  const primary = linksQ.data?.[0];
  const visitsQ = useQuery({
    queryKey: ["family", "visits", primary?.senior_id ?? ""],
    enabled: !!primary,
    queryFn: () => visitsFn({ data: { senior_id: primary!.senior_id } }),
  });

  const caregivers = useMemo(() => {
    const rows = visitsQ.data ?? [];
    const map = new Map<string, { id: string; name: string; avatar: string | null; visits: number; last: string | null }>();
    for (const r of rows) {
      if (!r.provider_id) continue;
      const entry = map.get(r.provider_id) ?? {
        id: r.provider_id,
        name: r.provider_name ?? "Caregiver",
        avatar: r.provider_avatar_url,
        visits: 0,
        last: null,
      };
      entry.visits += 1;
      if (!entry.last || r.scheduled_at > entry.last) entry.last = r.scheduled_at;
      map.set(r.provider_id, entry);
    }
    return [...map.values()].sort((a, b) => b.visits - a.visits);
  }, [visitsQ.data]);

  if (linksQ.isPending) return <PageSkeleton title="people" cards={3} />;
  if (linksQ.isError)
    return <ErrorState title="Couldn't load your team" error={linksQ.error} onRetry={() => linksQ.refetch()} />;

  return (
    <div className="space-y-8">
      <header>
        <p className="text-xs uppercase tracking-widest text-muted-foreground">Who's involved</p>
        <h1 className="mt-1 font-serif text-3xl lg:text-4xl">People</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Everyone on the care team for the seniors you support.
        </p>
      </header>

      <section>
        <h2 className="mb-3 text-sm font-bold uppercase tracking-widest text-muted-foreground">Seniors you support</h2>
        {(linksQ.data ?? []).length === 0 ? (
          <EmptyState
            icon={<Users className="size-6" />}
            title="Nobody linked yet"
            description="Ask a senior to add you or accept your invite from Settings."
            action={
              <Link
                to="/family/settings"
                className="inline-flex min-h-12 items-center rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-soft hover:bg-primary/90"
              >
                Manage links
              </Link>
            }
          />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {linksQ.data!.map((s) => (
              <div key={s.senior_id} className="surface-card flex items-center gap-3 p-4">
                <div className="grid size-12 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
                  {s.avatar_url ? (
                    <img src={s.avatar_url} alt="" className="size-12 rounded-full object-cover" />
                  ) : (
                    <HeartHandshake className="size-5" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-serif text-lg">{s.full_name ?? "Senior"}</p>
                  <p className="truncate text-sm text-muted-foreground">
                    {s.city ?? "—"} · {s.permission}
                  </p>
                </div>
                <Link
                  to="/family/care-plan"
                  className="rounded-lg border border-input bg-background px-3 py-1.5 text-xs font-semibold hover:bg-secondary"
                >
                  Care plan
                </Link>
              </div>
            ))}
          </div>
        )}
      </section>

      {primary && (
        <section>
          <h2 className="mb-3 text-sm font-bold uppercase tracking-widest text-muted-foreground">
            Caregivers in rotation
          </h2>
          {visitsQ.isPending ? (
            <PageSkeleton cards={2} />
          ) : caregivers.length === 0 ? (
            <EmptyState
              icon={<Users className="size-6" />}
              title="No caregivers yet"
              description="Once visits are booked, your rotation appears here."
            />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {caregivers.map((c) => (
                <div key={c.id} className="surface-card flex items-center gap-3 p-4">
                  <div className="grid size-12 shrink-0 place-items-center rounded-full bg-secondary">
                    {c.avatar ? (
                      <img src={c.avatar} alt="" className="size-12 rounded-full object-cover" />
                    ) : (
                      <Users className="size-5 text-muted-foreground" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-serif text-lg">{c.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {c.visits} {c.visits === 1 ? "visit" : "visits"}
                      {c.last ? ` · last ${new Date(c.last).toLocaleDateString(undefined, { month: "short", day: "numeric" })}` : ""}
                    </p>
                  </div>
                  <Link
                    to="/family/messages"
                    className="grid size-10 place-items-center rounded-full border border-input bg-background hover:bg-secondary"
                    aria-label="Message caregiver"
                  >
                    <MessageCircle className="size-4" />
                  </Link>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      <section className="surface-card p-5 lg:p-6">
        <div className="flex items-start gap-3">
          <Phone className="mt-1 size-5 text-primary" />
          <div>
            <h2 className="font-serif text-2xl">Concierge</h2>
            <p className="text-sm text-muted-foreground">
              Your dedicated concierge coordinator is available 7 days a week for scheduling, care plan
              questions, and escalations.
            </p>
            <Link
              to="/family/help"
              className="mt-3 inline-flex rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
            >
              Contact concierge
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
