import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Home,
  Car,
  Coffee,
  HeartHandshake,
  Pill,
  HelpCircle,
  Sunrise,
  Sun,
  Moon,
} from "lucide-react";
import { toast } from "sonner";
import {
  MatchCard,
  VoiceInput,
  CallButton,
  PageSkeleton,
  EmptyState,
  ErrorState,
  RouteErrorBoundary,
} from "@/components/carematch";
import type { MatchCardData } from "@/components/carematch";
import {
  matchProviders,
  createBooking,
  requestProviderNotification,
  listMyVisits,
  type MatchedProvider,
} from "@/lib/bookings.functions";
import { RotateCw } from "lucide-react";


export const Route = createFileRoute("/_authenticated/senior/book")({
  component: BookFlow,
  errorComponent: RouteErrorBoundary,
});

type Step = "need" | "when" | "notes" | "budget" | "match" | "confirm";
const STEPS: Step[] = ["need", "when", "notes", "budget", "match"];

function initialsOf(name: string) {
  return name
    .split(" ")
    .map((s) => s[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function toMatchCard(p: MatchedProvider): MatchCardData {
  const hourly = Math.round(p.hourly_rate_cents / 100);
  return {
    id: p.id,
    name: p.name,
    headline: p.headline ?? "CareMatch provider",
    initials: initialsOf(p.name),
    monthlyPlan: hourly * 20, // ~5h/wk estimate; provider sets their own rate
    hourlyRate: hourly,
    rating: p.rating_avg,
    ratingCount: p.rating_count,
    serviceArea: p.service_area,
    verificationState: p.verification_state as MatchCardData["verificationState"],
    whyMatch: [
      ...(p.specialties.length > 0 ? [p.specialties.slice(0, 3).join(" · ")] : []),
      ...(p.languages.length > 0 ? [`Speaks ${p.languages.join(", ")}`] : []),
      ...(p.years_experience ? [`${p.years_experience}+ yrs experience`] : []),
    ].filter(Boolean),
    tier: (p.tier === "gold" ? "Gold" : p.tier === "silver" ? "Silver" : "Bronze") as
      | "Gold"
      | "Silver"
      | "Bronze",
  };
}

const NEED_OPTIONS = [
  { id: "house", label: "Help around the house", icon: Home, min_tier: 0 },
  { id: "rides", label: "Rides & errands", icon: Car, min_tier: 0 },
  { id: "company", label: "Company & conversation", icon: Coffee, min_tier: 0 },
  { id: "personal", label: "Personal care", icon: HeartHandshake, min_tier: 1 },
  { id: "meds", label: "Medications", icon: Pill, min_tier: 3 },
  { id: "other", label: "Something else", icon: HelpCircle, min_tier: 0 },
];

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const TIME_SLOTS = [
  { id: "morning", label: "Morning", helper: "8–12", icon: Sunrise },
  { id: "afternoon", label: "Afternoon", helper: "12–5", icon: Sun },
  { id: "evening", label: "Evening", helper: "5–9", icon: Moon },
];

const TAG_OPTIONS = [
  "Has a dog",
  "No stairs",
  "Speaks Spanish",
  "Uses a walker",
  "Non-smoker only",
  "Loves gardening",
  "Prefers women",
  "Prefers men",
];

const BUDGET_STOPS = [800, 1200, 1600, 2000, 2500];

const DURATIONS = [
  { minutes: 60, label: "1 hr" },
  { minutes: 120, label: "2 hrs" },
  { minutes: 180, label: "3 hrs" },
  { minutes: 240, label: "4 hrs" },
];

// Find the ID of a NEED_OPTIONS entry that best matches a past service_type string.
function needIdFromServiceType(serviceType: string | null | undefined): string | null {
  if (!serviceType) return null;
  const match = NEED_OPTIONS.find((o) => o.label.toLowerCase() === serviceType.toLowerCase());
  return match?.id ?? "other";
}


function BookFlow() {
  const navigate = useNavigate();
  const fetchMatches = useServerFn(matchProviders);
  const bookFn = useServerFn(createBooking);
  const notifyFn = useServerFn(requestProviderNotification);
  const fetchVisits = useServerFn(listMyVisits);

  const [step, setStep] = useState<Step>("need");
  const [need, setNeed] = useState<string | null>(null);
  const [days, setDays] = useState<string[]>([]);
  const [slot, setSlot] = useState<string | null>(null);
  const [recurring, setRecurring] = useState(false);
  const [duration, setDuration] = useState<number>(120);
  const [tags, setTags] = useState<string[]>([]);
  const [note, setNote] = useState("");
  const [budget, setBudget] = useState<number>(1200);
  const [notSure, setNotSure] = useState(false);
  const [matchIndex, setMatchIndex] = useState(0);
  const [chosen, setChosen] = useState<string | null>(null);
  const [broaden, setBroaden] = useState(false);

  const needTier = NEED_OPTIONS.find((o) => o.id === need)?.min_tier ?? 0;
  const minTier = broaden ? 0 : needTier;

  const matchesQ = useQuery({
    queryKey: ["senior", "matches", minTier],
    queryFn: () => fetchMatches({ data: { min_tier: minTier } }),
    enabled: !!need,
  });

  // For the "Repeat last booking" shortcut on the first step.
  const pastVisitsQ = useQuery({
    queryKey: ["senior", "visits"],
    queryFn: () => fetchVisits(),
  });
  const lastVisit = (pastVisitsQ.data ?? []).find((v) => v.status === "completed");


  const bookMutation = useMutation({
    mutationFn: bookFn,
    onSuccess: () => {
      toast.success("Request sent — a concierge will call to confirm.");
      navigate({ to: "/senior/visits" });
    },
    onError: (err) =>
      toast.error(err instanceof Error ? err.message : "Could not send request."),
  });

  const notifyMutation = useMutation({
    mutationFn: notifyFn,
    onSuccess: () =>
      toast.success("You're on the list — a concierge will call you within one business day."),
    onError: (err) =>
      toast.error(err instanceof Error ? err.message : "Could not save your request."),
  });

  const matches = matchesQ.data ?? [];

  const stepIdx = STEPS.indexOf(step === "confirm" ? "match" : step);

  const canNext =
    (step === "need" && !!need) ||
    (step === "when" && days.length > 0 && !!slot) ||
    step === "notes" ||
    (step === "budget" && (notSure || budget > 0)) ||
    step === "match";

  const goBack = () => {
    if (step === "confirm") return setStep("match");
    if (stepIdx === 0) navigate({ to: "/senior" });
    else setStep(STEPS[stepIdx - 1]);
  };

  const goNext = () => {
    if (step === "match") {
      const picked = matches[matchIndex];
      if (!picked) return;
      setChosen(picked.id);
      setStep("confirm");
      return;
    }
    if (stepIdx < STEPS.length - 1) setStep(STEPS[stepIdx + 1]);
  };

  const confirm = () => {
    const picked = matches.find((m) => m.id === chosen);
    if (!picked) return;
    // Best-effort scheduled_at: first selected day this week, morning/afternoon/evening.
    const hourBySlot: Record<string, number> = { morning: 9, afternoon: 14, evening: 18 };
    const scheduled = new Date();
    scheduled.setHours(hourBySlot[slot ?? "morning"] ?? 9, 0, 0, 0);
    scheduled.setDate(scheduled.getDate() + 1);
    const serviceLabel = NEED_OPTIONS.find((o) => o.id === need)?.label ?? "Care visit";
    const noteBody = [tags.join(" · "), note].filter(Boolean).join("\n").trim();
    bookMutation.mutate({
      data: {
        provider_id: picked.id,
        service_type: serviceLabel,
        scheduled_at: scheduled.toISOString(),
        duration_minutes: duration,
        hourly_rate_cents: picked.hourly_rate_cents,
        notes: noteBody || null,
      },
    });
  };

  const toggle = <T,>(arr: T[], v: T, setter: (a: T[]) => void) =>
    setter(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);

  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <button
          type="button"
          onClick={goBack}
          aria-label="Back"
          className="grid size-11 place-items-center rounded-full border border-input hover:bg-secondary"
        >
          <ArrowLeft className="size-5" />
        </button>
        <div className="flex-1">
          <div className="flex gap-1.5">
            {STEPS.map((s, i) => (
              <span
                key={s}
                className={`h-2 flex-1 rounded-full ${
                  i <= stepIdx ? "bg-primary" : "bg-secondary"
                }`}
              />
            ))}
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            Step {stepIdx + 1} of {STEPS.length}
          </p>
        </div>
      </div>

      {step === "need" && (
        <section>
          <h1 className="font-serif text-3xl">What do you need?</h1>
          <p className="mt-2 text-lg text-muted-foreground">Pick one. You can add more later.</p>

          {lastVisit && (
            <button
              type="button"
              onClick={() => {
                const id = needIdFromServiceType(lastVisit.service_type);
                if (id) setNeed(id);
                setDuration(lastVisit.duration_minutes || 120);
                setStep("when");
              }}
              className="mt-6 flex w-full items-center gap-4 rounded-2xl border-2 border-primary/40 bg-primary/5 p-4 text-left hover:bg-primary/10"
            >
              <span className="grid size-11 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground">
                <RotateCw className="size-5" />
              </span>
              <span className="flex-1">
                <span className="block text-base font-semibold text-primary">
                  Repeat last booking
                </span>
                <span className="block text-sm text-muted-foreground">
                  {lastVisit.service_type} with {lastVisit.provider_name ?? "your caregiver"}
                </span>
              </span>
              <ArrowRight className="size-5 text-primary" />
            </button>
          )}

          <div className="mt-6 grid gap-3">
            {NEED_OPTIONS.map(({ id, label, icon: Icon }) => {
              const active = need === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setNeed(id)}
                  className={`grid min-h-16 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-4 rounded-2xl border-2 px-5 py-4 text-left text-lg ${
                    active
                      ? "border-primary bg-primary/10 font-semibold text-primary"
                      : "border-input bg-card hover:bg-secondary"
                  }`}
                >
                  <Icon className="size-6" />
                  <span>{label}</span>
                  {active && <CheckCircle2 className="size-6" />}
                </button>
              );
            })}
          </div>
        </section>
      )}


      {step === "when" && (
        <section>
          <h1 className="font-serif text-3xl">When?</h1>
          <p className="mt-2 text-lg text-muted-foreground">Tap the days you'd like help.</p>

          <div className="mt-6 grid grid-cols-7 gap-2">
            {DAYS.map((d) => {
              const active = days.includes(d);
              return (
                <button
                  key={d}
                  type="button"
                  aria-pressed={active}
                  onClick={() => toggle(days, d, setDays)}
                  className={`flex h-16 items-center justify-center rounded-2xl border-2 text-base font-semibold ${
                    active
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-input bg-card"
                  }`}
                >
                  {d}
                </button>
              );
            })}
          </div>

          <p className="mt-6 text-base font-semibold uppercase tracking-wider text-muted-foreground">
            Time of day
          </p>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            {TIME_SLOTS.map(({ id, label, helper, icon: Icon }) => {
              const active = slot === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setSlot(id)}
                  className={`flex min-h-24 flex-col items-center justify-center gap-1 rounded-2xl border-2 p-4 ${
                    active
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-input bg-card"
                  }`}
                >
                  <Icon className="size-6" />
                  <span className="text-lg font-semibold">{label}</span>
                  <span className="text-sm text-muted-foreground">{helper}</span>
                </button>
              );
            })}
          </div>

          <p className="mt-6 text-base font-semibold uppercase tracking-wider text-muted-foreground">
            How long?
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {DURATIONS.map((d) => {
              const active = duration === d.minutes;
              return (
                <button
                  key={d.minutes}
                  type="button"
                  onClick={() => setDuration(d.minutes)}
                  className={`min-h-12 rounded-full border-2 px-5 text-base font-semibold ${
                    active
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-input bg-card"
                  }`}
                >
                  {d.label}
                </button>
              );
            })}
          </div>



          <button
            type="button"
            role="switch"
            aria-checked={recurring}
            onClick={() => setRecurring((v) => !v)}
            className="mt-6 grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-4 rounded-2xl border border-border bg-card p-5"
          >
            <span className="text-left text-lg font-semibold">Same time every week?</span>
            <span
              className={`relative inline-block h-8 w-14 shrink-0 rounded-full transition-colors ${
                recurring ? "bg-primary" : "bg-secondary"
              }`}
            >
              <span
                className={`absolute top-1 size-6 rounded-full bg-card shadow-soft transition-transform ${
                  recurring ? "translate-x-7" : "translate-x-1"
                }`}
              />
            </span>
          </button>
        </section>
      )}

      {step === "notes" && (
        <section>
          <h1 className="font-serif text-3xl">Anything they should know?</h1>
          <p className="mt-2 text-lg text-muted-foreground">Tap what fits. Add more in your own words below.</p>

          <div className="mt-6 flex flex-wrap gap-2">
            {TAG_OPTIONS.map((t) => {
              const active = tags.includes(t);
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => toggle(tags, t, setTags)}
                  aria-pressed={active}
                  className={`min-h-12 rounded-full border-2 px-4 py-2 text-base ${
                    active
                      ? "border-primary bg-primary/10 font-semibold text-primary"
                      : "border-input bg-card"
                  }`}
                >
                  {t}
                </button>
              );
            })}
          </div>

          <div className="mt-6">
            <VoiceInput
              value={note}
              onChange={setNote}
              label="In your own words"
              helper="Tap the mic to speak instead. Optional."
              placeholder="For example: my mother uses a walker and prefers mornings."
            />
          </div>
        </section>
      )}

      {step === "budget" && (
        <section>
          <h1 className="font-serif text-3xl">What's your budget?</h1>
          <p className="mt-2 text-lg text-muted-foreground">
            Rough monthly amount. You can change it any time.
          </p>

          <div className="mt-8 rounded-3xl border border-border bg-card p-6">
            <p className="text-center text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              About per month
            </p>
            <p className="mt-2 text-center font-serif text-5xl text-primary">
              {notSure ? "—" : `$${budget.toLocaleString()}`}
            </p>
            <input
              type="range"
              min={600}
              max={3000}
              step={100}
              value={budget}
              disabled={notSure}
              onChange={(e) => setBudget(Number(e.target.value))}
              className="mt-6 w-full accent-primary disabled:opacity-40"
              aria-label="Monthly budget"
            />
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {BUDGET_STOPS.map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => {
                    setNotSure(false);
                    setBudget(v);
                  }}
                  className={`min-h-12 rounded-full border-2 px-4 text-base font-semibold ${
                    !notSure && budget === v
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-input bg-card"
                  }`}
                >
                  {v >= 2500 ? "$2.5K+" : `$${(v / 1000).toFixed(v % 1000 ? 1 : 0)}K`}
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={() => setNotSure((v) => !v)}
            className={`mt-4 w-full rounded-2xl border-2 p-4 text-base font-semibold ${
              notSure ? "border-primary bg-primary/10 text-primary" : "border-input bg-card"
            }`}
          >
            I'm not sure — help me choose
          </button>
        </section>
      )}

      {step === "match" && (
        <section>
          <h1 className="font-serif text-3xl">Your best match</h1>
          {matchesQ.isPending ? (
            <div className="mt-6">
              <PageSkeleton title="matches" cards={1} />
            </div>
          ) : matchesQ.isError ? (
            <div className="mt-6">
              <ErrorState
                title="We couldn't load matches"
                error={matchesQ.error}
                onRetry={() => matchesQ.refetch()}
              />
            </div>
          ) : matches.length === 0 ? (
            <div className="mt-6 space-y-4">
              <EmptyState
                title={
                  needTier > 0 && !broaden
                    ? "No verified specialists yet for that need"
                    : "No caregivers available yet"
                }
                description={
                  needTier > 0 && !broaden
                    ? "That need requires an advanced caregiver tier we're still building in your area. You can broaden your search to any available caregiver, ask us to notify you when a specialist joins, or call the concierge."
                    : "We're still onboarding caregivers in your area. Ask us to notify you the moment someone joins, or call the concierge and we'll match you personally."
                }
                action={<CallButton variant="inline" label="Call concierge" />}
              />
              <div className="grid gap-3 sm:grid-cols-2">
                {needTier > 0 && !broaden && (
                  <button
                    type="button"
                    onClick={() => {
                      setBroaden(true);
                      setMatchIndex(0);
                    }}
                    className="min-h-14 rounded-2xl border-2 border-primary bg-primary/10 px-5 text-base font-semibold text-primary hover:bg-primary/15"
                  >
                    Show all available caregivers
                  </button>
                )}
                <button
                  type="button"
                  disabled={notifyMutation.isPending || notifyMutation.isSuccess}
                  onClick={() => {
                    const serviceLabel =
                      NEED_OPTIONS.find((o) => o.id === need)?.label ?? "Care visit";
                    notifyMutation.mutate({
                      data: {
                        service_type: serviceLabel,
                        min_tier: needTier,
                        days,
                        slot: slot ?? null,
                        budget_monthly: notSure ? null : budget,
                        free_text: note.trim() || null,
                      },
                    });
                  }}
                  className="min-h-14 rounded-2xl border-2 border-input bg-card px-5 text-base font-semibold hover:bg-secondary disabled:opacity-60"
                >
                  {notifyMutation.isSuccess
                    ? "We'll be in touch ✓"
                    : notifyMutation.isPending
                      ? "Saving…"
                      : "Notify me when someone's ready"}
                </button>
              </div>
            </div>
          ) : (
            <>
              <p className="mt-2 text-lg text-muted-foreground">
                {matchIndex + 1} of {matches.length} · ranked by rating and fit for your needs.
              </p>
              {(() => {
                const current = matches[matchIndex];
                const hourly = Math.round(current.hourly_rate_cents / 100);
                const cost = Math.round((current.hourly_rate_cents * duration) / 60 / 100);
                return (
                  <p className="mt-4 inline-flex items-center gap-2 rounded-full bg-sage-100 px-4 py-2 text-base font-semibold text-sage-800">
                    Est. ${cost} for this visit
                    <span className="font-normal text-sage-700">
                      · ${hourly}/hr × {(duration / 60).toFixed(duration % 60 ? 1 : 0)} hr
                    </span>
                  </p>
                );
              })()}
              <div className="mt-6">
                <MatchCard
                  provider={toMatchCard(matches[matchIndex])}
                  onChoose={goNext}
                  onSkip={() =>
                    setMatchIndex((i) => (i + 1) % matches.length)
                  }
                />
              </div>
            </>
          )}

        </section>
      )}

      {step === "confirm" && chosen && (
        <section>
          <div className="rounded-3xl bg-success/10 p-6 text-center">
            <CheckCircle2 className="mx-auto size-14 text-success" />
            <h1 className="mt-4 font-serif text-3xl">Almost there</h1>
            <p className="mt-2 text-lg text-muted-foreground">
              We'll call you within the hour to lock in the time — no surprise
              charges before you say yes.
            </p>
          </div>

          <dl className="mt-6 grid gap-3 rounded-2xl border border-border bg-card p-5 text-base">
            <Row label="Help with" value={NEED_OPTIONS.find((o) => o.id === need)?.label ?? "—"} />
            <Row
              label="When"
              value={`${days.join(", ") || "—"} · ${
                TIME_SLOTS.find((s) => s.id === slot)?.label ?? "—"
              }${recurring ? " (weekly)" : ""}`}
            />
            <Row
              label="Length"
              value={DURATIONS.find((d) => d.minutes === duration)?.label ?? `${duration} min`}
            />
            {tags.length > 0 && <Row label="Notes" value={tags.join(" · ")} />}
            <Row
              label="Budget"
              value={notSure ? "Help me choose" : `$${budget.toLocaleString()}/mo`}
            />
            <Row
              label="Caregiver"
              value={matches.find((p) => p.id === chosen)?.name ?? "—"}
            />
            {(() => {
              const picked = matches.find((p) => p.id === chosen);
              if (!picked) return null;
              const cost = Math.round((picked.hourly_rate_cents * duration) / 60 / 100);
              return (
                <Row label="Est. this visit" value={`$${cost}`} />
              );
            })()}

          </dl>

          <button
            type="button"
            onClick={confirm}
            className="mt-6 flex min-h-16 w-full items-center justify-center gap-2 rounded-full bg-primary text-xl font-semibold text-primary-foreground shadow-soft hover:bg-primary/90"
          >
            Send request <ArrowRight className="size-5" />
          </button>

          <div className="mt-4 text-center">
            <CallButton variant="inline" label="Prefer to talk? Call us" />
          </div>
        </section>
      )}

      {step !== "match" && step !== "confirm" && (
        <button
          type="button"
          onClick={goNext}
          disabled={!canNext}
          className="mt-8 flex min-h-16 w-full items-center justify-center gap-2 rounded-full bg-primary text-xl font-semibold text-primary-foreground shadow-soft hover:bg-primary/90 disabled:opacity-40"
        >
          Continue <ArrowRight className="size-5" />
        </button>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[auto_minmax(0,1fr)] gap-4">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right font-semibold">{value}</dd>
    </div>
  );
}
