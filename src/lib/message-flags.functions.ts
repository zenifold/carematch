import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const TRUST_SAFETY_STAFF = ["admin", "trust_safety", "staff", "support"] as const;

async function isTrustSafetyStaff(context: { supabase: any; userId: string }) {
  const { data, error } = await context.supabase.rpc("has_any_role", {
    _user_id: context.userId,
    _roles: TRUST_SAFETY_STAFF,
  });
  if (error) throw error;
  return !!data;
}

export type MessageFlagReason = "phone_number" | "email_address" | "offplatform_phrase";

export type MessageFlagRow = {
  id: string;
  message_id: string;
  conversation_id: string;
  sender_id: string;
  sender_name: string | null;
  reason: MessageFlagReason;
  matched_text: string | null;
  reviewed_at: string | null;
  dismissed: boolean;
  created_at: string;
};

const ListInput = z
  .object({ status: z.enum(["unreviewed", "all"]).optional().default("unreviewed") })
  .optional();

/** Trust & safety review queue for auto-flagged off-platform-migration attempts. */
export const listMessageFlags = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => ListInput.parse(i ?? {}))
  .handler(async ({ data, context }): Promise<MessageFlagRow[]> => {
    if (!(await isTrustSafetyStaff(context))) throw new Error("Forbidden");

    let q = context.supabase
      .from("message_flags")
      .select("id, message_id, conversation_id, sender_id, reason, matched_text, reviewed_at, dismissed, created_at")
      .order("created_at", { ascending: false })
      .limit(200);
    if (data?.status !== "all") q = q.is("reviewed_at", null);

    const { data: rows, error } = await q;
    if (error) throw error;

    const ids = Array.from(new Set((rows ?? []).map((r: any) => r.sender_id)));
    let nameMap = new Map<string, string | null>();
    if (ids.length > 0) {
      const { data: profs } = await context.supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", ids);
      nameMap = new Map((profs ?? []).map((p: any) => [p.id, p.full_name]));
    }

    return (rows ?? []).map((r: any) => ({
      ...r,
      sender_name: nameMap.get(r.sender_id) ?? null,
    }));
  });

const ResolveInput = z.object({
  id: z.string().uuid(),
  dismissed: z.boolean(),
});

/** Mark a flag reviewed. dismissed=true means "false positive, no action" —
 * false means "confirmed, handled outside this queue" (e.g. a warning sent). */
export const resolveMessageFlag = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => ResolveInput.parse(i))
  .handler(async ({ data, context }): Promise<{ ok: true }> => {
    if (!(await isTrustSafetyStaff(context))) throw new Error("Forbidden");
    const { error } = await context.supabase
      .from("message_flags")
      .update({
        reviewed_at: new Date().toISOString(),
        reviewed_by: context.userId,
        dismissed: data.dismissed,
      })
      .eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });
