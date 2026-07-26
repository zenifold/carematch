import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { listMyConversations } from "@/lib/messages.functions";
import {
  PageSkeleton,
  EmptyState,
  ErrorState,
  RouteErrorBoundary,
} from "@/components/carematch";
import { MessageCircle } from "lucide-react";

export const Route = createFileRoute("/_authenticated/senior/messages/")({
  component: MessagesList,
  errorComponent: RouteErrorBoundary,
});

type Row = {
  id: string;
  other_user_id: string;
  last_message_at: string | null;
  last_message_preview: string | null;
};

function initialsFor(name: string) {
  return name
    .split(" ")
    .map((s) => s[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function formatWhen(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  if (sameDay) return d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  const diff = (now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24);
  if (diff < 7) return d.toLocaleDateString(undefined, { weekday: "short" });
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function MessagesList() {
  const fetchConvos = useServerFn(listMyConversations);
  const convosQ = useQuery({ queryKey: ["conversations"], queryFn: () => fetchConvos() });

  const rows: Row[] = convosQ.data ?? [];
  const otherIds = rows.map((r) => r.other_user_id);

  const profilesQ = useQuery({
    queryKey: ["profiles", "byIds", otherIds.sort().join(",")],
    enabled: otherIds.length > 0,
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url")
        .in("id", otherIds);
      return data ?? [];
    },
  });

  // Per-conversation unread — derive from messages sent by the other party.
  const convoIds = rows.map((r) => r.id);
  const unreadQ = useQuery({
    queryKey: ["conversations", "unread-by-id", convoIds.sort().join(",")],
    enabled: convoIds.length > 0,
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      const me = u.user?.id;
      if (!me) return {} as Record<string, number>;
      const { data } = await supabase
        .from("messages")
        .select("conversation_id")
        .in("conversation_id", convoIds)
        .neq("sender_id", me)
        .is("read_at", null);
      const counts: Record<string, number> = {};
      for (const m of data ?? []) {
        counts[m.conversation_id] = (counts[m.conversation_id] ?? 0) + 1;
      }
      return counts;
    },
  });

  useEffect(() => {
    const channel = supabase
      .channel("senior-conversations")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "conversations" },
        () => convosQ.refetch(),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "messages" },
        () => unreadQ.refetch(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [convosQ, unreadQ]);

  if (convosQ.isPending) {
    return <PageSkeleton title="messages" cards={3} />;
  }
  if (convosQ.isError) {
    return (
      <ErrorState
        title="We couldn't load your messages"
        error={convosQ.error}
        onRetry={() => convosQ.refetch()}
      />
    );
  }

  // Sort: unread first, then most recent activity.
  const unreadMap = unreadQ.data ?? {};
  const sorted = [...rows].sort((a, b) => {
    const ua = unreadMap[a.id] ?? 0;
    const ub = unreadMap[b.id] ?? 0;
    if ((ua > 0) !== (ub > 0)) return ua > 0 ? -1 : 1;
    const ta = a.last_message_at ? new Date(a.last_message_at).getTime() : 0;
    const tb = b.last_message_at ? new Date(b.last_message_at).getTime() : 0;
    return tb - ta;
  });

  const totalUnread = Object.values(unreadMap).reduce((s, n) => s + n, 0);

  return (
    <div>
      <h1 className="font-serif text-3xl">Messages</h1>
      <p className="mt-2 text-lg text-muted-foreground">
        {totalUnread > 0
          ? `You have ${totalUnread} new message${totalUnread === 1 ? "" : "s"}.`
          : "Text your caregivers or the concierge. Tap the mic to speak."}
      </p>

      {rows.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            icon={<MessageCircle className="size-6" />}
            title="No conversations yet"
            description="Once you book a caregiver, you can message them here."
          />
        </div>
      ) : (
        <ul className="mt-6 grid gap-3">
          {sorted.map((c) => {
            const p = profilesQ.data?.find((x) => x.id === c.other_user_id);
            const name = p?.full_name ?? "Caregiver";
            const unread = unreadMap[c.id] ?? 0;
            return (
              <li key={c.id}>
                <Link
                  to="/senior/messages/$id"
                  params={{ id: c.id }}
                  className={`grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-4 rounded-2xl border p-5 transition ${
                    unread > 0
                      ? "border-primary/40 bg-primary/5 hover:bg-primary/10"
                      : "border-border bg-card hover:bg-secondary"
                  }`}
                >
                  <span className="relative grid size-14 shrink-0 place-items-center rounded-2xl bg-sage-100 font-serif text-lg text-sage-700">
                    {initialsFor(name)}
                    {unread > 0 && (
                      <span className="absolute -right-1 -top-1 grid min-h-6 min-w-6 place-items-center rounded-full bg-primary px-1.5 text-xs font-bold text-primary-foreground shadow-soft">
                        {unread}
                      </span>
                    )}
                  </span>
                  <div className="min-w-0">
                    <p className={`truncate text-lg ${unread > 0 ? "font-bold" : "font-semibold"}`}>
                      {name}
                    </p>
                    <p
                      className={`truncate text-base ${
                        unread > 0 ? "font-medium text-foreground" : "text-muted-foreground"
                      }`}
                    >
                      {c.last_message_preview ?? "No messages yet"}
                    </p>
                  </div>
                  <span className="shrink-0 text-sm text-muted-foreground">
                    {c.last_message_at ? formatWhen(c.last_message_at) : ""}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
