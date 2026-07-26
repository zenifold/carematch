import { cn } from "@/lib/utils";

/**
 * Skeleton primitives for authenticated routes.
 *
 * Use <PageSkeleton /> as a route pendingComponent default, and compose the
 * smaller <Skeleton /> / <SkeletonText /> / <SkeletonCard /> primitives inside
 * bespoke layouts so the shape mimics the loaded content.
 */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn("animate-pulse rounded-md bg-muted", className)}
    />
  );
}

export function SkeletonText({
  lines = 3,
  className,
}: {
  lines?: number;
  className?: string;
}) {
  return (
    <div className={cn("space-y-2", className)} aria-hidden="true">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn("h-4", i === lines - 1 ? "w-2/3" : "w-full")}
        />
      ))}
    </div>
  );
}

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-border bg-card p-5",
        className,
      )}
      aria-hidden="true"
    >
      <div className="flex items-center gap-4">
        <Skeleton className="size-14 rounded-2xl" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-1/2" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </div>
    </div>
  );
}

export function PageSkeleton({
  title,
  cards = 3,
}: {
  title?: string;
  cards?: number;
}) {
  return (
    <div role="status" aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading{title ? ` ${title}` : ""}…</span>
      <Skeleton className="h-8 w-56" />
      <Skeleton className="mt-3 h-5 w-80" />
      <div className="mt-8 grid gap-4">
        {Array.from({ length: cards }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    </div>
  );
}
