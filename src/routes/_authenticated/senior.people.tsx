import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { MessageCircle, Users } from "lucide-react";
import { toast } from "sonner";
import {
  VerificationBadge,
  PageSkeleton,
  EmptyState,
  ErrorState,
  RouteErrorBoundary,
} from "@/components/carematch";
import { SeniorFamilyInvites } from "@/components/carematch/SeniorFamilyInvites";
import { listMyVisits, type VisitRow } from "@/lib/bookings.functions";
import { ensureConversation } from "@/lib/messages.functions";

export const Route = createFileRoute("/_authenticated/senior/people")({
  component: SeniorPeople,
  errorComponent: RouteErrorBoundary,
});

type Person = {
  providerId: string;
  name: string;
  initials: string;
  serviceType: string;
  visitCount: number;
  lastVisit: string;
};

function initialsOf(name: string) {
  return name
    .split(" ")
    .map((s) => s[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function relativeDate(iso: string) {
  const then = new Date(iso).getTime();
  const days = Math.floor((Date.now() - then) / (1000 * 60 * 60 * 24));
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  if (days < 14) return "Last week";
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function aggregate(rows: VisitRow[]): Person[] {
  const byProvider = new Map<string, VisitRow[]>();
  for (const r of rows) {
    if (r.status === "cancelled") continue;
    const list = byProvider.get(r.provider_id) ?? [];
    list.push(r);
    byProvider.set(r.provider_id, list);
  }
  return Array.from(byProvider.entries())
    .map(([providerId, visits]) => {
      visits.sort(
        (a, b) => new Date(b.scheduled_at).getTime() - new Date(a.scheduled_at).getTime(),
      );
      const name = visits[0].provider_name ?? "Caregiver";
      return {
        providerId,
        name,
        initials: initialsOf(name),
        serviceType: visits[0].service_type,
        visitCount: visits.length,
        lastVisit: relativeDate(visits[0].scheduled_at),
      };
    })
    .sort((a, b) => b.visitCount - a.visitCount);
}

function SeniorPeople() {
  const navigate = useNavigate();
  const fetchVisits = useServerFn(listMyVisits);
  const openConvo = useServerFn(ensureConversation);
  const visitsQ = useQuery({
    queryKey: ["senior", "visits"],
    queryFn: () => fetchVisits(),
  });

  const openMessage = async (providerUserId: string) => {
    try {
      const { id } = await openConvo({ data: { other_user_id: providerUserId } });
      navigate({ to: "/senior/messages/$id", params: { id } });
    } catch {
      toast.error("Couldn't open the conversation. Try again.");
    }
  };

  if (visitsQ.isPending) {
    return <PageSkeleton title="people" cards={3} />;
  }
  if (visitsQ.isError) {
    return (
      <ErrorState
        title="We couldn't load your caregivers"
        error={visitsQ.error}
        onRetry={() => visitsQ.refetch()}
      />
    );
  }

  const people = aggregate(visitsQ.data ?? []);

  const rebook = (p: Person) => {
    toast.success(`Rebooking ${p.name} — concierge will confirm shortly.`);
    navigate({ to: "/senior/book" });
  };

  return (
    <div>
      <h1 className="font-serif text-3xl">My people</h1>
      <p className="mt-2 text-lg text-muted-foreground">
        Your caregivers and family — all in one place.
      </p>

      <section className="mt-8">
        <div className="flex items-center gap-2">
          <Users className="size-5 text-primary" />
          <h2 className="font-serif text-2xl">My caregivers</h2>
        </div>

        {people.length === 0 ? (
          <div className="mt-4">
            <EmptyState
              icon={<Users className="size-6" />}
              title="No caregivers yet"
              description="Once you complete a visit, your regulars will appear here for easy rebooking."
              action={
                <button
                  type="button"
                  onClick={() => navigate({ to: "/senior/book" })}
                  className="inline-flex min-h-14 items-center rounded-full bg-primary px-6 text-base font-semibold text-primary-foreground shadow-soft hover:bg-primary/90"
                >
                  Find a caregiver
                </button>
              }
            />
          </div>
        ) : (
          <ul className="mt-4 grid gap-4">
            {people.map((p) => (
              <li key={p.providerId} className="surface-card p-5">
                <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-4">
                  <span className="grid size-16 shrink-0 place-items-center rounded-2xl bg-sage-100 font-serif text-xl text-sage-700">
                    {p.initials}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-xl font-semibold">{p.name}</p>
                    <p className="truncate text-base text-muted-foreground">
                      {p.serviceType}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {p.visitCount} visit{p.visitCount === 1 ? "" : "s"} · last {p.lastVisit}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => rebook(p)}
                    className="inline-flex min-h-14 shrink-0 items-center justify-center rounded-full bg-primary px-5 text-base font-semibold text-primary-foreground shadow-soft hover:bg-primary/90"
                  >
                    Rebook
                  </button>
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <VerificationBadge stage="background" size="sm" />
                  <button
                    type="button"
                    onClick={() => openMessage(p.providerId)}
                    className="inline-flex items-center gap-1.5 text-base font-semibold text-sage-700 underline-offset-4 hover:underline"
                  >
                    <MessageCircle className="size-4" /> Message
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-10">
        <div className="flex items-center gap-2">
          <Users className="size-5 text-primary" />
          <h2 className="font-serif text-2xl">My family</h2>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Invite family members to help coordinate your care.
        </p>
        <div className="mt-4">
          <SeniorFamilyInvites />
        </div>
      </section>
    </div>
  );
}
