import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getUnreadMessageCount } from "@/lib/messages.functions";

/** Reusable hook — used by shells to badge the messages tab / bell. */
export function useUnreadMessageCount() {
  const fn = useServerFn(getUnreadMessageCount);
  return useQuery({
    queryKey: ["messages", "unread-count"],
    queryFn: () => fn(),
    refetchInterval: 30_000,
    staleTime: 15_000,
  });
}

/**
 * Small red badge with an integer count. Renders nothing when 0.
 * `variant="dot"` renders just a dot (useful when space is tight).
 */
export function UnreadMessagesBadge({
  variant = "count",
  className = "",
}: {
  variant?: "count" | "dot";
  className?: string;
}) {
  const { data } = useUnreadMessageCount();
  const n = data ?? 0;
  if (n <= 0) return null;
  if (variant === "dot") {
    return (
      <span
        aria-label={`${n} unread`}
        className={`size-2 rounded-full bg-destructive ${className}`}
      />
    );
  }
  return (
    <span
      aria-label={`${n} unread messages`}
      className={`inline-flex min-w-5 items-center justify-center rounded-full bg-destructive px-1.5 text-[10px] font-bold leading-none text-destructive-foreground ${className}`}
    >
      {n > 99 ? "99+" : n}
    </span>
  );
}
