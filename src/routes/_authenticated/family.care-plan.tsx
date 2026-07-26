import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  Clock,
  User2,
  HandHeart,
  UserPlus,
  CalendarDays,
  Eye,
  Printer,
  Heart,
  Pill,
  Home,
  Coffee,
  Ban,
  Info,
} from "lucide-react";
import {
  PageSkeleton,
  EmptyState,
  ErrorState,
  RouteErrorBoundary,
  PermissionBanner,
  RequestChangeDialog,
} from "@/components/carematch";
import { getSeniorEditPermission, listMyLinkedSeniors, listVisitsForSenior } from "@/lib/family.functions";

export const Route = createFileRoute("/_authenticated/family/care-plan")({
  component: FamilyCarePlan,
  errorComponent: RouteErrorBoundary,
});

function startOfWeek(d: Date): Date {
  const out = new Date(d);
  out.setHours(0, 0, 0, 0);
  out.setDate(out.getDate() - ((out.getDay() + 6) % 7));
  return out;
}
function addDays(d: Date, n: number) {
  const out = new Date(d);
  out.setDate(out.getDate() + n);
  return out;
}
function fmtMoney(cents: number) {
  return `$${(cents / 100).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

function FamilyCarePlan() {
  const fetchLinks = useServerFn(listMyLinkedSeniors);
  const fetchVisits = useServerFn(listVisitsForSenior);
  const fetchPerm = useServerFn(getSeniorEditPermission);

  const linksQ = useQuery({ queryKey: ["family", "links"], queryFn: () => fetchLinks() });
  const primary = linksQ.data?.[0];
  const visitsQ = useQuery({
    queryKey: ["family", "visits", primary?.senior_id ?? ""],
    enabled: !!primary,
    queryFn: () => fetchVisits({ data: { senior_id: primary!.senior_id } }),
  });
  const permQ = useQuery({
    queryKey: ["family", "senior-perm", primary?.senior_id ?? ""],
    enabled: !!primary,
    queryFn: () => fetchPerm({ data: { senior_id: primary!.senior_id } }),
  });

  const weekStart = useMemo(() => startOfWeek(new Date()), []);
  const weekEnd = useMemo(() => addDays(weekStart, 7), [weekStart]);

  const [caregiverPreview, setCaregiverPreview] = useState(false);
  const [askNote, setAskNote] = useState(false);
  const [noteDraft, setNoteDraft] = useState("");

  if (linksQ.isPending) return <PageSkeleton title="care plan" cards={4} />;
  if (linksQ.isError)
    return (
      <ErrorState
        title="We couldn't load the care plan"
        error={linksQ.error}
        onRetry={() => linksQ.refetch()}
      />
    );

  if (!primary) {
    return (
      <div className="space-y-6">
        <Header />
        <EmptyState
          icon={<UserPlus className="size-6" />}
          title="No linked senior"
          description="Once you're linked to a senior, their care plan will appear here."
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

  if (visitsQ.isPending)
    return (
      <div className="space-y-6">
        <Header />
        <PageSkeleton cards={3} />
      </div>
    );
  if (visitsQ.isError)
    return (
      <div className="space-y-6">
        <Header />
        <ErrorState
          title="We couldn't load visits"
          error={visitsQ.error}
          onRetry={() => visitsQ.refetch()}
        />
      </div>
    );

  const rows = visitsQ.data ?? [];
  const week = rows
    .filter((v) => {
      const at = new Date(v.scheduled_at);
      return at >= weekStart && at < weekEnd && v.status !== "cancelled";
    })
    .sort((a, b) => a.scheduled_at.localeCompare(b.scheduled_at));

  const totalCents = week.reduce(
    (s, v) => s + Math.round((v.hourly_rate_cents * v.duration_minutes) / 60),
    0,
  );

  const services = Array.from(new Set(rows.map((r) => r.service_type))).slice(0, 6);

  const canEdit = permQ.data?.can_edit ?? false;

  return (
    <div className="space-y-8">
      <Header seniorName={primary.full_name} />

      {!permQ.isPending && !canEdit && (
        <PermissionBanner seniorName={primary.full_name} action="edit the care plan" />
      )}


      {/* Mode + print toolbar */}
      <div className="flex flex-wrap items-center gap-2 print:hidden">
        <button
          type="button"
          onClick={() => setCaregiverPreview((v) => !v)}
          className={`inline-flex min-h-10 items-center gap-2 rounded-full border px-4 text-sm font-semibold transition ${
            caregiverPreview
              ? "border-primary bg-primary/10 text-primary"
              : "border-border hover:border-primary/40"
          }`}
        >
          <Eye className="size-4" />
          {caregiverPreview ? "Caregiver preview on" : "Preview as caregiver"}
        </button>
        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex min-h-10 items-center gap-2 rounded-full border border-border px-4 text-sm font-semibold hover:bg-secondary"
        >
          <Printer className="size-4" />
          Print care card
        </button>
        <button
          type="button"
          onClick={() => setAskNote(true)}
          className="inline-flex min-h-10 items-center gap-2 rounded-full border border-primary/40 px-4 text-sm font-semibold text-primary hover:bg-primary/10"
        >
          <Info className="size-4" />
          Suggest a note
        </button>
        {caregiverPreview && (
          <p className="text-xs text-muted-foreground">
            Family-only notes are hidden in this view.
          </p>
        )}
      </div>

      {/* Structured sections */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Section
          icon={<Heart className="size-5 text-primary" />}
          title="About"
          hint="Who they are, day-to-day"
        >
          <Field label="Name" value={primary.full_name ?? "—"} />
          <Field label="Lives in" value={primary.city ?? "—"} />
          <Placeholder>
            Add pronouns, preferred name, and a short bio in{" "}
            <Link to="/family/settings" className="underline">
              settings
            </Link>
            .
          </Placeholder>
        </Section>

        <Section
          icon={<Pill className="size-5 text-primary" />}
          title="Medical"
          hint="What caregivers should know"
          hiddenInPreview={false}
        >
          <Placeholder>
            Conditions, allergies, and medications will appear here once added.
            Caregivers see this section on every visit.
          </Placeholder>
        </Section>

        <Section
          icon={<Home className="size-5 text-primary" />}
          title="Home"
          hint="Getting in and around"
        >
          <Placeholder>
            Entry instructions, pets, stairs, and accessibility notes go here.
          </Placeholder>
        </Section>

        <Section
          icon={<Coffee className="size-5 text-primary" />}
          title="Care preferences"
          hint="How they like things done"
        >
          {services.length > 0 ? (
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                Frequent services
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {services.map((s) => (
                  <span
                    key={s}
                    className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>
          ) : (
            <Placeholder>Routines, meals, and comfort notes go here.</Placeholder>
          )}
        </Section>

        <Section
          icon={<Ban className="size-5 text-destructive" />}
          title="No-go"
          hint="Hard limits — never override"
        >
          <Placeholder>
            Boundaries the caregiver must respect. This section is always visible
            to caregivers.
          </Placeholder>
        </Section>

        {!caregiverPreview && (
          <Section
            icon={<Info className="size-5 text-primary" />}
            title="Family notes"
            hint="Only family and the senior see this"
          >
            <Placeholder>
              Private context for family members. Hidden from caregivers.
            </Placeholder>
          </Section>
        )}
      </div>

      <section className="surface-card overflow-hidden">
        <div className="flex items-center justify-between border-b border-border p-5">
          <div>
            <h2 className="font-serif text-2xl">This week</h2>
            <p className="text-sm text-muted-foreground">
              {week.length} visit{week.length === 1 ? "" : "s"} planned ·{" "}
              {fmtMoney(totalCents)}
            </p>
          </div>
          <Link
            to="/family/visits"
            className="rounded-full border border-border px-4 py-2 text-sm font-semibold hover:bg-secondary"
          >
            All visits
          </Link>
        </div>
        {week.length === 0 ? (
          <div className="p-5">
            <EmptyState
              icon={<CalendarDays className="size-6" />}
              title="Nothing scheduled this week"
              description={`${primary.full_name ?? "Your senior"} has no visits scheduled Mon–Sun.`}
            />
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {week.map((v) => {
              const at = new Date(v.scheduled_at);
              const pay = Math.round((v.hourly_rate_cents * v.duration_minutes) / 60);
              return (
                <li
                  key={v.id}
                  className="grid grid-cols-[64px_1fr_auto] items-center gap-4 p-5"
                >
                  <div className="text-center">
                    <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                      {at.toLocaleDateString(undefined, { weekday: "short" })}
                    </p>
                    <Clock className="mx-auto mt-1 size-4 text-muted-foreground" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium">{v.service_type}</p>
                    <p className="text-sm text-muted-foreground">
                      <User2 className="mr-1 inline size-3.5" />
                      {v.provider_name ?? "Caregiver"} ·{" "}
                      {at.toLocaleTimeString(undefined, {
                        hour: "numeric",
                        minute: "2-digit",
                      })}{" "}
                      · {Math.round(v.duration_minutes / 60)}h
                    </p>
                  </div>
                  <p className="font-serif text-lg">{fmtMoney(pay)}</p>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="surface-card p-5 lg:p-6">
        <div className="flex items-start gap-3">
          <HandHeart className="mt-1 size-6 text-primary" />
          <div>
            <h2 className="font-serif text-2xl">Funding navigator</h2>
            <p className="text-sm text-muted-foreground">
              Programs like VA Aid &amp; Attendance and Medicaid HCBS waivers may help
              cover care. A screener will land here soon.
            </p>
          </div>
        </div>
      </section>

      <RequestChangeDialog
        open={askNote}
        onOpenChange={(v) => {
          setAskNote(v);
          if (!v) setNoteDraft("");
        }}
        seniorId={primary.senior_id}
        seniorName={primary.full_name}
        kind="care_note"
        title="Suggest a care-plan note"
        summary={
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-widest text-muted-foreground">
              Proposed note
            </p>
            <textarea
              value={noteDraft}
              onChange={(e) => setNoteDraft(e.target.value)}
              rows={3}
              maxLength={1000}
              placeholder="e.g. Prefers tea, not coffee, in the morning."
              className="w-full rounded-xl border border-input bg-background p-3 text-sm"
            />
            <p className="text-[11px] text-muted-foreground">
              Approved notes are appended, dated, to the care plan.
            </p>
          </div>
        }
        payload={{ note: noteDraft }}
      />
    </div>
  );
}

function Header({ seniorName }: { seniorName?: string | null }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-widest text-muted-foreground">
        The shared artifact
      </p>
      <h1 className="mt-1 font-serif text-3xl lg:text-4xl">Care plan</h1>
      {seniorName && (
        <p className="mt-2 max-w-xl text-sm text-muted-foreground">
          Everyone linked to {seniorName} sees the same weekly plan.
        </p>
      )}
    </div>
  );
}

function Section({
  icon,
  title,
  hint,
  children,
  hiddenInPreview,
}: {
  icon: React.ReactNode;
  title: string;
  hint?: string;
  children: React.ReactNode;
  hiddenInPreview?: boolean;
}) {
  return (
    <section className="surface-card p-5">
      <div className="flex items-start gap-3">
        <div className="mt-1">{icon}</div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-serif text-xl">{title}</h2>
            {hiddenInPreview && (
              <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Family only
              </span>
            )}
          </div>
          {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
          <div className="mt-3 space-y-2 text-sm">{children}</div>
        </div>
      </div>
    </section>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-dashed border-border/60 py-1.5 last:border-0">
      <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
        {label}
      </span>
      <span className="text-right font-medium">{value}</span>
    </div>
  );
}

function Placeholder({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-xl border border-dashed border-border/60 bg-secondary/30 p-3 text-sm text-muted-foreground">
      {children}
    </p>
  );
}
