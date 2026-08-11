import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  Plus,
  Users,
  Star,
  AlertTriangle,
  Phone,
  LifeBuoy,
  MessageCircle,
  HelpCircle,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  BudgetBar,
  VisitCard,
  PageSkeleton,
  EmptyState,
  ErrorState,
  RouteErrorBoundary,
  useUnreadMessageCount,
  IncomingRequestsPanel,
} from "@/components/carematch";
import type { VisitCardData, VisitStatus } from "@/components/carematch";
import { listMyVisits, type VisitRow } from "@/lib/bookings.functions";

export const Route = createFileRoute("/_authenticated/senior/")({
  component: SeniorHome,
  errorComponent: RouteErrorBoundary,
});

const STATUS_MAP: Record<string, VisitStatus> = {
  requested: "upcoming",
  confirmed: "upcoming",
  in_progress: "in-progress",
  completed: "completed",
  cancelled: "issue",
};

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

function formatSchedule(iso: string) {
  const d = new Date(iso);
  const today = new Date();
  const isToday = d.toDateString() === today.toDateString();
  const time = d.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
  return isToday
    ? `${time} Today`
    : d.toLocaleDateString(undefined, {
        weekday: "short",
        month: "short",
        day: "numeric",
      }) + ` · ${time}`;
}

function countdownLabel(iso: string): string | null {
  const diffMs = new Date(iso).getTime() - Date.now();
  if (diffMs < -60 * 60 * 1000) return null; // more than an hour past
  if (diffMs < 0) return "Happening now";
  const mins = Math.round(diffMs / 60000);
  if (mins < 60) return `Starts in ${mins} min`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `Starts in ${hrs} hr${hrs === 1 ? "" : "s"}`;
  const days = Math.round(hrs / 24);
  if (days === 1) return "Tomorrow";
  if (days < 7) return `In ${days} days`;
  return null;
}

function toVisitCard(row: VisitRow): VisitCardData {
  return {
    id: row.id,
    providerName: row.provider_name ?? "Caregiver",
    providerInitials: initialsOf(row.provider_name),
    serviceType: row.service_type,
    scheduledStart: formatSchedule(row.scheduled_at),
    status: STATUS_MAP[row.status] ?? "upcoming",
  };
}

function SeniorHome() {
  const navigate = useNavigate();
  const fetchVisits = useServerFn(listMyVisits);
  const unreadQ = useUnreadMessageCount();

  const profileQ = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return null;
      const { data } = await supabase
        .from("profiles")
        .select("full_name, monthly_budget_cents")
        .eq("id", u.user.id)
        .maybeSingle();
      return data;
    },
  });

  const visitsQ = useQuery({
    queryKey: ["senior", "visits"],
    queryFn: () => fetchVisits(),
  });

  if (visitsQ.isPending || profileQ.isPending) {
    return <PageSkeleton title="home" cards={3} />;
  }
  if (visitsQ.isError) {
    return (
      <ErrorState
        title="We couldn't load your home"
        error={visitsQ.error}
        onRetry={() => visitsQ.refetch()}
      />
    );
  }

  const firstName = profileQ.data?.full_name?.split(" ")[0] ?? "there";
  const rows = visitsQ.data ?? [];
  const now = Date.now();

  const nextVisit = rows
    .filter(
      (r) =>
        r.status !== "completed" &&
        r.status !== "cancelled" &&
        new Date(r.scheduled_at).getTime() >= now - 4 * 60 * 60 * 1000,
    )
    .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime())[0];

  // Recent regulars = distinct providers from last 5 completed visits.
  const regulars = (() => {
    const seen = new Map<string, VisitRow>();
    for (const r of rows) {
      if (r.status !== "completed") continue;
      if (!seen.has(r.provider_id)) seen.set(r.provider_id, r);
      if (seen.size >= 4) break;
    }
    return Array.from(seen.values());
  })();

  // Unrated completed visits (last 30 days) → prompt the senior to leave feedback.
  const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;
  const needsRating = rows.find(
    (r) =>
      r.status === "completed" &&
      !r.senior_rating &&
      new Date(r.scheduled_at).getTime() >= thirtyDaysAgo,
  );

  const nextCountdown = nextVisit ? countdownLabel(nextVisit.scheduled_at) : null;

  // Chips: unread messages, pending confirmations, upcoming this week.
  const unread = unreadQ.data ?? 0;
  const pendingConfirm = rows.filter((r) => r.status === "requested").length;
  const weekMs = 7 * 24 * 60 * 60 * 1000;
  const upcomingThisWeek = rows.filter(
    (r) =>
      (r.status === "confirmed" || r.status === "requested") &&
      new Date(r.scheduled_at).getTime() >= now &&
      new Date(r.scheduled_at).getTime() <= now + weekMs,
  ).length;

  // 7-day mini calendar: count of upcoming visits per day.
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    const dayStart = d.getTime();
    const dayEnd = dayStart + 24 * 60 * 60 * 1000;
    const count = rows.filter((r) => {
      const t = new Date(r.scheduled_at).getTime();
      return t >= dayStart && t < dayEnd && r.status !== "cancelled";
    }).length;
    return { date: d, count };
  });

  // Budget: this month's completed spend against profile budget.
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);
  const spent = Math.round(
    rows
      .filter(
        (r) =>
          r.status === "completed" && new Date(r.scheduled_at).getTime() >= monthStart.getTime(),
      )
      .reduce((s, r) => s + (r.hourly_rate_cents * r.duration_minutes) / 60, 0) / 100,
  );
  const budget = Math.round((profileQ.data?.monthly_budget_cents ?? 120000) / 100);

  return (
    <div>
      <div className="rounded-3xl bg-sage-50 p-7">
        <p className="text-sm font-medium uppercase tracking-widest text-sage-700">Welcome</p>
        <h1 className="mt-1 font-serif text-4xl tracking-tight">{firstName}</h1>
        {(unread > 0 || pendingConfirm > 0 || upcomingThisWeek > 0) && (
          <div className="mt-4 flex flex-wrap gap-2">
            {upcomingThisWeek > 0 && (
              <Link
                to="/senior/visits"
                className="inline-flex items-center gap-1.5 rounded-full bg-sage-100 px-3 py-1.5 text-sm font-semibold text-sage-700"
              >
                {upcomingThisWeek} visit{upcomingThisWeek === 1 ? "" : "s"} this week
              </Link>
            )}
            {pendingConfirm > 0 && (
              <Link
                to="/senior/visits"
                className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1.5 text-sm font-semibold text-amber-800"
              >
                {pendingConfirm} awaiting confirmation
              </Link>
            )}
            {unread > 0 && (
              <Link
                to="/senior/messages"
                className="inline-flex items-center gap-1.5 rounded-full bg-primary/15 px-3 py-1.5 text-sm font-semibold text-primary"
              >
                <MessageCircle className="size-4" /> {unread} new message{unread === 1 ? "" : "s"}
              </Link>
            )}
          </div>
        )}
      </div>

      {/* 7-day strip */}
      <div className="mt-6 grid grid-cols-7 gap-2">
        {weekDays.map(({ date, count }, i) => {
          const isToday = i === 0;
          return (
            <Link
              key={date.toISOString()}
              to="/senior/visits"
              className={`flex flex-col items-center justify-center rounded-2xl border py-3 text-center transition ${
                isToday
                  ? "border-primary bg-primary/10 text-primary"
                  : count > 0
                    ? "border-sage-300 bg-sage-50 text-sage-800"
                    : "border-border bg-card text-muted-foreground"
              }`}
            >
              <span className="text-[10px] font-bold uppercase tracking-wider">
                {date.toLocaleDateString(undefined, { weekday: "short" })}
              </span>
              <span className="mt-0.5 font-serif text-xl">{date.getDate()}</span>
              <span className="mt-1 flex h-2 items-center gap-0.5">
                {count > 0
                  ? Array.from({ length: Math.min(count, 3) }).map((_, di) => (
                      <span key={di} className="size-1.5 rounded-full bg-current opacity-80" />
                    ))
                  : null}
              </span>
            </Link>
          );
        })}
      </div>

      <div className="mt-6">
        <IncomingRequestsPanel />
      </div>

      {/* Quick actions */}
      <div className="mt-6 grid grid-cols-4 gap-3">
        <QuickAction to="/senior/book" icon={<Plus className="size-6" />} label="Book" />
        <QuickAction
          to="/senior/messages"
          icon={<MessageCircle className="size-6" />}
          label="Messages"
          badge={unread}
        />
        <QuickAction to="/senior/people" icon={<Users className="size-6" />} label="People" />
        <QuickAction to="/senior/help" icon={<HelpCircle className="size-6" />} label="Help" />
      </div>

      <div className="mt-6 grid gap-6">
        {needsRating && (
          <button
            type="button"
            onClick={() => navigate({ to: "/senior/visits/$id", params: { id: needsRating.id } })}
            className="flex items-center gap-4 rounded-3xl border-2 border-primary/40 bg-primary/5 p-5 text-left transition-transform active:scale-[0.99]"
          >
            <span className="grid size-14 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground">
              <Star className="size-6" />
            </span>
            <span className="flex-1">
              <span className="block font-serif text-xl">
                How was your visit with{" "}
                {needsRating.provider_name?.split(" ")[0] ?? "your caregiver"}?
              </span>
              <span className="mt-1 block text-sm text-muted-foreground">
                Tap to rate — takes 5 seconds.
              </span>
            </span>
          </button>
        )}

        {nextVisit ? (
          <div>
            {nextCountdown && (
              <p className="mb-3 inline-flex items-center gap-2 rounded-full bg-sage-100 px-4 py-1.5 text-sm font-semibold text-sage-700">
                {nextCountdown}
              </p>
            )}
            <VisitCard
              visit={toVisitCard(nextVisit)}
              onMessage={() => navigate({ to: "/senior/messages" })}
              onChange={() => navigate({ to: "/senior/visits/$id", params: { id: nextVisit.id } })}
            />
          </div>
        ) : (
          <EmptyState
            title="No upcoming visits"
            description="Tap Get help below to find a caregiver."
          />
        )}

        <Link
          to="/senior/book"
          className="flex w-full flex-col items-center justify-center gap-3 rounded-3xl border-4 border-dashed border-accent bg-accent/10 px-6 py-10 transition-transform active:scale-[0.98]"
          aria-label="Get new help"
        >
          <span className="grid size-16 place-items-center rounded-full bg-accent text-accent-foreground shadow-soft">
            <Plus className="size-8" />
          </span>
          <span className="font-serif text-3xl">Get help</span>
          <span className="text-base text-muted-foreground">Cleaning, errands, company, care</span>
        </Link>

        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-serif text-2xl">My people</h2>
            <Link
              to="/senior/people"
              className="text-base font-semibold text-sage-700 underline-offset-4 hover:underline"
            >
              View all
            </Link>
          </div>
          {regulars.length === 0 ? (
            <EmptyState
              icon={<Users className="size-6" />}
              title="No regulars yet"
              description="Your favorite caregivers will show up here after a few visits."
            />
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {regulars.map((r) => (
                <Link
                  key={r.provider_id}
                  to="/senior/people"
                  className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-card p-5 hover:bg-secondary min-h-32"
                >
                  <span className="grid size-16 place-items-center rounded-2xl bg-sage-100 font-serif text-xl text-sage-700">
                    {initialsOf(r.provider_name)}
                  </span>
                  <span className="text-lg font-semibold">
                    {r.provider_name?.split(" ")[0] ?? "Caregiver"}
                  </span>
                  <span className="mt-1 rounded-full bg-primary px-4 py-1.5 text-sm font-semibold text-primary-foreground">
                    Rebook
                  </span>
                </Link>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-3xl border border-border bg-card p-6">
          <BudgetBar spent={spent} budget={budget} label="This month" />
          <Link
            to="/senior/money"
            className="mt-4 inline-flex text-base font-semibold text-sage-700 underline-offset-4 hover:underline"
          >
            See the details →
          </Link>
        </section>

        <section className="rounded-3xl border-2 border-destructive/30 bg-destructive/5 p-5">
          <div className="flex items-start gap-3">
            <span className="grid size-11 shrink-0 place-items-center rounded-full bg-destructive text-destructive-foreground">
              <AlertTriangle className="size-5" />
            </span>
            <div className="flex-1">
              <p className="font-serif text-lg">Need help right now?</p>
              <p className="mt-0.5 text-sm text-muted-foreground">
                For a medical emergency, call 911. For anything else, send us a message.
              </p>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <a
              href="tel:911"
              className="inline-flex min-h-14 items-center justify-center gap-2 rounded-full bg-destructive text-base font-semibold text-destructive-foreground"
            >
              <Phone className="size-5" /> 911
            </a>
            <Link
              to="/senior/help"
              className="inline-flex min-h-14 items-center justify-center gap-2 rounded-full border border-input bg-card text-base font-semibold"
            >
              <LifeBuoy className="size-5" /> Get help
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}

function QuickAction({
  to,
  icon,
  label,
  badge,
}: {
  to: string;
  icon: React.ReactNode;
  label: string;
  badge?: number;
}) {
  return (
    <Link
      to={to as any}
      className="relative flex min-h-24 flex-col items-center justify-center gap-2 rounded-2xl border border-border bg-card p-3 text-center transition active:scale-[0.98] hover:bg-secondary"
    >
      <span className="grid size-11 place-items-center rounded-full bg-sage-100 text-sage-700">
        {icon}
      </span>
      <span className="text-sm font-semibold">{label}</span>
      {badge && badge > 0 ? (
        <span className="absolute right-2 top-2 inline-flex min-w-5 items-center justify-center rounded-full bg-destructive px-1.5 text-[10px] font-bold leading-none text-destructive-foreground">
          {badge > 99 ? "99+" : badge}
        </span>
      ) : null}
    </Link>
  );
}
