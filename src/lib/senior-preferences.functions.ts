import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const PrefsSchema = z.object({
  text_size: z.enum(["normal", "large", "xlarge"]),
  high_contrast: z.boolean(),
  reduce_motion: z.boolean(),
  notify_before_visit: z.boolean(),
  call_for_changes: z.boolean(),
  family_can_see: z.boolean(),
  family_can_edit: z.boolean(),
});

export type SeniorPreferencesRow = z.infer<typeof PrefsSchema>;

export const getSeniorPreferences = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("senior_preferences")
      .select("text_size, high_contrast, reduce_motion, notify_before_visit, call_for_changes, family_can_see, family_can_edit")
      .eq("user_id", context.userId)
      .maybeSingle();
    if (error) throw error;
    return data as SeniorPreferencesRow | null;
  });

export const upsertSeniorPreferences = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => PrefsSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("senior_preferences")
      .upsert({ user_id: context.userId, ...data }, { onConflict: "user_id" });
    if (error) throw error;
    return { ok: true };
  });
