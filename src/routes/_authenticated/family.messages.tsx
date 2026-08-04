import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Send, ShieldAlert, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  listMyConversations,
  listMessages,
  markConversationRead,
  sendMessage,
} from "@/lib/messages.functions";
import {
  PageSkeleton,
  EmptyState,
  ErrorState,
  RouteErrorBoundary,
} from "@/components/carematch";

export const Route = createFileRoute("/_authenticated/family/messages")({
  component: FamilyMessages,
  errorComponent: RouteErrorBoundary,
});

function initialsOf(name: string | null | undefined) {
  if (!name) return "?";
  return name
    .split(" ")
    .map((s) => s[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function FamilyMessages() {
  const qc = useQueryClient();
  const fetchConvos = useServerFn(listMyConversations);
  const fetchMsgs = useServerFn(listMessages);
  const postMsg = useServerFn(sendMessage);
  const markRead = useServerFn(markConversationRead);

  const convosQ = useQuery({
    queryKey: ["conversations"],
    queryFn: () => fetchConvos(),
  });

  const rows = convosQ.data ?? [];
  const [activeId, setActiveId] = useState<string | null>(null);

  // Default-select the first conversation when data lands.
  useEffect(() => {
    if (!activeId && rows.length > 0) setActiveId(rows[0].id);
  }, [rows, activeId]);

  const otherIds = useMemo(() => rows.map((r) => r.other_user_id), [rows]);
  const profilesQ = useQuery({
    queryKey: ["profiles", "byIds", otherIds.slice().sort().join(",")],
    enabled: otherIds.length > 0,
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url")
        .in("id", otherIds);
      return data ?? [];
    },
  });

  const msgsQ = useQuery({
    queryKey: ["messages", activeId],
    enabled: !!activeId,
    queryFn: () => fetchMsgs({ data: { conversation_id: activeId! } }),
  });

  // Clear unread badge when viewing a thread.
  useEffect(() => {
    if (!activeId) return;
    markRead({ data: { conversation_id: activeId } })
      .then(() => qc.invalidateQueries({ queryKey: ["messages", "unread-count"] }))
      .catch(() => {});
  }, [activeId, markRead, qc]);

  const sendMut = useMutation({
    mutationFn: postMsg,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["messages", activeId] });
      qc.invalidateQueries({ queryKey: ["conversations"] });
    },
    onError: (e) =>
      toast.error(e instanceof Error ? e.message : "Message failed to send."),
  });

  const [draft, setDraft] = useState("");

  // Realtime refresh when new messages arrive in the active conversation.
  useEffect(() => {
    if (!activeId) return;
    const channel = supabase
      .channel(`messages-${activeId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${activeId}`,
        },
        () => qc.invalidateQueries({ queryKey: ["messages", activeId] }),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeId, qc]);

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

  const send = async () => {
    if (!draft.trim() || !activeId) return;
    const body = draft.trim();
    setDraft("");
    sendMut.mutate({ data: { conversation_id: activeId, body } });
  };

  const active = rows.find((r) => r.id === activeId);
  const activeName =
    profilesQ.data?.find((p) => p.id === active?.other_user_id)?.full_name ??
    "Caregiver";

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-widest text-muted-foreground">
          All communication on-platform
        </p>
        <h1 className="mt-1 font-serif text-3xl lg:text-4xl">Messages</h1>
      </div>

      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        <ShieldAlert className="mr-2 inline size-4" />
        Please keep caregiver conversations inside CompanionCare — the senior has to consent
        to any off-platform contact.
      </div>

      {rows.length === 0 ? (
        <EmptyState
          icon={<MessageCircle className="size-6" />}
          title="No conversations yet"
          description="Messages will appear here once the senior's caregivers reach out."
        />
      ) : (
        <div className="surface-card grid overflow-hidden lg:grid-cols-[280px_1fr]">
          <ul className="divide-y divide-border border-b border-border lg:border-b-0 lg:border-r">
            {rows.map((c) => {
              const p = profilesQ.data?.find((x) => x.id === c.other_user_id);
              const name = p?.full_name ?? "Caregiver";
              const isActive = c.id === activeId;
              return (
                <li key={c.id}>
                  <button
                    onClick={() => setActiveId(c.id)}
                    className={`flex w-full items-center gap-3 p-4 text-left hover:bg-secondary/40 ${
                      isActive ? "bg-secondary/60" : ""
                    }`}
                  >
                    <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-sage-100 font-serif text-sage-700">
                      {initialsOf(name)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate font-semibold">{name}</p>
                        <p className="shrink-0 text-xs text-muted-foreground">
                          {c.last_message_at
                            ? new Date(c.last_message_at).toLocaleDateString(
                                undefined,
                                { month: "short", day: "numeric" },
                              )
                            : ""}
                        </p>
                      </div>
                      <p className="truncate text-sm text-muted-foreground">
                        {c.last_message_preview ?? "No messages yet"}
                      </p>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>

          <div className="flex min-h-[420px] flex-col">
            <div className="border-b border-border p-4">
              <p className="font-semibold">{activeName}</p>
              <p className="text-xs text-muted-foreground">
                On-platform messaging · encrypted at rest
              </p>
            </div>
            <div className="flex-1 overflow-y-auto p-5">
              {msgsQ.isPending ? (
                <PageSkeleton cards={2} />
              ) : msgsQ.isError ? (
                <ErrorState
                  title="We couldn't load this thread"
                  error={msgsQ.error}
                  onRetry={() => msgsQ.refetch()}
                />
              ) : (msgsQ.data ?? []).length === 0 ? (
                <p className="text-center text-sm text-muted-foreground">
                  No messages yet — say hello.
                </p>
              ) : (
                <MessageList messages={msgsQ.data ?? []} />
              )}
            </div>
            <div className="flex flex-wrap gap-2 border-t border-border px-3 pt-3">
              {["Thank you!", "How did it go?", "Please call me", "Sounds good"].map(
                (q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => setDraft((d) => (d ? d + " " + q : q))}
                    disabled={!activeId || sendMut.isPending}
                    className="rounded-full border border-border bg-card px-3 py-1 text-xs font-medium hover:bg-secondary disabled:opacity-40"
                  >
                    {q}
                  </button>
                ),
              )}
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void send();
              }}
              className="flex items-center gap-2 p-3"
            >
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Write a message…"
                disabled={!activeId || sendMut.isPending}
                className="flex-1 rounded-full border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={!draft.trim() || !activeId || sendMut.isPending}
                aria-label="Send"
                className="grid size-11 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-40"
              >
                <Send className="size-4" />
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

type Msg = {
  id: string;
  sender_id: string;
  body: string;
  created_at: string;
};

function MessageList({ messages }: { messages: Msg[] }) {
  const meQ = useQuery({
    queryKey: ["auth", "userId"],
    queryFn: async () => {
      const { data } = await supabase.auth.getUser();
      return data.user?.id ?? null;
    },
  });
  const meId = meQ.data ?? "";
  return (
    <ul className="space-y-3">
      {messages.map((m) => {
        const mine = m.sender_id === meId;
        return (
          <li key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm ${
                mine
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground"
              }`}
            >
              <p>{m.body}</p>
              <p
                className={`mt-1 text-[10px] ${
                  mine ? "text-primary-foreground/70" : "text-muted-foreground"
                }`}
              >
                {new Date(m.created_at).toLocaleTimeString(undefined, {
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
