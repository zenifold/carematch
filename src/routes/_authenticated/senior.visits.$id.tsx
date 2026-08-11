import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  ArrowLeft,
  CalendarClock,
  CheckCircle2,
  MapPin,
  MessageCircle,
  RotateCw,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import {
  getVisitDetail,
  rateVisit,
  cancelBooking,
  rescheduleBooking,
} from "@/lib/bookings.functions";
import {
  VoiceInput,
  VerificationBadge,
  PageSkeleton,
  EmptyState,
  ErrorState,
  RouteErrorBoundary,
  ReportIncidentButton,
  VisitExtras,
} from "@/components/carematch";

export const Route = createFileRoute("/_authenticated/senior/visits/$id")({
  component: VisitDay,
  errorComponent: RouteErrorBoundary,
});

type Phase = "enroute" | "arrived" | "review";

function initialsFrom(name: string | null): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  return (parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "");
}

function phaseFromVisit(
  status: string,
  checkedIn: string | null,
  checkedOut: string | null,
): Phase {
  if (checkedOut || status === "completed") return "review";
  if (checkedIn || status === "in_progress") return "arrived";
  return "enroute";
}

function VisitDay() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const fn = useServerFn(getVisitDetail);
  const rateFn = useServerFn(rateVisit);
  const cancelFn = useServerFn(cancelBooking);
  const rescheduleFn = useServerFn(rescheduleBooking);
  const q = useQuery({
    queryKey: ["visit-detail", id],
    queryFn: () => fn({ data: { id } }),
  });

  const [comment, setComment] = useState("");
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [newWhen, setNewWhen] = useState("");

  const rate = useMutation({
    mutationFn: (rating: "great" | "okay" | "bad") =>
      rateFn({ data: { booking_id: id, rating, comment: comment || null } }),
    onSuccess: (_res, rating) => {
      qc.invalidateQueries({ queryKey: ["visit-detail", id] });
      if (rating === "bad") {
        toast.success("Reported — our team is on it and will write to you today.");
      } else {
        toast.success("Thanks — your feedback is saved.");
      }
      navigate({ to: "/senior/visits" });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Save failed"),
  });

  const cancel = useMutation({
    mutationFn: () => cancelFn({ data: { id } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["visit-detail", id] });
      toast.success("Visit cancelled.");
      navigate({ to: "/senior/visits" });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Cancel failed"),
  });

  const reschedule = useMutation({
    mutationFn: (scheduled_at: string) => rescheduleFn({ data: { id, scheduled_at } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["visit-detail", id] });
      qc.invalidateQueries({ queryKey: ["senior", "visits"] });
      toast.success("Visit rescheduled — we'll reconfirm with your caregiver.");
      setRescheduleOpen(false);
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Reschedule failed"),
  });

  if (q.isPending) return <PageSkeleton title="visit" cards={2} />;
  if (q.isError) return <ErrorState error={q.error} onRetry={() => q.refetch()} />;
  if (!q.data) {
    return (
      <EmptyState
        title="Visit not found"
        description="This visit no longer exists or you don't have access."
      />
    );
  }

  const visit = q.data;
  const phase = phaseFromVisit(visit.status, visit.checked_in_at, visit.checked_out_at);
  const firstName = (visit.provider_name ?? "Your caregiver").split(" ")[0];
  const when = new Date(visit.scheduled_at);
  const arriveLabel = when.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  const arrivedLabel = visit.checked_in_at
    ? new Date(visit.checked_in_at).toLocaleTimeString(undefined, {
        hour: "numeric",
        minute: "2-digit",
      })
    : arriveLabel;
  const alreadyRated = !!visit.senior_rating;

  return (
    <div>
      <div className="mb-5 flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate({ to: "/senior/visits" })}
          aria-label="Back to visits"
          className="grid size-11 place-items-center rounded-full border border-input hover:bg-secondary"
        >
          <ArrowLeft className="size-5" />
        </button>
        <h1 className="font-serif text-3xl">Today with {firstName}</h1>
      </div>

      <div className="surface-card p-6">
        <div className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-4">
          <span className="grid size-20 shrink-0 place-items-center rounded-2xl bg-sage-100 font-serif text-2xl text-sage-700">
            {initialsFrom(visit.provider_name)}
          </span>
          <div className="min-w-0">
            <p className="truncate text-xl font-semibold">{visit.provider_name ?? "Caregiver"}</p>
            <p className="truncate text-base text-muted-foreground capitalize">
              {visit.service_type} · {visit.duration_minutes}m
            </p>
          </div>
        </div>

        {phase === "enroute" && (
          <>
            <p className="mt-5 rounded-2xl bg-warning/15 p-4 text-lg font-semibold text-warning-foreground">
              {firstName} — scheduled arrival {arriveLabel}
            </p>
            <div className="mt-4 flex aspect-[16/9] items-center justify-center rounded-2xl bg-gradient-to-br from-sage-100 to-primary/10 text-muted-foreground">
              <MapPin className="mr-2 size-6" /> Live map preview
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <Link
                to="/senior/messages"
                className="inline-flex min-h-14 items-center justify-center gap-2 rounded-full bg-primary text-lg font-semibold text-primary-foreground"
              >
                <MessageCircle className="size-5" /> Message
              </Link>
              <button
                type="button"
                onClick={() => setRescheduleOpen((v) => !v)}
                className="inline-flex min-h-14 items-center justify-center gap-2 rounded-full border border-input bg-card text-lg font-semibold"
              >
                <CalendarClock className="size-5" /> Reschedule
              </button>
            </div>
            {rescheduleOpen && (
              <div className="mt-4 rounded-2xl border border-input bg-secondary/40 p-4">
                <label className="text-base font-semibold" htmlFor="new-when">
                  Pick a new date and time
                </label>
                <input
                  id="new-when"
                  type="datetime-local"
                  value={newWhen}
                  onChange={(e) => setNewWhen(e.target.value)}
                  className="mt-2 w-full rounded-xl border border-input bg-card px-3 py-3 text-base"
                />
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    disabled={!newWhen || reschedule.isPending}
                    onClick={() => reschedule.mutate(new Date(newWhen).toISOString())}
                    className="inline-flex min-h-12 flex-1 items-center justify-center rounded-full bg-primary text-base font-semibold text-primary-foreground disabled:opacity-50"
                  >
                    Confirm new time
                  </button>
                  <button
                    type="button"
                    onClick={() => setRescheduleOpen(false)}
                    className="inline-flex min-h-12 items-center justify-center rounded-full border border-input bg-card px-4 text-base font-semibold"
                  >
                    Never mind
                  </button>
                </div>
              </div>
            )}
            <button
              type="button"
              onClick={() => {
                if (confirm("Cancel this visit? Your caregiver will be notified.")) {
                  cancel.mutate();
                }
              }}
              disabled={cancel.isPending}
              className="mt-3 inline-flex w-full min-h-12 items-center justify-center rounded-full text-base font-semibold text-destructive underline-offset-4 hover:underline disabled:opacity-50"
            >
              Cancel visit
            </button>
          </>
        )}

        {phase === "arrived" && (
          <>
            <div className="mt-5 rounded-2xl bg-success/15 p-5">
              <p className="inline-flex items-center gap-2 text-lg font-bold text-success">
                <ShieldCheck className="size-6" /> VERIFIED
              </p>
              <p className="mt-1 text-base text-foreground">
                Arrival confirmed · Identity + GPS match.
              </p>
            </div>
            <div className="mt-4">
              <VerificationBadge stage="arrival" date={arrivedLabel} size="sm" />
            </div>
            <p className="mt-5 rounded-2xl bg-primary/10 p-4 text-lg">Visit in progress</p>
          </>
        )}

        {phase === "review" && (
          <>
            {alreadyRated ? (
              <div className="mt-6 rounded-2xl bg-sage-50 p-5 text-center">
                <p className="font-serif text-xl">Thanks for the feedback</p>
                <p className="mt-1 text-sm text-sage-700">
                  You rated this visit "{visit.senior_rating}".
                </p>
              </div>
            ) : (
              <>
                <p className="mt-6 text-center font-serif text-2xl">How was it?</p>
                <div className="mt-5 grid grid-cols-3 gap-3">
                  <ReviewButton
                    emoji="😊"
                    label="Great"
                    onClick={() => rate.mutate("great")}
                    disabled={rate.isPending}
                  />
                  <ReviewButton
                    emoji="😐"
                    label="Okay"
                    onClick={() => rate.mutate("okay")}
                    disabled={rate.isPending}
                  />
                  <ReviewButton
                    emoji="😕"
                    label="Not good"
                    onClick={() => rate.mutate("bad")}
                    disabled={rate.isPending}
                  />
                </div>
                <div className="mt-6">
                  <VoiceInput
                    value={comment}
                    onChange={setComment}
                    label="Anything you want to add?"
                    helper="Tap the mic to speak. Optional."
                  />
                </div>
                <p className="mt-4 flex items-start gap-2 rounded-2xl bg-sage-50 p-4 text-sm text-sage-700">
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
                  "Not good" gets a same-day reply from a real person on our team.
                </p>
              </>
            )}
            <Link
              to="/senior/book"
              className="mt-5 inline-flex w-full min-h-14 items-center justify-center gap-2 rounded-full border-2 border-primary/40 bg-primary/5 text-lg font-semibold text-primary hover:bg-primary/10"
            >
              <RotateCw className="size-5" /> Book {firstName} again
            </Link>
          </>
        )}
      </div>
      {(phase === "arrived" || phase === "review") && visit.plan_items.length > 0 && (
        <div className="surface-card mt-4 p-5">
          <p className="font-serif text-xl">Today's plan</p>
          <ul className="mt-3 space-y-2 text-base">
            {visit.plan_items.map((p, i) => (
              <li key={i} className="flex items-center gap-3">
                <span
                  className={
                    "grid size-6 place-items-center rounded-full border-2 " +
                    (p.done ? "border-success bg-success text-white" : "border-muted-foreground")
                  }
                >
                  {p.done && <CheckCircle2 className="size-4" />}
                </span>
                <span className={p.done ? "text-muted-foreground line-through" : ""}>
                  {p.label}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
      {phase === "review" && visit.checkout_summary_text && (
        <div className="surface-card mt-4 p-5">
          <p className="font-serif text-xl">From {firstName}</p>
          <p className="mt-2 text-base leading-relaxed">{visit.checkout_summary_text}</p>
        </div>
      )}
      {(phase === "arrived" || phase === "review") && (
        <div className="mt-4">
          <VisitExtras bookingId={visit.id} role="senior" />
        </div>
      )}

      <div className="mt-4 flex justify-end">
        <ReportIncidentButton bookingId={visit.id} variant="subtle" />
      </div>
    </div>
  );
}

function ReviewButton({
  emoji,
  label,
  onClick,
  disabled,
}: {
  emoji: string;
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex min-h-32 flex-col items-center justify-center gap-2 rounded-2xl border-2 border-input bg-card p-4 text-center hover:border-primary hover:bg-primary/5 disabled:opacity-50"
    >
      <span className="text-5xl" aria-hidden>
        {emoji}
      </span>
      <span className="text-base font-semibold">{label}</span>
    </button>
  );
}
