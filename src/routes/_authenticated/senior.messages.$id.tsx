import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { listMessages, markConversationRead, sendMessage } from "@/lib/messages.functions";
import { VoiceInput } from "@/components/carematch";
import { toast } from "sonner";

const QUICK_REPLIES = [
  "Thank you!",
  "See you soon",
  "Running a bit late",
  "Sounds good",
  "Please call me",
];

export const Route = createFileRoute("/_authenticated/senior/messages/$id")({
  component: MessageThread,
});

type MessageRow = {
  id: string;
  sender_id: string;
  body: string;
  created_at: string;
  read_at: string | null;
};

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function MessageThread() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const fetchMessages = useServerFn(listMessages);
  const post = useServerFn(sendMessage);
  const markRead = useServerFn(markConversationRead);

  const [me, setMe] = useState<string | null>(null);
  const [draft, setDraft] = useState("");

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setMe(data.user?.id ?? null));
  }, []);

  const key = ["messages", id];
  const messagesQ = useQuery({
    queryKey: key,
    queryFn: () => fetchMessages({ data: { conversation_id: id } }),
  });

  const bottomRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messagesQ.data?.length]);

  // Clear unread badge when opening the thread.
  useEffect(() => {
    markRead({ data: { conversation_id: id } })
      .then(() => qc.invalidateQueries({ queryKey: ["messages", "unread-count"] }))
      .catch(() => {});
  }, [id, markRead, qc]);

  // Realtime: append inserts for this conversation.
  useEffect(() => {
    const channel = supabase
      .channel(`messages:${id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${id}`,
        },
        (payload) => {
          qc.setQueryData<MessageRow[] | undefined>(key, (prev) => {
            const row = payload.new as MessageRow;
            if (!prev) return [row];
            if (prev.some((m) => m.id === row.id)) return prev;
            return [...prev, row];
          });
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [id, qc]);

  const otherId = messagesQ.data?.find((m) => m.sender_id !== me)?.sender_id ?? null;

  const otherQ = useQuery({
    queryKey: ["profile", otherId],
    enabled: !!otherId,
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", otherId!)
        .maybeSingle();
      return data;
    },
  });

  const sendBody = async (body: string) => {
    const text = body.trim();
    if (!text) return;
    try {
      const row = await post({ data: { conversation_id: id, body: text } });
      qc.setQueryData<MessageRow[] | undefined>(key, (prev) =>
        prev ? (prev.some((m) => m.id === row.id) ? prev : [...prev, row]) : [row],
      );
    } catch {
      toast.error("Couldn't send — try again.");
      throw new Error("send failed");
    }
  };

  const send = async () => {
    const body = draft.trim();
    if (!body) return;
    setDraft("");
    try {
      await sendBody(body);
    } catch {
      setDraft(body);
    }
  };

  const sendQuick = async (text: string) => {
    try {
      await sendBody(text);
    } catch {
      /* toast already shown */
    }
  };

  const otherName = otherQ.data?.full_name ?? "Caregiver";

  return (
    <div>
      <div className="mb-5 flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate({ to: "/senior/messages" })}
          aria-label="Back to messages"
          className="grid size-11 place-items-center rounded-full border border-input hover:bg-secondary"
        >
          <ArrowLeft className="size-5" />
        </button>
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-sage-100 font-serif text-base text-sage-700">
            {otherName
              .split(" ")
              .map((s) => s[0])
              .join("")
              .slice(0, 2)
              .toUpperCase()}
          </span>
          <p className="truncate text-xl font-semibold">{otherName}</p>
        </div>
      </div>

      {messagesQ.isLoading ? (
        <p className="text-muted-foreground">Loading messages…</p>
      ) : messagesQ.isError ? (
        <div>
          <p className="text-destructive">Couldn't load this conversation.</p>
          <Link
            to="/senior/messages"
            className="mt-2 inline-block font-semibold text-primary underline-offset-4 hover:underline"
          >
            Back to messages
          </Link>
        </div>
      ) : (
        <ul className="grid gap-3">
          {(messagesQ.data ?? []).map((m) => {
            const mine = m.sender_id === me;
            return (
              <li key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[80%] rounded-3xl px-5 py-3 text-lg ${
                    mine
                      ? "bg-primary text-primary-foreground"
                      : "border border-border bg-card text-foreground"
                  }`}
                >
                  <p>{m.body}</p>
                  <p
                    className={`mt-1 text-xs ${
                      mine ? "text-primary-foreground/70" : "text-muted-foreground"
                    }`}
                  >
                    {fmtTime(m.created_at)}
                  </p>
                </div>
              </li>
            );
          })}
          {(messagesQ.data ?? []).length === 0 && (
            <li className="text-center text-muted-foreground">Say hello to start the thread.</li>
          )}
          <li ref={bottomRef as unknown as React.Ref<HTMLLIElement>} aria-hidden />
        </ul>
      )}

      <div className="mt-6">
        <div className="mb-3 flex flex-wrap gap-2">
          {QUICK_REPLIES.map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => sendQuick(q)}
              className="inline-flex min-h-11 items-center rounded-full border-2 border-input bg-card px-4 text-base font-semibold hover:border-primary hover:bg-primary/5"
            >
              {q}
            </button>
          ))}
        </div>
        <VoiceInput
          value={draft}
          onChange={setDraft}
          label="Your message"
          placeholder="Type or tap the mic to speak…"
        />
        <button
          type="button"
          onClick={send}
          disabled={!draft.trim()}
          className="mt-3 flex min-h-14 w-full items-center justify-center gap-2 rounded-full bg-primary text-lg font-semibold text-primary-foreground shadow-soft hover:bg-primary/90 disabled:opacity-40"
        >
          <Send className="size-5" /> Send
        </button>
      </div>
    </div>
  );
}
