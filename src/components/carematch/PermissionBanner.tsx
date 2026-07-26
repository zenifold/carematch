import { Lock } from "lucide-react";

/**
 * PermissionBanner — shown on family pages when the linked senior has NOT
 * granted family_can_edit permission. The page renders read-only in that
 * mode; mutation controls should be disabled by the caller.
 */
export function PermissionBanner({
  seniorName,
  action = "make changes",
}: {
  seniorName?: string | null;
  action?: string;
}) {
  const who = seniorName ?? "Your senior";
  return (
    <div
      role="note"
      className="flex items-start gap-3 rounded-2xl border border-amber-300/60 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100"
    >
      <Lock className="mt-0.5 size-4 shrink-0" aria-hidden />
      <div className="min-w-0">
        <p className="font-semibold">View only</p>
        <p className="text-amber-900/80 dark:text-amber-100/80">
          {who} hasn't given family permission to {action} on their behalf. You
          can see what's happening, but any edits need to come from them. They
          can turn this on any time in their settings.
        </p>
      </div>
    </div>
  );
}
