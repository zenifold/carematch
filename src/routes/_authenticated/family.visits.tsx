import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ShieldCheck, CheckCircle2, MessageSquare, UserPlus } from "lucide-react";
import {
  PageSkeleton,
  EmptyState,
  ErrorState,
  RouteErrorBoundary,
  ReportIncidentButton,
  PermissionBanner,
  RequestChangeDialog,
} from "@/components/carematch";
import {
  getSeniorEditPermission,
  listMyLinkedSeniors,
  listVisitsForSenior,
} from "@/lib/family.functions";
import type { VisitRow } from "@/lib/bookings.functions";

export const Route = createFileRoute("/_authenticated/family/visits")({
  component: FamilyVisits,
  errorComponent: RouteErrorBoundary,
});

function initialsOf(name: string | null) {
  if (!name) return "?";
  return name
    .split(" ")
    .map((s) => s[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function relativeDay(iso: string) {
  const d = new Date(iso);
  const today = new Date();
  const diffDays = Math.round(
    (new Date(d.toDateString()).getTime() - new Date(today.toDateString()).getTime()) /
      (1000 * 60 * 60 * 24),
  );
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Tomorrow";
  if (diffDays === -1) return "Yesterday";
  return d.toLocaleDateString(undefined, { weekday: "short" });
}

function FamilyVisits() {
  const fetchLinks = useServerFn(listMyLinkedSeniors);
  const fetchVisits = useServerFn(listVisitsForSenior);
  const fetchPerm = useServerFn(getSeniorEditPermission);

  const linksQ = useQuery({
    queryKey: ["family", "links"],
    queryFn: () => fetchLinks(),
  });
  const primary = linksQ.data?.[0];

  const visitsQ = useQuery({
    queryKey: ["family", "visits", primary?.senior_id ?? ""],
    enabled: !!primary,
    queryFn: () => fetchVisits({ data: { senior_id: primary!.senior_id } }),
  });
  const permQ = useQuery({
    queryKey: ["family", "perm", primary?.senior_id ?? ""],
    enabled: !!primary,
    queryFn: () => fetchPerm({ data: { senior_id: primary!.senior_id } }),
  });
  const canEdit = permQ.data?.can_edit ?? false;

  const [openId, setOpenId] = useState<string | null>(null);
  const [tab, setTab] = useState<"upcoming" | "today" | "past">("upcoming");
  const [caregiver, setCaregiver] = useState<string | null>(null);


  if (linksQ.isPending) {
    return <PageSkeleton title="visits" cards={4} />;
  }
  if (linksQ.isError) {
    return (
      <ErrorState
        title="We couldn't load your visits"
        error={linksQ.error}
        onRetry={() => linksQ.refetch()}
      />
    );
  }
  if (!primary) {
    return (
      <div className="space-y-6">
        <Header />
        <EmptyState
          icon={<UserPlus className="size-6" />}
          title="No linked senior"
          description="Once you're linked to a senior, their visit history will appear here."
          action={
            <Link
              to="/family/settings"
              className="inline-flex min-h-14 items-center rounded-full bg-primary px-6 text-base font-semibold text-primary-foreground shadow-soft hover:bg-primary/90"
            >
              Manage links
            </Link>
          }
        />
      </div>
    );
  }

  if (visitsQ.isPending) {
    return (
      <div className="space-y-6">
        <Header />
        <PageSkeleton title="visits" cards={4} />
      </div>
    );
  }
  if (visitsQ.isError) {
    return (
      <div className="space-y-6">
        <Header />
        <ErrorState
          title="We couldn't load these visits"
          error={visitsQ.error}
          onRetry={() => visitsQ.refetch()}
        />
      </div>
    );
  }

  const rows = visitsQ.data ?? [];



  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const endOfToday = new Date();
  endOfToday.setHours(23, 59, 59, 999);

  const caregivers = Array.from(
    new Map(
      rows
        .filter((r) => r.provider_id)
        .map((r) => [r.provider_id, r.provider_name ?? "Caregiver"]),
    ).entries(),
  );

  const inTab = (r: VisitRow) => {
    const t = new Date(r.scheduled_at).getTime();
    if (tab === "today") return t >= startOfToday.getTime() && t <= endOfToday.getTime();
    if (tab === "upcoming")
      return (
        t > endOfToday.getTime() && r.status !== "completed" && r.status !== "cancelled"
      );
    // past
    return t < startOfToday.getTime() || r.status === "completed" || r.status === "cancelled";
  };

  const filtered = rows
    .filter(inTab)
    .filter((r) => (caregiver ? r.provider_id === caregiver : true));

  const counts = {
    upcoming: rows.filter(
      (r) =>
        new Date(r.scheduled_at).getTime() > endOfToday.getTime() &&
        r.status !== "completed" &&
        r.status !== "cancelled",
    ).length,
    today: rows.filter((r) => {
      const t = new Date(r.scheduled_at).getTime();
      return t >= startOfToday.getTime() && t <= endOfToday.getTime();
    }).length,
    past: rows.filter(
      (r) =>
        new Date(r.scheduled_at).getTime() < startOfToday.getTime() ||
        r.status === "completed" ||
        r.status === "cancelled",
    ).length,
  };

  return (
    <div className="space-y-6">
      <Header />

      {!canEdit && (
        <PermissionBanner seniorName={primary.full_name} action="change visits or report issues" />
      )}



      {/* Segmented tabs */}
      <div className="inline-flex rounded-full border border-border bg-card p-1">
        {(
          [
            ["upcoming", "Upcoming", counts.upcoming],
            ["today", "Today", counts.today],
            ["past", "Past", counts.past],
          ] as const
        ).map(([id, label, count]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`min-h-10 rounded-full px-4 text-sm font-semibold transition ${
              tab === id
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {label} <span className="ml-1 opacity-70">({count})</span>
          </button>
        ))}
      </div>

      {/* Caregiver filter */}
      {caregivers.length > 1 && (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setCaregiver(null)}
            className={`min-h-9 rounded-full border px-3 text-sm font-medium transition ${
              caregiver === null
                ? "border-primary bg-primary/10 text-primary"
                : "border-border hover:border-primary/40"
            }`}
          >
            All caregivers
          </button>
          {caregivers.map(([id, name]) => (
            <button
              key={id ?? "none"}
              type="button"
              onClick={() => setCaregiver(id)}
              className={`min-h-9 rounded-full border px-3 text-sm font-medium transition ${
                caregiver === id
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border hover:border-primary/40"
              }`}
            >
              {name}
            </button>
          ))}
        </div>
      )}

      {rows.length === 0 ? (
        <EmptyState
          title="No visits yet"
          description={`${primary.full_name ?? "Your senior"} hasn't had any visits yet.`}
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          title={
            tab === "upcoming"
              ? "Nothing coming up"
              : tab === "today"
                ? "No visits today"
                : "No past visits match"
          }
          description={
            caregiver
              ? "Try clearing the caregiver filter."
              : "Switch tabs to see the rest."
          }
        />
      ) : (
        <ul className="space-y-3">
          {filtered.map((v) => (
            <VisitRow
              key={v.id}
              v={v}
              open={openId === v.id}
              onToggle={() => setOpenId(openId === v.id ? null : v.id)}
              canEdit={canEdit}
              seniorId={primary.senior_id}
              seniorName={primary.full_name}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

function Header() {
  return (
    <div>
      <p className="text-xs uppercase tracking-widest text-muted-foreground">
        Care log
      </p>
      <h1 className="mt-1 font-serif text-3xl lg:text-4xl">Visits</h1>
    </div>
  );
}

function VisitRow({
  v,
  open,
  onToggle,
  canEdit,
  seniorId,
  seniorName,
}: {
  v: VisitRow;
  open: boolean;
  onToggle: () => void;
  canEdit: boolean;
  seniorId: string;
  seniorName: string | null;
}) {
  const [askCancel, setAskCancel] = useState(false);
  const scheduled = new Date(v.scheduled_at);
  const status = v.status === "completed" ? "completed" : "scheduled";
  const canRequestCancel = v.status !== "completed" && v.status !== "cancelled";
  return (
    <li className="surface-card overflow-hidden">
      <button
        onClick={onToggle}
        className="flex w-full items-center gap-4 p-5 text-left hover:bg-secondary/40"
      >
        <div className="w-16 shrink-0 text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            {relativeDay(v.scheduled_at)}
          </p>
          <p className="font-serif text-lg">
            {scheduled.toLocaleDateString(undefined, { month: "short", day: "numeric" })}
          </p>
        </div>
        <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-sage-100 font-serif text-sage-700">
          {initialsOf(v.provider_name)}
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-semibold">{v.provider_name ?? "Caregiver"}</p>
          <p className="text-sm text-muted-foreground">
            {scheduled.toLocaleTimeString(undefined, {
              hour: "numeric",
              minute: "2-digit",
            })}{" "}
            · {v.service_type}
          </p>
        </div>
        <span
          className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold uppercase ${
            status === "completed"
              ? "bg-sage-100 text-sage-700"
              : "bg-accent/20 text-accent-foreground"
          }`}
        >
          {status}
        </span>
      </button>

      {open && (
        <div className="space-y-4 border-t border-border p-5">
          {v.status === "completed" && (
            <div className="rounded-2xl bg-primary/5 p-4">
              <p className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-primary">
                <ShieldCheck className="size-4" /> Verified visit
              </p>
              <p className="mt-1 text-sm">
                Duration {Math.round(v.duration_minutes / 60)}h · Total $
                {Math.round((v.hourly_rate_cents * v.duration_minutes) / 60 / 100)}
              </p>
            </div>
          )}

          {v.notes && (
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                Notes
              </p>
              <p className="mt-2 text-sm">{v.notes}</p>
            </div>
          )}

          <div className="flex flex-wrap gap-2 pt-2">
            <Link
              to="/family/messages"
              className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-semibold hover:bg-secondary"
            >
              <MessageSquare className="size-4" /> Message caregiver
            </Link>
            {canEdit && <ReportIncidentButton bookingId={v.id} variant="subtle" />}
            {canRequestCancel && (
              <button
                type="button"
                onClick={() => setAskCancel(true)}
                className="inline-flex items-center gap-2 rounded-full border border-destructive/40 px-4 py-2 text-sm font-semibold text-destructive hover:bg-destructive/10"
              >
                Request cancel
              </button>
            )}
          </div>

          {v.status !== "completed" && (
            <div className="flex items-center gap-2 rounded-2xl border border-dashed border-border p-4 text-sm text-muted-foreground">
              <CheckCircle2 className="size-4" />
              Task photos and check-in details appear here after the visit.
            </div>
          )}
        </div>
      )}
      <RequestChangeDialog
        open={askCancel}
        onOpenChange={setAskCancel}
        seniorId={seniorId}
        seniorName={seniorName}
        kind="cancel_visit"
        title="Request visit cancellation"
        summary={
          <div>
            <p className="text-xs uppercase tracking-widest text-muted-foreground">Visit</p>
            <p className="mt-1 font-serif text-lg">{v.service_type}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {scheduled.toLocaleString()} · {v.provider_name ?? "Caregiver"}
            </p>
          </div>
        }
        payload={{}}
        targetId={v.id}
      />
    </li>
  );
}
