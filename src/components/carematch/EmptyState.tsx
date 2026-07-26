import type { ReactNode } from "react";
import { Inbox } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Zero / empty state for authenticated screens. Use whenever a query
 * returns an empty list so the page has a purposeful blank rather than
 * static filler.
 */
export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-3xl border border-dashed border-border bg-card px-6 py-12 text-center",
        className,
      )}
    >
      <span className="grid size-14 place-items-center rounded-2xl bg-sage-50 text-sage-700">
        {icon ?? <Inbox className="size-6" />}
      </span>
      <h2 className="mt-4 font-serif text-2xl">{title}</h2>
      {description && (
        <p className="mt-2 max-w-md text-base text-muted-foreground">
          {description}
        </p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
