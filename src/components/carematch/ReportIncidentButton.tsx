import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { AlertTriangle, X } from "lucide-react";
import { reportIncident, type IncidentCategory } from "@/lib/incidents.functions";

const CATEGORY_LABELS: Record<IncidentCategory, string> = {
  no_show: "No-show",
  safety: "Safety concern",
  abuse: "Suspected abuse",
  theft: "Missing property / theft",
  quality: "Quality of care",
  billing: "Billing issue",
  other: "Other",
};

const SEVERITY_LABELS = ["Info", "Low", "Elevated", "Urgent"];

export function ReportIncidentButton({
  bookingId,
  subjectUserId,
  className,
  variant = "default",
}: {
  bookingId?: string;
  subjectUserId?: string;
  className?: string;
  variant?: "default" | "subtle";
}) {
  const [open, setOpen] = useState(false);
  const base =
    variant === "subtle"
      ? "inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-semibold hover:bg-secondary"
      : "inline-flex items-center gap-2 rounded-full bg-destructive/10 px-4 py-2 text-sm font-semibold text-destructive hover:bg-destructive/20";
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={`${base} ${className ?? ""}`}>
        <AlertTriangle className="size-4" /> Report a concern
      </button>
      {open && (
        <ReportIncidentDialog
          bookingId={bookingId}
          subjectUserId={subjectUserId}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}

function ReportIncidentDialog({
  bookingId,
  subjectUserId,
  onClose,
}: {
  bookingId?: string;
  subjectUserId?: string;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const submit = useServerFn(reportIncident);
  const [category, setCategory] = useState<IncidentCategory>("safety");
  const [severity, setSeverity] = useState(2);
  const [summary, setSummary] = useState("");

  const mut = useMutation({
    mutationFn: submit,
    onSuccess: () => {
      toast.success("Report filed. Our safety team will review shortly.");
      qc.invalidateQueries({ queryKey: ["incidents", "mine"] });
      onClose();
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Couldn't file report."),
  });

  const canSubmit = summary.trim().length >= 4 && !mut.isPending;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg overflow-hidden rounded-2xl border border-border bg-card shadow-lg"
      >
        <div className="flex items-center justify-between border-b border-border p-4">
          <div>
            <p className="text-xs uppercase tracking-widest text-muted-foreground">Trust & Safety</p>
            <h2 className="font-serif text-xl">Report a concern</h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="grid size-9 place-items-center rounded-full hover:bg-secondary"
          >
            <X className="size-4" />
          </button>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!canSubmit) return;
            mut.mutate({
              data: {
                category,
                severity,
                summary: summary.trim(),
                booking_id: bookingId ?? null,
                subject_user_id: subjectUserId ?? null,
              },
            });
          }}
          className="space-y-4 p-5"
        >
          <div>
            <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as IncidentCategory)}
              className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
            >
              {(Object.keys(CATEGORY_LABELS) as IncidentCategory[]).map((k) => (
                <option key={k} value={k}>
                  {CATEGORY_LABELS[k]}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Severity · {SEVERITY_LABELS[severity - 1]}
            </label>
            <input
              type="range"
              min={1}
              max={4}
              value={severity}
              onChange={(e) => setSeverity(Number(e.target.value))}
              className="mt-2 w-full"
            />
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              What happened?
            </label>
            <textarea
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              rows={5}
              maxLength={4000}
              placeholder="Give us the details. Dates, names, and any evidence help us act quickly."
              className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
            />
          </div>

          {severity >= 4 && (
            <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
              For life-threatening emergencies, call 911 first — then file this report.
            </p>
          )}

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-border px-4 py-2 text-sm font-semibold hover:bg-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!canSubmit}
              className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {mut.isPending ? "Sending…" : "File report"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
