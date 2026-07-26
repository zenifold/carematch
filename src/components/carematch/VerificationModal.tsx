import { X } from "lucide-react";
import { useEffect } from "react";
import { VerificationBadge, VERIFICATION_STAGES } from "./VerificationBadge";

type Props = {
  open: boolean;
  onClose: () => void;
  providerName?: string;
};

/**
 * VerificationModal — full-screen sheet explaining all 5 verification stages.
 * Triggered from a MatchCard's verification badge.
 */
export function VerificationModal({ open, onClose, providerName }: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="How CareMatch verifies caregivers"
      className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/40 sm:items-center"
      onClick={onClose}
    >
      <div
        className="max-h-[90dvh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-card p-6 shadow-lifted sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="font-serif text-2xl">How we verify {providerName ?? "every caregiver"}</h2>
            <p className="mt-1 text-base text-muted-foreground">
              Five checks. Every one refreshed on schedule.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="grid size-11 shrink-0 place-items-center rounded-full hover:bg-secondary"
          >
            <X className="size-5" />
          </button>
        </div>

        <ol className="mt-6 grid gap-4">
          {VERIFICATION_STAGES.map((stage, i) => (
            <li key={stage} className="rounded-2xl border border-border p-4">
              <div className="flex items-center gap-3">
                <span className="grid size-8 shrink-0 place-items-center rounded-full bg-primary/10 font-serif text-sm text-primary">
                  {i + 1}
                </span>
                <VerificationBadge stage={stage} size="sm" />
              </div>
            </li>
          ))}
        </ol>

        <p className="mt-6 rounded-2xl bg-sage-50 p-4 text-sm text-sage-700">
          Every access to your record is logged. You can see it any time.
        </p>
      </div>
    </div>
  );
}
