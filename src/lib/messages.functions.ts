import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Ensures a conversation row exists between the current user and `other_user_id`.
 * `participants_ordered` (a < b) makes the pair canonical and the UNIQUE constraint
 * dedupes; we sort here to satisfy the check.
 */
export const ensureConversation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ other_user_id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const me = context.userId;
    const other = data.other_user_id;
    if (me === other) throw new Error("Cannot open a conversation with yourself");
    const [a, b] = me < other ? [me, other] : [other, me];

    const { data: existing } = await context.supabase
      .from("conversations")
      .select("id")
      .eq("participant_a", a)
      .eq("participant_b", b)
      .maybeSingle();
    if (existing) return { id: existing.id };

    const { data: row, error } = await context.supabase
      .from("conversations")
      .insert({ participant_a: a, participant_b: b })
      .select("id")
      .single();
    if (error) throw error;
    return { id: row.id };
  });

export const listMyConversations = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const me = context.userId;
    const { data, error } = await context.supabase
      .from("conversations")
      .select("id, participant_a, participant_b, last_message_at, last_message_preview")
      .or(`participant_a.eq.${me},participant_b.eq.${me}`)
      .order("last_message_at", { ascending: false, nullsFirst: false });
    if (error) throw error;
    return (data ?? []).map((c) => ({
      id: c.id,
      other_user_id: c.participant_a === me ? c.participant_b : c.participant_a,
      last_message_at: c.last_message_at,
      last_message_preview: c.last_message_preview,
    }));
  });

export const listMessages = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ conversation_id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase
      .from("messages")
      .select("id, sender_id, body, created_at, read_at")
      .eq("conversation_id", data.conversation_id)
      .order("created_at", { ascending: true });
    if (error) throw error;
    return rows;
  });

export const sendMessage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({
      conversation_id: z.string().uuid(),
      body: z.string().min(1).max(4000),
    }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("messages")
      .insert({
        conversation_id: data.conversation_id,
        sender_id: context.userId,
        body: data.body,
      })
      .select("id, sender_id, body, created_at, read_at")
      .single();
    if (error) throw error;
    return row;
  });

/** Count of messages addressed to the current user that are still unread. */
export const getUnreadMessageCount = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<number> => {
    const me = context.userId;
    const { data: convos, error: cErr } = await context.supabase
      .from("conversations")
      .select("id")
      .or(`participant_a.eq.${me},participant_b.eq.${me}`);
    if (cErr) throw cErr;
    const ids = (convos ?? []).map((c) => c.id);
    if (ids.length === 0) return 0;
    const { count, error } = await context.supabase
      .from("messages")
      .select("id", { count: "exact", head: true })
      .in("conversation_id", ids)
      .neq("sender_id", me)
      .is("read_at", null);
    if (error) throw error;
    return count ?? 0;
  });

/** Mark all inbound messages in a conversation as read. */
export const markConversationRead = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ conversation_id: z.string().uuid() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("messages")
      .update({ read_at: new Date().toISOString() })
      .eq("conversation_id", data.conversation_id)
      .neq("sender_id", context.userId)
      .is("read_at", null);
    if (error) throw error;
    return { ok: true };
  });
