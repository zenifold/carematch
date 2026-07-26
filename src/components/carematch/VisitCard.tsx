import { CheckCircle2, Clock, MapPin, Phone } from "lucide-react";

export type VisitStatus = "upcoming" | "enroute" | "in-progress" | "completed" | "issue";

export type VisitCardData = {
  id: string;
  providerName: string;
  providerInitials: string;
  serviceType: string;
  scheduledStart: string; // human-readable
  status: VisitStatus;
  checkInTime?: string;
  checkOutTime?: string;
  amount?: number;
  verifiedOnArrival?: boolean;
};

type Props = {
  visit: VisitCardData;
  onCall?: () => void;
  onChange?: () => void;
  className?: string;
};

const STATUS_META: Record<VisitStatus, { label: string; tone: string }> = {
  upcoming: { label: "Upcoming", tone: "bg-secondary text-secondary-foreground" },
  enroute: { label: "On the way", tone: "bg-warning/20 text-warning-foreground" },
  "in-progress": { label: "Visit in progress", tone: "bg-primary/15 text-primary" },
  completed: { label: "Completed", tone: "bg-success/10 text-success" },
  issue: { label: "Needs attention", tone: "bg-destructive/10 text-destructive" },
};

export function VisitCard({ visit, onCall, onChange, className = "" }: Props) {
  const status = STATUS_META[visit.status];
  const fmt = (n: number) =>
    n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

  return (
    <article className={`surface-card p-6 ${className}`}>
      <div className="flex items-start gap-4">
        <div className="grid size-16 shrink-0 place-items-center rounded-2xl bg-primary/15 font-serif text-2xl text-primary">
          {visit.providerInitials}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-xl font-semibold">{visit.providerName}</p>
            <span className={`rounded-full px-3 py-1 text-sm font-semibold ${status.tone}`}>
              {status.label}
            </span>
          </div>
          <p className="mt-1 text-base text-muted-foreground">{visit.serviceType}</p>
          <p className="mt-3 inline-flex items-center gap-2 text-lg font-medium">
            <Clock className="size-5 text-primary" aria-hidden />
            {visit.scheduledStart}
          </p>

          {visit.verifiedOnArrival && visit.checkInTime && (
            <p className="mt-3 inline-flex items-center gap-2 rounded-2xl bg-success/10 px-3 py-2 text-sm font-semibold text-success">
              <CheckCircle2 className="size-4" />
              Verified on arrival · {visit.checkInTime}
            </p>
          )}

          {visit.status === "enroute" && (
            <p className="mt-2 inline-flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="size-4" /> About 10 minutes away
            </p>
          )}

          {visit.status === "completed" && visit.checkInTime && visit.checkOutTime && (
            <p className="mt-2 text-sm text-muted-foreground">
              {visit.checkInTime} — {visit.checkOutTime}
              {visit.amount != null && <> · {fmt(visit.amount)}</>}
            </p>
          )}
        </div>
      </div>

      {(onCall || onChange) && (
        <div className="mt-5 flex flex-wrap gap-3">
          {onCall && (
            <button
              onClick={onCall}
              className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-full bg-primary px-5 py-3 text-lg font-semibold text-primary-foreground hover:bg-primary/90"
            >
              <Phone className="size-5" /> Call {visit.providerName.split(" ")[0]}
            </button>
          )}
          {onChange && (
            <button
              onClick={onChange}
              className="inline-flex min-h-12 flex-1 items-center justify-center rounded-full border border-input bg-card px-5 py-3 text-lg font-semibold hover:bg-secondary"
            >
              Change
            </button>
          )}
        </div>
      )}
    </article>
  );
}
