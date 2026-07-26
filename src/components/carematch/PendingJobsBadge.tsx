import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getPendingJobCount, getUpcomingVisitCount } from "@/lib/bookings.functions";

function Badge({ n, variant, className }: { n: number; variant: "count" | "dot"; className: string }) {
  if (n <= 0) return null;
  if (variant === "dot") {
    return (
      <span
        aria-label={`${n} pending`}
        className={`size-2 rounded-full bg-destructive ${className}`}
      />
    );
  }
  return (
    <span
      aria-label={`${n} pending`}
      className={`inline-flex min-w-5 items-center justify-center rounded-full bg-destructive px-1.5 text-[10px] font-bold leading-none text-destructive-foreground ${className}`}
    >
      {n > 99 ? "99+" : n}
    </span>
  );
}

/** Badge showing count of `requested` bookings awaiting provider action. */
export function PendingJobsBadge({
  variant = "count",
  className = "",
}: {
  variant?: "count" | "dot";
  className?: string;
}) {
  const fn = useServerFn(getPendingJobCount);
  const { data } = useQuery({
    queryKey: ["bookings", "pending-count"],
    queryFn: () => fn(),
    refetchInterval: 30_000,
    staleTime: 15_000,
  });
  return <Badge n={data ?? 0} variant={variant} className={className} />;
}

/** Badge showing count of upcoming (next-24h) confirmed visits for the senior/family. */
export function UpcomingVisitsBadge({
  variant = "count",
  className = "",
}: {
  variant?: "count" | "dot";
  className?: string;
}) {
  const fn = useServerFn(getUpcomingVisitCount);
  const { data } = useQuery({
    queryKey: ["bookings", "upcoming-count"],
    queryFn: () => fn(),
    refetchInterval: 60_000,
    staleTime: 30_000,
  });
  return <Badge n={data ?? 0} variant={variant} className={className} />;
}
