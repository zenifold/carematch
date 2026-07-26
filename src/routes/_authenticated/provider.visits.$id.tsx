import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, MapPin, Clock, Check, LogIn, LogOut, ListChecks, Star } from "lucide-react";
import { toast } from "sonner";
import {
  getVisitDetail,
  checkInVisit,
  checkOutVisit,
  cancelBooking,
  setVisitPlan,
  rateVisitByProvider,
  type VisitPlanItem,
} from "@/lib/bookings.functions";
import {
  PageSkeleton,
  EmptyState,
  ErrorState,
  RouteErrorBoundary,
  ReportIncidentButton,
  VisitExtras,
} from "@/components/carematch";

export const Route = createFileRoute("/_authenticated/provider/visits/$id")({
  component: ProviderVisit,
  errorComponent: RouteErrorBoundary,
});

function fmtWhen(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function ProviderVisit() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const getFn = useServerFn(getVisitDetail);
  const inFn = useServerFn(checkInVisit);
  const outFn = useServerFn(checkOutVisit);
  const cancelFn = useServerFn(cancelBooking);
  const planFn = useServerFn(setVisitPlan);
  const rateFn = useServerFn(rateVisitByProvider);

  const q = useQuery({
    queryKey: ["visit-detail", id],
    queryFn: () => getFn({ data: { id } }),
  });

  const [notes, setNotes] = useState("");
  const [summary, setSummary] = useState("");
  const [plan, setPlan] = useState<VisitPlanItem[]>([]);
  const [providerRating, setProviderRating] = useState<number | null>(null);
  const [providerComment, setProviderComment] = useState("");

  useEffect(() => {
    if (q.data?.plan_items) setPlan(q.data.plan_items);
    if (q.data?.provider_rating) setProviderRating(q.data.provider_rating);
    if (q.data?.provider_comment) setProviderComment(q.data.provider_comment);
  }, [q.data?.plan_items, q.data?.provider_rating, q.data?.provider_comment]);

  const savePlan = useMutation({
    mutationFn: (items: VisitPlanItem[]) => planFn({ data: { booking_id: id, items } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["visit-detail", id] }),
  });

  const checkIn = useMutation({
    mutationFn: async () => {
      const coords = await new Promise<{ lat: number; lng: number } | null>((resolve) => {
        if (!("geolocation" in navigator)) return resolve(null);
        const timer = setTimeout(() => resolve(null), 4000);
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            clearTimeout(timer);
            resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          },
          () => {
            clearTimeout(timer);
            resolve(null);
          },
          { enableHighAccuracy: false, timeout: 3500 },
        );
      });
      return inFn({ data: { id, lat: coords?.lat ?? null, lng: coords?.lng ?? null } });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["visit-detail", id] });
      qc.invalidateQueries({ queryKey: ["provider"] });
      toast.success("Checked in.");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Check-in failed"),
  });

  const checkOut = useMutation({
    mutationFn: () =>
      outFn({
        data: {
          id,
          provider_notes: notes || null,
          checkout_summary_text: summary || null,
        },
      }),
    onSuccess: async () => {
      // Save plan progress too
      await planFn({ data: { booking_id: id, items: plan } });
      if (providerRating) {
        await rateFn({
          data: { booking_id: id, rating: providerRating, comment: providerComment || null },
        });
      }
      qc.invalidateQueries({ queryKey: ["provider"] });
      toast.success("Visit complete — nice work.");
      navigate({ to: "/provider/jobs" });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Check-out failed"),
  });

  const cancel = useMutation({
    mutationFn: () => cancelFn({ data: { id } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["provider"] });
      toast.success("Booking cancelled.");
      navigate({ to: "/provider/jobs" });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Cancel failed"),
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

  const v = q.data;
  const canCheckIn = !v.checked_in_at && (v.status === "confirmed" || v.status === "requested");
  const canCheckOut = !!v.checked_in_at && !v.checked_out_at;
  const done = !!v.checked_out_at;

  const togglePlanItem = (idx: number) => {
    const next = plan.map((p, i) => (i === idx ? { ...p, done: !p.done } : p));
    setPlan(next);
    savePlan.mutate(next);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate({ to: "/provider/jobs" })}
          aria-label="Back"
          className="grid size-10 place-items-center rounded-full border border-input hover:bg-secondary"
        >
          <ArrowLeft className="size-4" />
        </button>
        <h1 className="font-serif text-2xl lg:text-3xl">Visit</h1>
      </div>

      <div className="surface-card p-5">
        <p className="text-xs uppercase tracking-widest text-muted-foreground">
          {v.service_type} · {v.duration_minutes}m
        </p>
        <p className="mt-1 font-serif text-xl">{fmtWhen(v.scheduled_at)}</p>
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Clock className="size-4" /> {v.duration_minutes} minutes
          </span>
          <span className="inline-flex items-center gap-1">
            <MapPin className="size-4" /> On-site
          </span>
        </div>
        {v.notes && (
          <p className="mt-3 rounded-xl bg-secondary/50 p-3 text-sm">
            <span className="font-semibold">Family note: </span>
            {v.notes}
          </p>
        )}

        <div className="mt-5 grid gap-2">
          <StatusRow label="Checked in" time={v.checked_in_at} active={!!v.checked_in_at} />
          <StatusRow label="Checked out" time={v.checked_out_at} active={!!v.checked_out_at} />
        </div>
      </div>

      {/* Shift plan checklist */}
      {(plan.length > 0 || canCheckOut) && (
        <div className="surface-card p-5">
          <div className="mb-3 flex items-center gap-2">
            <ListChecks className="size-4 text-primary" />
            <h2 className="font-serif text-lg">Shift plan</h2>
          </div>
          {plan.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No plan items set. You can still add notes at check-out.
            </p>
          ) : (
            <ul className="space-y-2">
              {plan.map((p, idx) => (
                <li key={idx}>
                  <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border bg-card p-3 text-sm hover:bg-secondary/40">
                    <input
                      type="checkbox"
                      checked={p.done}
                      onChange={() => togglePlanItem(idx)}
                      className="mt-1 size-4"
                    />
                    <span className={p.done ? "line-through text-muted-foreground" : ""}>
                      {p.label}
                    </span>
                  </label>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {canCheckIn && (
        <button
          onClick={() => checkIn.mutate()}
          disabled={checkIn.isPending}
          className="inline-flex w-full min-h-14 items-center justify-center gap-2 rounded-2xl bg-primary text-lg font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          <LogIn className="size-5" /> Check in — I've arrived
        </button>
      )}

      {canCheckOut && (
        <div className="surface-card p-5 space-y-4">
          <div>
            <label className="text-sm font-semibold">Visit summary for the family</label>
            <textarea
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              rows={3}
              placeholder="A short recap of what you did and how they're doing today."
              className="mt-2 w-full rounded-xl border border-input bg-card p-3 text-sm"
            />
          </div>
          <div>
            <label className="text-sm font-semibold">Private notes (not shared)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Anything to remember for next time?"
              className="mt-2 w-full rounded-xl border border-input bg-card p-3 text-sm"
            />
          </div>
          <div>
            <label className="text-sm font-semibold">How did it go?</label>
            <StarPicker value={providerRating} onChange={setProviderRating} />
            {providerRating !== null && providerRating < 4 && (
              <textarea
                value={providerComment}
                onChange={(e) => setProviderComment(e.target.value)}
                rows={2}
                placeholder="Anything the care team should know?"
                className="mt-2 w-full rounded-xl border border-input bg-card p-3 text-sm"
              />
            )}
          </div>
          <button
            onClick={() => checkOut.mutate()}
            disabled={checkOut.isPending}
            className="inline-flex w-full min-h-14 items-center justify-center gap-2 rounded-2xl bg-primary text-lg font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            <LogOut className="size-5" /> Check out — visit complete
          </button>
        </div>
      )}

      {done && (
        <div className="surface-card flex items-start gap-3 p-5 text-sm">
          <Check className="mt-0.5 size-5 text-success" />
          <div>
            <p className="font-semibold">Visit complete.</p>
            <p className="text-muted-foreground">
              Earnings are on their way to your next payout.
            </p>
          </div>
        </div>
      )}
      {v.checked_in_at && !done && <VisitExtras bookingId={id} role="provider" />}

      {(v.status === "confirmed" || v.status === "requested") && !v.checked_in_at && (
        <button
          onClick={() => cancel.mutate()}
          disabled={cancel.isPending}
          className="w-full rounded-2xl border border-input py-3 text-sm text-muted-foreground hover:bg-secondary disabled:opacity-50"
        >
          Cancel this visit
        </button>
      )}

      <div className="mt-4 flex justify-end">
        <ReportIncidentButton bookingId={id} variant="subtle" />
      </div>
    </div>
  );
}

function StatusRow({
  label,
  time,
  active,
}: {
  label: string;
  time: string | null;
  active: boolean;
}) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-border bg-card px-3 py-2 text-sm">
      <span className="font-medium">{label}</span>
      <span className={active ? "text-success font-semibold" : "text-muted-foreground"}>
        {time
          ? new Date(time).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })
          : "—"}
      </span>
    </div>
  );
}

export function StarPicker({
  value,
  onChange,
}: {
  value: number | null;
  onChange: (n: number) => void;
}) {
  return (
    <div className="mt-2 flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          aria-label={`${n} star${n > 1 ? "s" : ""}`}
          className="p-1"
        >
          <Star
            className={
              "size-7 " +
              (value !== null && n <= value
                ? "fill-primary text-primary"
                : "text-muted-foreground")
            }
          />
        </button>
      ))}
    </div>
  );
}
