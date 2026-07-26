import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listMyIncomingRequests } from "@/lib/change-requests.functions";

/** Badge showing count of pending change requests awaiting the senior's action. */
export function IncomingRequestsBadge({
  variant = "count",
  className = "",
}: {
  variant?: "count" | "dot";
  className?: string;
}) {
  const fn = useServerFn(listMyIncomingRequests);
  const { data } = useQuery({
    queryKey: ["senior", "requests", "incoming"],
    queryFn: () => fn(),
    refetchInterval: 30_000,
    staleTime: 15_000,
  });
  const n = (data ?? []).filter((r) => r.status === "pending").length;
  if (n <= 0) return null;
  if (variant === "dot") {
    return (
      <span
        aria-label={`${n} pending requests`}
        className={`size-2 rounded-full bg-destructive ${className}`}
      />
    );
  }
  return (
    <span
      aria-label={`${n} pending requests`}
      className={`inline-flex min-w-5 items-center justify-center rounded-full bg-destructive px-1.5 text-[10px] font-bold leading-none text-destructive-foreground ${className}`}
    >
      {n > 99 ? "99+" : n}
    </span>
  );
}
