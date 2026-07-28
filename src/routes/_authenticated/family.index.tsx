import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  ShieldCheck,
  Calendar,
  Wallet,
  CheckCircle2,
  UserPlus,
  AlertTriangle,
  MessageCircle,
  ClipboardList,
  ArrowRight,
  Clock,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PageSkeleton, EmptyState, ErrorState, RouteErrorBoundary } from "@/components/carematch";
import { listMyLinkedSeniors, listVisitsForSenior } from "@/lib/family.functions";
import { getUnreadMessageCount } from "@/lib/messages.functions";

export const Route = createFileRoute("/_authenticated/family/")({
  component: FamilyOverview,
  errorComponent: RouteErrorBoundary,
});

function countdown(iso: string) {
  const diff = new Date(iso).getTime() - Date.now();
  if (diff <= 0) return "Happening now";
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `in ${mins} min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `in ${hrs} hr`;
  const days = Math.floor(hrs / 24);
  return `in ${days} day${days === 1 ? "" : "s"}`;
}

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

function FamilyOverview() {
  const fetchLinks = useServerFn(listMyLinkedSeniors);
  const fetchVisits = useServerFn(listVisitsForSenior);
  const fetchUnread = useServerFn(getUnreadMessageCount);
  const unreadQ = useQuery({
    queryKey: ["messages", "unread-count"],
    queryFn: () => fetchUnread(),
  });

  const profileQ = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return null;
      const { data } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", u.user.id)
        .maybeSingle();
      return data;
    },
  });

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

  if (profileQ.isPending || linksQ.isPending) {
    return <PageSkeleton title="family home" cards={3} />;
  }
  if (linksQ.isError) {
    return (
      <ErrorState
        title="We couldn't load your family view"
        error={linksQ.error}
        onRetry={() => linksQ.refetch()}
      />
    );
  }

  const firstName = profileQ.data?.full_name?.split(" ")[0] ?? "there";
  const links = linksQ.data ?? [];

  if (links.length === 0) {
    return (
      <div className="space-y-8">
        <div>
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Family portal</p>
          <h1 className="mt-1 font-serif text-3xl tracking-tight lg:text-4xl">Hi {firstName}</h1>
        </div>
        <EmptyState
          icon={<UserPlus className="size-6" />}
          title="No linked seniors yet"
          description="Once a senior invites you as a family member and approves the link, you'll see their visits, budget, and updates here."
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

  const rows = visitsQ.data ?? [];
  const now = Date.now();

  const lastCompleted = rows.find((r) => r.status === "completed");
  const nextUpcoming = [...rows]
    .reverse()
    .find(
      (r) =>
        r.status !== "completed" &&
        r.status !== "cancelled" &&
        new Date(r.scheduled_at).getTime() >= now - 60 * 60 * 1000,
    );

  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);
  const spentCents = rows
    .filter(
      (r) => r.status === "completed" && new Date(r.scheduled_at).getTime() >= monthStart.getTime(),
    )
    .reduce((s, r) => s + (r.hourly_rate_cents * r.duration_minutes) / 60, 0);
  const budgetCents = primary?.monthly_budget_cents ?? 120000;
  const visitsThisMonth = rows.filter(
    (r) => r.status === "completed" && new Date(r.scheduled_at).getTime() >= monthStart.getTime(),
  ).length;
  const activeProviders = new Set(rows.map((r) => r.provider_id)).size;

  // Flag strip: things that need family attention
  const weekAgo = now - 7 * 24 * 60 * 60 * 1000;
  const threeWeeksAgo = now - 21 * 24 * 60 * 60 * 1000;
  const flags: {
    tone: "warn" | "info";
    label: string;
    detail: string;
    to: "/family/visits" | "/family/messages" | "/family/care-plan" | "/family/budget";
  }[] = [];

  const unmatched = rows.filter(
    (r) =>
      (r.status === "requested" || r.status === "pending") &&
      new Date(r.scheduled_at).getTime() >= now,
  ).length;
  if (unmatched > 0) {
    flags.push({
      tone: "warn",
      label: `${unmatched} visit${unmatched === 1 ? "" : "s"} waiting on a caregiver`,
      detail: "We're still matching — call the concierge if you need it filled fast.",
      to: "/family/visits",
    });
  }

  const cancelledRecent = rows.filter(
    (r) => r.status === "cancelled" && new Date(r.scheduled_at).getTime() >= weekAgo,
  ).length;
  if (cancelledRecent > 0) {
    flags.push({
      tone: "warn",
      label: `${cancelledRecent} visit${cancelledRecent === 1 ? "" : "s"} cancelled this week`,
      detail: "Take a look and rebook if you'd like the coverage back.",
      to: "/family/visits",
    });
  }

  const completedRecent = rows.filter(
    (r) => r.status === "completed" && new Date(r.scheduled_at).getTime() >= weekAgo,
  ).length;
  if (completedRecent > 0) {
    flags.push({
      tone: "info",
      label: `${completedRecent} visit${completedRecent === 1 ? "" : "s"} completed this week`,
      detail: "Read caregiver summaries and send a thank-you.",
      to: "/family/visits",
    });
  }

  const anyRecentActivity = rows.some((r) => new Date(r.scheduled_at).getTime() >= threeWeeksAgo);
  if (!anyRecentActivity && rows.length > 0) {
    flags.push({
      tone: "warn",
      label: "No visits in the last 3 weeks",
      detail: "Everything okay? Book a check-in visit or say hi.",
      to: "/family/visits",
    });
  }

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs uppercase tracking-widest text-muted-foreground">
          Is everything okay?
        </p>
        <h1 className="mt-1 font-serif text-3xl tracking-tight lg:text-4xl">
          Hi {firstName}
          {primary?.full_name ? ` — looking in on ${primary.full_name.split(" ")[0]}` : ""}
        </h1>
      </div>

      <section className="rounded-3xl border border-border bg-primary/5 p-5 lg:p-6">
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-primary" />
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-primary">Last visit</p>
              {lastCompleted ? (
                <>
                  <p className="mt-1 font-medium">
                    {lastCompleted.provider_name ?? "Caregiver"} — {lastCompleted.service_type}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(lastCompleted.scheduled_at).toLocaleString(undefined, {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </p>
                </>
              ) : (
                <p className="mt-1 text-sm text-muted-foreground">No completed visits yet</p>
              )}
            </div>
          </div>
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-0.5 size-5 shrink-0 text-primary" />
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-primary">
                Verification
              </p>
              <p className="mt-1 font-medium">All active caregivers verified</p>
              <p className="text-sm text-muted-foreground">CareMatch renews checks automatically</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Calendar className="mt-0.5 size-5 shrink-0 text-primary" />
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-primary">Next visit</p>
              {nextUpcoming ? (
                <>
                  <p className="mt-1 font-medium">
                    {new Date(nextUpcoming.scheduled_at).toLocaleString(undefined, {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {nextUpcoming.provider_name ?? "Caregiver"} · {nextUpcoming.service_type}
                  </p>
                  <p className="mt-1 inline-flex items-center gap-1 rounded-full bg-primary/15 px-2 py-0.5 text-xs font-semibold text-primary">
                    <Clock className="size-3" /> {countdown(nextUpcoming.scheduled_at)}
                  </p>
                </>
              ) : (
                <p className="mt-1 text-sm text-muted-foreground">Nothing scheduled</p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Status chips */}
      <section className="flex flex-wrap gap-2">
        {(unreadQ.data ?? 0) > 0 && (
          <Link
            to="/family/messages"
            className="inline-flex items-center gap-1.5 rounded-full border-2 border-primary/40 bg-primary/10 px-3 py-1.5 text-sm font-semibold text-primary hover:bg-primary/15"
          >
            <MessageCircle className="size-4" /> {unreadQ.data} unread message
            {unreadQ.data === 1 ? "" : "s"}
          </Link>
        )}
        {unmatched > 0 && (
          <Link
            to="/family/visits"
            className="inline-flex items-center gap-1.5 rounded-full border-2 border-amber-300/60 bg-amber-50 px-3 py-1.5 text-sm font-semibold text-amber-900 hover:bg-amber-100"
          >
            <AlertTriangle className="size-4" /> {unmatched} awaiting caregiver
          </Link>
        )}
        {spentCents / 100 >= (budgetCents / 100) * 0.9 && budgetCents > 0 && (
          <Link
            to="/family/budget"
            className="inline-flex items-center gap-1.5 rounded-full border-2 border-amber-300/60 bg-amber-50 px-3 py-1.5 text-sm font-semibold text-amber-900 hover:bg-amber-100"
          >
            <Wallet className="size-4" /> Budget nearly used
          </Link>
        )}
      </section>

      {/* 7-day mini calendar */}
      <SevenDayStrip rows={rows} />

      {flags.length > 0 && (
        <section className="space-y-2">
          <h2 className="font-serif text-xl">Worth a look</h2>
          <ul className="grid gap-2">
            {flags.map((f, i) => (
              <li key={i}>
                <Link
                  to={f.to}
                  className={`flex items-center gap-3 rounded-2xl border-2 p-4 transition hover:brightness-95 ${
                    f.tone === "warn"
                      ? "border-amber-300/60 bg-amber-50"
                      : "border-primary/30 bg-primary/5"
                  }`}
                >
                  <span
                    className={`grid size-10 shrink-0 place-items-center rounded-full ${
                      f.tone === "warn"
                        ? "bg-amber-500/20 text-amber-800"
                        : "bg-primary/15 text-primary"
                    }`}
                  >
                    <AlertTriangle className="size-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold">{f.label}</p>
                    <p className="truncate text-sm text-muted-foreground">{f.detail}</p>
                  </div>
                  <ArrowRight className="size-4 shrink-0 text-muted-foreground" />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="grid gap-3 sm:grid-cols-3">
        <QuickAction
          to="/family/messages"
          icon={<MessageCircle className="size-5" />}
          label="Message caregiver"
          hint="Say hi, ask a question"
        />
        <QuickAction
          to="/family/care-plan"
          icon={<ClipboardList className="size-5" />}
          label="Adjust care plan"
          hint="Update what caregivers see"
        />
        <QuickAction
          to="/family/budget"
          icon={<Wallet className="size-5" />}
          label="Budget & funds"
          hint="Track spend, request a plan change"
        />
      </section>

      {primary && (
        <section className="surface-card flex items-center gap-5 p-5 lg:p-6">
          <span className="grid size-16 shrink-0 place-items-center rounded-2xl bg-sage-100 font-serif text-xl text-sage-700">
            {initialsOf(primary.full_name)}
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="font-serif text-2xl">{primary.full_name ?? "Your senior"}</h2>
            <p className="text-sm text-muted-foreground">
              {primary.city ? `${primary.city} · ` : ""}
              {activeProviders} caregiver{activeProviders === 1 ? "" : "s"} · {visitsThisMonth}{" "}
              visit{visitsThisMonth === 1 ? "" : "s"} this month
            </p>
          </div>
          <Link
            to="/family/care-plan"
            className="hidden shrink-0 rounded-full border border-border px-4 py-2 text-sm font-semibold hover:bg-secondary sm:inline-block"
          >
            View care plan
          </Link>
        </section>
      )}

      <section className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Visits this month"
          value={String(visitsThisMonth)}
          sub={visitsThisMonth === 0 ? "None yet" : "Completed"}
          icon={Calendar}
        />
        <StatCard
          label="Budget spent"
          value={`$${Math.round(spentCents / 100)}`}
          sub={`of $${Math.round(budgetCents / 100)} budget`}
          icon={Wallet}
        />
        <StatCard
          label="Active caregivers"
          value={String(activeProviders)}
          sub={activeProviders === 0 ? "None yet" : "All verified"}
          icon={ShieldCheck}
        />
      </section>

      <section className="surface-card p-5 lg:p-6">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-2xl">Recent activity</h2>
          <Link
            to="/family/visits"
            className="text-sm font-semibold text-primary underline-offset-4 hover:underline"
          >
            See all visits
          </Link>
        </div>
        {rows.length === 0 ? (
          <div className="mt-5">
            <EmptyState
              title="No visits yet"
              description="Once bookings happen, you'll see them here."
            />
          </div>
        ) : (
          <ul className="mt-5 space-y-3">
            {rows.slice(0, 5).map((v) => (
              <li
                key={v.id}
                className="flex items-center gap-4 rounded-2xl border border-border bg-secondary/40 p-4"
              >
                <span className="grid size-9 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
                  <CheckCircle2 className="size-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-medium">
                    {v.provider_name ?? "Caregiver"} · {v.service_type}
                  </p>
                  <p className="truncate text-sm text-muted-foreground capitalize">
                    {v.status.replace("_", " ")}
                  </p>
                </div>
                <p className="text-right text-sm text-muted-foreground">
                  {new Date(v.scheduled_at).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                  })}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
}: {
  label: string;
  value: string;
  sub: string;
  icon: typeof Calendar;
}) {
  return (
    <div className="surface-card p-5">
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{label}</p>
        <Icon className="size-4 text-muted-foreground" />
      </div>
      <p className="mt-3 font-serif text-3xl">{value}</p>
      <p className="mt-1 text-sm text-muted-foreground">{sub}</p>
    </div>
  );
}

function QuickAction({
  to,
  icon,
  label,
  hint,
}: {
  to: "/family/messages" | "/family/care-plan" | "/family/budget";
  icon: React.ReactNode;
  label: string;
  hint: string;
}) {
  return (
    <Link
      to={to}
      className="surface-card flex items-center gap-3 p-4 transition hover:bg-secondary/40"
    >
      <span className="grid size-10 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
        {icon}
      </span>
      <div className="min-w-0">
        <p className="font-semibold">{label}</p>
        <p className="truncate text-xs text-muted-foreground">{hint}</p>
      </div>
    </Link>
  );
}

function SevenDayStrip({ rows }: { rows: { scheduled_at: string; status: string }[] }) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const next = new Date(d);
    next.setDate(d.getDate() + 1);
    const count = rows.filter((r) => {
      if (r.status === "cancelled") return false;
      const t = new Date(r.scheduled_at).getTime();
      return t >= d.getTime() && t < next.getTime();
    }).length;
    return { date: d, count };
  });

  return (
    <section>
      <div className="flex items-center justify-between">
        <h2 className="font-serif text-xl">Next 7 days</h2>
        <Link
          to="/family/visits"
          className="text-sm font-semibold text-primary underline-offset-4 hover:underline"
        >
          All visits →
        </Link>
      </div>
      <div className="mt-3 grid grid-cols-7 gap-2">
        {days.map((d, i) => {
          const isToday = i === 0;
          return (
            <div
              key={i}
              className={`rounded-2xl border-2 p-2 text-center ${
                isToday ? "border-primary bg-primary/10" : "border-border bg-card"
              }`}
            >
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                {d.date.toLocaleDateString(undefined, { weekday: "short" })}
              </p>
              <p className={`font-serif text-lg ${isToday ? "text-primary" : ""}`}>
                {d.date.getDate()}
              </p>
              <div className="mt-1 flex justify-center gap-0.5">
                {Array.from({ length: Math.min(d.count, 3) }).map((_, k) => (
                  <span
                    key={k}
                    className={`size-1.5 rounded-full ${isToday ? "bg-primary" : "bg-sage-500"}`}
                  />
                ))}
                {d.count === 0 && <span className="text-xs text-muted-foreground/60">·</span>}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
