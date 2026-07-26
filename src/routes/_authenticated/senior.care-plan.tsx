import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  Clock,
  User2,
  CalendarDays,
  Printer,
  Heart,
  Pill,
  Home,
  Coffee,
  Ban,
  Info,
  Plus,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { PageSkeleton, EmptyState, ErrorState, RouteErrorBoundary } from "@/components/carematch";
import { listMyVisits } from "@/lib/bookings.functions";
import { supabase } from "@/integrations/supabase/client";
import { appendCareNote, parseCareNotes } from "@/lib/care-notes";

export const Route = createFileRoute("/_authenticated/senior/care-plan")({
  component: SeniorCarePlan,
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

function SeniorCarePlan() {
  const fetchVisits = useServerFn(listMyVisits);
  const qc = useQueryClient();

  const profileQ = useQuery({
    queryKey: ["senior", "care-plan-fields"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return null;
      const { data } = await supabase
        .from("profiles")
        .select(
          "id, full_name, city, care_medical_notes, care_home_notes, care_no_go_notes, care_notes",
        )
        .eq("id", u.user.id)
        .maybeSingle();
      return data;
    },
  });

  const visitsQ = useQuery({
    queryKey: ["senior", "visits"],
    queryFn: () => fetchVisits(),
  });

  const weekStart = useMemo(() => startOfWeek(new Date()), []);
  const weekEnd = useMemo(() => addDays(weekStart, 7), [weekStart]);

  if (visitsQ.isPending) return <PageSkeleton title="my care plan" cards={4} />;
  if (visitsQ.isError)
    return (
      <ErrorState
        title="We couldn't load your care plan"
        error={visitsQ.error}
        onRetry={() => visitsQ.refetch()}
      />
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

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-widest text-muted-foreground">
          Your plan, your words
        </p>
        <h1 className="mt-1 font-serif text-3xl">My care plan</h1>
        <p className="mt-2 text-base text-muted-foreground">
          What you want help with, how you like it done, and this week's visits. Caregivers see this
          before every visit.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2 print:hidden">
        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex min-h-11 items-center gap-2 rounded-full border border-border px-4 text-sm font-semibold hover:bg-secondary"
        >
          <Printer className="size-4" />
          Print care card
        </button>
      </div>

      <div className="grid gap-4">
        <Section icon={<Heart className="size-5 text-primary" />} title="About me">
          <Field label="Name" value={profileQ.data?.full_name ?? "—"} />
          <Field label="Lives in" value={profileQ.data?.city ?? "—"} />
          <Placeholder>
            Update your name, city, and preferred name in{" "}
            <Link to="/senior/profile" className="underline">
              your profile
            </Link>
            .
          </Placeholder>
        </Section>

        <Section icon={<Pill className="size-5 text-primary" />} title="Medical">
          <EditableNote
            userId={profileQ.data?.id}
            column="care_medical_notes"
            initial={profileQ.data?.care_medical_notes ?? ""}
            placeholder="Conditions, allergies, and medications you want caregivers to know about."
            onSaved={() => qc.invalidateQueries({ queryKey: ["senior", "care-plan-fields"] })}
          />
        </Section>

        <Section icon={<Home className="size-5 text-primary" />} title="At home">
          <EditableNote
            userId={profileQ.data?.id}
            column="care_home_notes"
            initial={profileQ.data?.care_home_notes ?? ""}
            placeholder="How to get in, pets, stairs, and anything about your home a caregiver should know before they arrive."
            onSaved={() => qc.invalidateQueries({ queryKey: ["senior", "care-plan-fields"] })}
          />
        </Section>

        <Section icon={<Coffee className="size-5 text-primary" />} title="How I like things">
          {services.length > 0 ? (
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                What you've been booking
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
            <Placeholder>Routines, meals, TV shows, and comfort notes go here.</Placeholder>
          )}
        </Section>

        <Section icon={<Ban className="size-5 text-destructive" />} title="Please don't">
          <EditableNote
            userId={profileQ.data?.id}
            column="care_no_go_notes"
            initial={profileQ.data?.care_no_go_notes ?? ""}
            placeholder="Hard limits. Anything a caregiver should never do or bring up. Caregivers always see this."
            onSaved={() => qc.invalidateQueries({ queryKey: ["senior", "care-plan-fields"] })}
          />
        </Section>

        <Section icon={<Info className="size-5 text-primary" />} title="Notes for family">
          <NotesLedger
            userId={profileQ.data?.id}
            raw={profileQ.data?.care_notes ?? null}
            onSaved={() => qc.invalidateQueries({ queryKey: ["senior", "care-plan-fields"] })}
          />
        </Section>
      </div>

      <section className="surface-card overflow-hidden">
        <div className="flex items-center justify-between border-b border-border p-5">
          <div>
            <h2 className="font-serif text-2xl">This week</h2>
            <p className="text-sm text-muted-foreground">
              {week.length} visit{week.length === 1 ? "" : "s"} planned · {fmtMoney(totalCents)}
            </p>
          </div>
          <Link
            to="/senior/visits"
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
              description="Book a visit when you're ready."
            />
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {week.map((v) => {
              const at = new Date(v.scheduled_at);
              const pay = Math.round((v.hourly_rate_cents * v.duration_minutes) / 60);
              return (
                <li key={v.id} className="grid grid-cols-[64px_1fr_auto] items-center gap-4 p-5">
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
    </div>
  );
}

function Section({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="surface-card p-5">
      <div className="flex items-start gap-3">
        <div className="mt-1">{icon}</div>
        <div className="min-w-0 flex-1">
          <h2 className="font-serif text-xl">{title}</h2>
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

const CARE_PLAN_COLUMNS = ["care_medical_notes", "care_home_notes", "care_no_go_notes"] as const;
type CarePlanColumn = (typeof CARE_PLAN_COLUMNS)[number];

function EditableNote({
  userId,
  column,
  initial,
  placeholder,
  onSaved,
}: {
  userId: string | undefined;
  column: CarePlanColumn;
  initial: string;
  placeholder: string;
  onSaved: () => void;
}) {
  const [value, setValue] = useState(initial);
  const [saving, setSaving] = useState(false);
  const savedRef = useRef(initial);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    savedRef.current = initial;
    setValue(initial);
  }, [initial]);

  const schedule = (next: string) => {
    setValue(next);
    if (timer.current) clearTimeout(timer.current);
    if (!userId) return;
    timer.current = setTimeout(async () => {
      if (savedRef.current === next) return;
      setSaving(true);
      const value = next.trim() || null;
      const { error } =
        column === "care_medical_notes"
          ? await supabase.from("profiles").update({ care_medical_notes: value }).eq("id", userId)
          : column === "care_home_notes"
            ? await supabase.from("profiles").update({ care_home_notes: value }).eq("id", userId)
            : await supabase.from("profiles").update({ care_no_go_notes: value }).eq("id", userId);
      setSaving(false);
      if (error) {
        toast.error("Couldn't save — try again.");
        return;
      }
      savedRef.current = next;
      onSaved();
    }, 700);
  };

  useEffect(() => {
    const t = timer.current;
    return () => {
      if (t) clearTimeout(t);
    };
  }, []);

  return (
    <div className="space-y-1.5">
      <textarea
        value={value}
        onChange={(e) => schedule(e.target.value)}
        placeholder={placeholder}
        rows={3}
        maxLength={2000}
        className="w-full rounded-xl border border-input bg-background p-3 text-sm"
      />
      {saving && (
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Loader2 className="size-3 animate-spin" /> Saving…
        </p>
      )}
    </div>
  );
}

function NotesLedger({
  userId,
  raw,
  onSaved,
}: {
  userId: string | undefined;
  raw: string | null;
  onSaved: () => void;
}) {
  const entries = useMemo(() => parseCareNotes(raw), [raw]);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!userId || !draft.trim()) return;
    setBusy(true);
    const next = appendCareNote(raw, draft);
    const { error } = await supabase.from("profiles").update({ care_notes: next }).eq("id", userId);
    setBusy(false);
    if (error) {
      toast.error("Couldn't save note — try again.");
      return;
    }
    setDraft("");
    setAdding(false);
    onSaved();
  };

  return (
    <div className="space-y-3">
      {entries.length === 0 ? (
        <Placeholder>
          Things you want your family to see but not caregivers. Private to you and anyone you've
          linked.
        </Placeholder>
      ) : (
        <ul className="space-y-2">
          {entries.map((e, i) => (
            <li key={i} className="rounded-xl border border-border/60 bg-secondary/30 p-3">
              {e.date && (
                <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                  {e.date}
                </p>
              )}
              <p className="mt-0.5 whitespace-pre-wrap">{e.text}</p>
            </li>
          ))}
        </ul>
      )}

      {adding ? (
        <div className="space-y-2">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={2}
            maxLength={1000}
            placeholder="e.g. Grandkids visiting Saturday, might want extra tidy-up."
            className="w-full rounded-xl border border-input bg-background p-3 text-sm"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={submit}
              disabled={busy || !draft.trim()}
              className="inline-flex min-h-9 items-center gap-1.5 rounded-full bg-primary px-4 text-xs font-semibold text-primary-foreground disabled:opacity-50"
            >
              {busy ? <Loader2 className="size-3.5 animate-spin" /> : null}
              Add note
            </button>
            <button
              type="button"
              onClick={() => {
                setAdding(false);
                setDraft("");
              }}
              className="inline-flex min-h-9 items-center rounded-full border border-input px-4 text-xs font-semibold hover:bg-secondary"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-input px-4 text-xs font-semibold hover:bg-secondary"
        >
          <Plus className="size-3.5" /> Add a note
        </button>
      )}
    </div>
  );
}
