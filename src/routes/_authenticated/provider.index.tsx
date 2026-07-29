import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Calendar, CheckCircle2, Clock, DollarSign, TrendingUp, AlertCircle, GraduationCap, ShieldCheck } from "lucide-react";
import { listProviderJobs } from "@/lib/provider.functions";
import { getProviderEarnings } from "@/lib/provider.functions";
import { listMyVerifications } from "@/lib/provider.functions";
import { getMyTrainingStatus } from "@/lib/provider-training.functions";
import { getMyIdentity } from "@/lib/provider-identity.functions";
import { getMyBackgroundCheck } from "@/lib/background-checks.functions";
import {
  PageSkeleton,
  EmptyState,
  ErrorState,
  RouteErrorBoundary,
} from "@/components/carematch";


export const Route = createFileRoute("/_authenticated/provider/")({
  component: TodayPage,
  errorComponent: RouteErrorBoundary,
});

function fmtMoney(cents: number) {
  return `$${(cents / 100).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}
function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}
function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}
function daysUntil(iso: string) {
  const ms = new Date(iso).getTime() - Date.now();
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
}

function TodayPage() {
  const jobsFn = useServerFn(listProviderJobs);
  const earningsFn = useServerFn(getProviderEarnings);
  const verifsFn = useServerFn(listMyVerifications);
  const trainingFn = useServerFn(getMyTrainingStatus);
  const identityFn = useServerFn(getMyIdentity);
  const bgFn = useServerFn(getMyBackgroundCheck);

  const jobsQ = useQuery({ queryKey: ["provider", "jobs"], queryFn: () => jobsFn() });
  const earningsQ = useQuery({ queryKey: ["provider", "earnings"], queryFn: () => earningsFn() });
  const verifsQ = useQuery({ queryKey: ["provider", "verifications"], queryFn: () => verifsFn() });
  const trainingQ = useQuery({ queryKey: ["provider", "training"], queryFn: () => trainingFn() });
  const identityQ = useQuery({ queryKey: ["provider", "identity"], queryFn: () => identityFn() });
  const bgQ = useQuery({ queryKey: ["provider", "bg-check"], queryFn: () => bgFn() });


  if (jobsQ.isPending || earningsQ.isPending) {
    return <PageSkeleton title="today" cards={3} />;
  }
  if (jobsQ.isError) {
    return <ErrorState error={jobsQ.error} onRetry={() => jobsQ.refetch()} />;
  }

  const jobs = jobsQ.data ?? [];
  const earnings = earningsQ.data;

  const today = new Date();
  const todaysShifts = jobs
    .filter((j) => isSameDay(new Date(j.scheduled_at), today) && j.status !== "cancelled")
    .sort((a, b) => a.scheduled_at.localeCompare(b.scheduled_at));

  const nextShift = jobs
    .filter((j) => new Date(j.scheduled_at).getTime() > Date.now() && (j.status === "confirmed" || j.status === "in_progress"))
    .sort((a, b) => a.scheduled_at.localeCompare(b.scheduled_at))[0];

  const pendingRequests = jobs.filter((j) => j.status === "requested").slice(0, 3);

  const expiringVerif = (verifsQ.data ?? []).find((v) => {
    if (!v.expires_on) return false;
    const d = daysUntil(v.expires_on);
    return d > 0 && d <= 30;
  });

  const todayExpected = todaysShifts.reduce(
    (sum, j) => sum + Math.round((j.hourly_rate_cents * j.duration_minutes) / 60),
    0,
  );
  const now = today.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });

  const bonusMap = new Map<string, { name: string; count: number }>();
  const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
  for (const j of jobs) {
    if (j.status !== "completed") continue;
    if (new Date(j.scheduled_at).getTime() < cutoff) continue;
    const name = j.senior_name ?? "Senior";
    bonusMap.set(j.senior_id, { name, count: (bonusMap.get(j.senior_id)?.count ?? 0) + 1 });
  }
  const nearBonus = [...bonusMap.values()].filter((b) => b.count >= 1 && b.count < 4).sort((a, b) => b.count - a.count)[0];

  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs uppercase tracking-widest text-muted-foreground">Today</p>
        <div className="flex items-center gap-3">
          <h1 className="font-serif text-2xl lg:text-3xl">Good morning</h1>
          {trainingQ.data && <VerificationBadge state={trainingQ.data.verification_state} />}
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          {now} · {todaysShifts.length} {todaysShifts.length === 1 ? "shift" : "shifts"} scheduled
          {todayExpected > 0 ? ` · ${fmtMoney(todayExpected)} expected` : ""}
        </p>
      </header>

      {nextShift && <NextShiftHero shift={nextShift} />}

      {nearBonus && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4">
          <p className="text-sm">
            <span className="font-semibold">Consistency bonus:</span> {nearBonus.count} of 4 completed visits
            with {nearBonus.name} in the last 30 days. Complete {4 - nearBonus.count} more to earn a{" "}
            <span className="font-semibold">$25 bonus</span>.
          </p>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-emerald-500/10">
            <div className="h-full rounded-full bg-emerald-500" style={{ width: `${(nearBonus.count / 4) * 100}%` }} />
          </div>
        </div>
      )}


      {identityQ.data && !identityQ.data.identity.identity_completed_at && (
        <div className="rounded-xl border border-primary/40 bg-primary/5 p-4">
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-0.5 size-5 text-primary" />
            <div className="flex-1 text-sm">
              <p className="font-semibold">Complete identity verification</p>
              <p className="mt-0.5 text-muted-foreground">
                About 8 minutes: photo of your ID, a selfie, and the required background check disclosures. You'll be
                blocked from accepting jobs until this is done.
              </p>
              <Link
                to="/onboarding/provider/identity"
                className="mt-2 inline-flex rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
              >
                Start verification
              </Link>
            </div>
          </div>
        </div>
      )}

      {bgQ.data && !bgQ.data.idv_verified && (
        <div className="rounded-xl border border-primary/40 bg-primary/5 p-4">
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-0.5 size-5 text-primary" />
            <div className="flex-1 text-sm">
              <p className="font-semibold">Verify your identity digitally</p>
              <p className="mt-0.5 text-muted-foreground">
                Scan your ID and take a quick liveness selfie. Takes about 90 seconds on your phone. Required before
                we can run a background check.
              </p>
              <Link
                to="/provider/identity-verification"
                className="mt-2 inline-flex rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
              >
                Start ID verification
              </Link>
            </div>
          </div>
        </div>
      )}

      {bgQ.data?.identity_ready && !bgQ.data.row && (
        <div className="rounded-xl border border-primary/40 bg-primary/5 p-4">
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-0.5 size-5 text-primary" />
            <div className="flex-1 text-sm">
              <p className="font-semibold">Start your background check</p>
              <p className="mt-0.5 text-muted-foreground">
                {bgQ.data.tier_label} package · est. ${((bgQ.data.estimated_cost_cents ?? 0) / 100).toFixed(2)}. Takes about 3 minutes;
                results in 1–3 business days.
              </p>
              <Link
                to="/provider/background-check"
                className="mt-2 inline-flex rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
              >
                Start background check
              </Link>
            </div>
          </div>
        </div>
      )}

      {bgQ.data?.row && bgQ.data.row.status !== "clear" && bgQ.data.row.status !== "canceled" && (
        <div className="rounded-xl border border-primary/40 bg-primary/5 p-4">
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-0.5 size-5 text-primary" />
            <div className="flex-1 text-sm">
              <p className="font-semibold">Background check in progress</p>
              <p className="mt-0.5 text-muted-foreground capitalize">
                Status: {bgQ.data.row.status.replace(/_/g, " ")}. Usually 1–3 business days.
              </p>
              <Link to="/provider/background-check" className="mt-2 inline-flex text-xs font-semibold text-primary">
                View status →
              </Link>
            </div>
          </div>
        </div>
      )}


      {trainingQ.data && !trainingQ.data.modules.find((m) => m.code === "companion_basics_v1")?.completion?.passed && (
        <div className="rounded-xl border border-primary/40 bg-primary/5 p-4">
          <div className="flex items-start gap-3">
            <GraduationCap className="mt-0.5 size-5 text-primary" />
            <div className="flex-1 text-sm">
              <p className="font-semibold">Finish Companion Basics to accept your first job</p>
              <p className="mt-0.5 text-muted-foreground">
                Five short lessons + a 7-question check. Takes about 15 minutes. You'll be blocked from accepting requests until you pass.
              </p>
              <Link
                to="/onboarding/provider/basics-course"
                className="mt-2 inline-flex rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
              >
                Start now
              </Link>
            </div>
          </div>
        </div>
      )}


      {expiringVerif && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 size-5 text-amber-700" />
            <div className="flex-1 text-sm">
              <p className="font-semibold text-amber-900">
                Renew {expiringVerif.kind.replace(/_/g, " ")}
              </p>
              <p className="mt-0.5 text-amber-800">
                Expires in {daysUntil(expiringVerif.expires_on!)} days. Upload the renewal to keep your tier.
              </p>
              <Link to="/provider/profile" className="mt-2 inline-flex text-xs font-semibold text-amber-900 underline">
                Go to profile →
              </Link>
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-4">
        <Stat
          icon={DollarSign}
          label="This week"
          value={earnings ? fmtMoney(earnings.this_week.gross_cents) : "—"}
          hint={earnings ? `${earnings.this_week.bookings} bookings` : ""}
        />
        <Stat
          icon={Clock}
          label="Hours booked"
          value={earnings ? `${Math.round(earnings.this_week.hours)}h` : "—"}
          hint="this week"
        />
        <Stat
          icon={TrendingUp}
          label="Month to date"
          value={earnings ? fmtMoney(earnings.month_to_date.gross_cents) : "—"}
          hint={earnings ? `${earnings.month_to_date.bookings} bookings` : ""}
        />
        <Stat
          icon={Calendar}
          label="Year to date"
          value={earnings ? fmtMoney(earnings.year_to_date.gross_cents) : "—"}
          hint="gross"
        />
      </div>

      <section>
        <h2 className="mb-2 text-sm font-bold uppercase tracking-widest text-muted-foreground">Today's shifts</h2>
        {todaysShifts.length === 0 ? (
          <EmptyState
            icon={<Calendar className="size-6" />}
            title="No shifts today"
            description="Head to the jobs board to pick up new requests."
            action={
              <Link
                to="/provider/jobs"
                className="inline-flex rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
              >
                Browse jobs
              </Link>
            }
          />
        ) : (
          <div className="space-y-3">
            {todaysShifts.map((s) => (
              <ShiftCard
                key={s.id}
                time={`${fmtTime(s.scheduled_at)} · ${s.duration_minutes} min`}
                senior={s.senior_name ?? "Senior"}
                service={s.service_type}
                city={s.senior_city ?? ""}
                pay={fmtMoney(Math.round((s.hourly_rate_cents * s.duration_minutes) / 60))}
              />
            ))}
          </div>
        )}
      </section>

      <section>
        <div className="mb-2 flex items-baseline justify-between">
          <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
            New requests {pendingRequests.length > 0 ? `(${pendingRequests.length})` : ""}
          </h2>
          <Link to="/provider/jobs" className="text-xs font-semibold text-primary">See all →</Link>
        </div>
        {pendingRequests.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-card p-6 text-center text-sm text-muted-foreground">
            No new requests. Keep your profile up to date to get matched.
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-3">
            {pendingRequests.map((r) => (
              <RequestPreview
                key={r.id}
                family={r.senior_name ?? "Senior"}
                service={`${r.service_type} · ${new Date(r.scheduled_at).toLocaleDateString(undefined, {
                  weekday: "short",
                  hour: "numeric",
                })}`}
                pay={`$${(r.hourly_rate_cents / 100).toFixed(0)}/hr`}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function VerificationBadge({ state }: { state: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    pending: { label: "Not verified yet", cls: "border-border bg-muted text-muted-foreground" },
    provisional: { label: "Provisional", cls: "border-amber-500/40 bg-amber-500/10 text-amber-900" },
    verified: { label: "Verified caregiver", cls: "border-emerald-500/40 bg-emerald-500/10 text-emerald-900" },
    suspended: { label: "Suspended", cls: "border-red-500/40 bg-red-500/10 text-red-900" },
  };
  const b = map[state] ?? map.pending;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${b.cls}`}>
      <ShieldCheck className="size-3" /> {b.label}
    </span>
  );
}


function Stat({ icon: Icon, label, value, hint }: { icon: typeof Clock; label: string; value: string; hint: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <p className="flex items-center gap-1.5 text-xs uppercase tracking-widest text-muted-foreground">
        <Icon className="size-3.5" /> {label}
      </p>
      <p className="mt-1 font-serif text-2xl">{value}</p>
      <p className="text-xs text-muted-foreground">{hint}</p>
    </div>
  );
}

function ShiftCard(p: { time: string; senior: string; service: string; city: string; pay: string }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card p-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{p.time}</p>
        <p className="mt-0.5 font-serif text-lg">
          {p.senior} · {p.service}
        </p>
        {p.city && <p className="text-sm text-muted-foreground">{p.city}</p>}
      </div>
      <div className="text-right">
        <p className="font-serif text-xl">{p.pay}</p>
        <Link
          to="/provider/schedule"
          className="mt-1 inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
        >
          <CheckCircle2 className="size-3.5" /> View
        </Link>
      </div>
    </div>
  );
}

function RequestPreview({ family, service, pay }: { family: string; service: string; pay: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-3">
      <p className="text-sm font-semibold">{family}</p>
      <p className="mt-0.5 text-xs text-muted-foreground">{service}</p>
      <p className="mt-1 text-xs font-semibold text-primary">{pay}</p>
    </div>
  );
}

function NextShiftHero({ shift }: { shift: { id: string; scheduled_at: string; senior_name: string | null; senior_city: string | null; service_type: string; duration_minutes: number; hourly_rate_cents: number } }) {
  const ms = new Date(shift.scheduled_at).getTime() - Date.now();
  const hours = Math.floor(ms / (1000 * 60 * 60));
  const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
  const countdown = hours >= 24 ? `${Math.round(hours / 24)}d ${hours % 24}h` : hours >= 1 ? `${hours}h ${minutes}m` : `${minutes}m`;
  const pay = Math.round((shift.hourly_rate_cents * shift.duration_minutes) / 60);
  const mapsQuery = encodeURIComponent(shift.senior_city ?? "");
  return (
    <section className="rounded-2xl border border-primary/30 bg-primary/5 p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-widest text-primary">Next shift in {countdown}</p>
          <h2 className="mt-1 font-serif text-2xl">
            {shift.senior_name ?? "Senior"} · {shift.service_type}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {new Date(shift.scheduled_at).toLocaleString(undefined, { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
            {shift.senior_city ? ` · ${shift.senior_city}` : ""} · {shift.duration_minutes} min
          </p>
        </div>
        <div className="text-right">
          <p className="font-serif text-2xl">${(pay / 100).toFixed(0)}</p>
          <p className="text-xs text-muted-foreground">expected</p>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <Link
          to="/provider/visits/$id"
          params={{ id: shift.id }}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
        >
          Open visit
        </Link>
        {mapsQuery && (
          <a
            href={`https://maps.google.com/?q=${mapsQuery}`}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg border border-input bg-background px-4 py-2 text-sm font-semibold hover:bg-secondary"
          >
            Directions
          </a>
        )}
      </div>
    </section>
  );
}
