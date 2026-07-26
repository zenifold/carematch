import { AlertTriangle, RefreshCw } from "lucide-react";
import { useRouter } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

/**
 * Error state for authenticated routes. Pair with `errorComponent` on a
 * route, or render inline when a `useQuery` returns `isError`.
 *
 * The retry button invalidates the router so route loaders re-run.
 */
export function ErrorState({
  title = "Something went wrong",
  description,
  error,
  onRetry,
  className,
}: {
  title?: string;
  description?: string;
  error?: unknown;
  onRetry?: () => void;
  className?: string;
}) {
  const router = useRouter();
  const message =
    description ??
    (error instanceof Error
      ? error.message
      : "We couldn't load this page. Please try again.");

  const handleRetry = () => {
    if (onRetry) {
      onRetry();
    } else {
      void router.invalidate();
    }
  };

  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col items-center justify-center rounded-3xl border border-destructive/30 bg-destructive/5 px-6 py-12 text-center",
        className,
      )}
    >
      <span className="grid size-14 place-items-center rounded-2xl bg-destructive/10 text-destructive">
        <AlertTriangle className="size-6" />
      </span>
      <h2 className="mt-4 font-serif text-2xl">{title}</h2>
      <p className="mt-2 max-w-md text-base text-muted-foreground">{message}</p>
      <button
        type="button"
        onClick={handleRetry}
        className="mt-6 inline-flex min-h-12 items-center gap-2 rounded-full bg-primary px-5 text-base font-semibold text-primary-foreground shadow-soft hover:bg-primary/90"
      >
        <RefreshCw className="size-4" />
        Try again
      </button>
    </div>
  );
}

/**
 * Shape suitable for TanStack Router `errorComponent`.
 * Usage: `errorComponent: RouteErrorBoundary`
 */
export function RouteErrorBoundary({ error }: { error: Error }) {
  return <ErrorState error={error} />;
}
