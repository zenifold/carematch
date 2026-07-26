import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  COMPANION_BASICS_V1,
  scoreAnswers,
  toClientModule,
  type ClientModule,
} from "@/lib/provider-training-content";

const MODULES = {
  companion_basics_v1: COMPANION_BASICS_V1,
} as const;

type ModuleCode = keyof typeof MODULES;

/**
 * Client-safe module content (no answer key) + this provider's completion.
 */
export const getTrainingModule = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({ code: z.enum(["companion_basics_v1"]) }).parse(i),
  )
  .handler(async ({ data, context }) => {
    const mod = MODULES[data.code as ModuleCode];
    const { data: completion } = await context.supabase
      .from("provider_module_completions")
      .select("score, total, passed, attempts, passed_at")
      .eq("provider_id", context.userId)
      .eq("module_code", data.code)
      .maybeSingle();
    return {
      module: toClientModule(mod) as ClientModule,
      completion: completion ?? null,
    };
  });

/**
 * Score the caregiver's answers server-side, record attempt, return per-question feedback.
 */
export const submitTrainingQuiz = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z
      .object({
        code: z.enum(["companion_basics_v1"]),
        answers: z.record(z.string(), z.number().int().min(0).max(10)),
      })
      .parse(i),
  )
  .handler(async ({ data, context }) => {
    const mod = MODULES[data.code as ModuleCode];
    const scored = scoreAnswers(mod, data.answers);

    // Writes go through the service-role client: RLS forbids providers
    // from writing their own grade rows, so the server records them after
    // grading the answers itself.
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: existing } = await supabaseAdmin
      .from("provider_module_completions")
      .select("id, attempts, passed_at, passed")
      .eq("provider_id", context.userId)
      .eq("module_code", data.code)
      .maybeSingle();

    const passed_at = scored.passed
      ? existing?.passed_at ?? new Date().toISOString()
      : existing?.passed_at ?? null;

    if (existing) {
      const { error } = await supabaseAdmin
        .from("provider_module_completions")
        .update({
          score: scored.score,
          total: scored.total,
          passed: scored.passed || existing.passed,
          attempts: (existing.attempts ?? 0) + 1,
          passed_at,
        })
        .eq("id", existing.id);
      if (error) throw error;
    } else {
      const { error } = await supabaseAdmin
        .from("provider_module_completions")
        .insert({
          provider_id: context.userId,
          module_code: data.code,
          score: scored.score,
          total: scored.total,
          passed: scored.passed,
          attempts: 1,
          passed_at,
        });
      if (error) throw error;
    }

    return scored;
  });

/**
 * Summary card: which modules are required for this provider's chosen tier,
 * and which are done. Used on the provider dashboard.
 */
export const getMyTrainingStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: provider } = await context.supabase
      .from("providers")
      .select("service_tier, verification_state")
      .eq("id", context.userId)
      .maybeSingle();

    const { data: modules } = await context.supabase
      .from("provider_training_modules")
      .select("code, title, required_for_tier, is_active")
      .eq("is_active", true)
      .order("required_for_tier", { ascending: true });

    const { data: completions } = await context.supabase
      .from("provider_module_completions")
      .select("module_code, passed, passed_at, score, total")
      .eq("provider_id", context.userId);

    const compMap = new Map((completions ?? []).map((c) => [c.module_code, c]));
    return {
      verification_state: provider?.verification_state ?? "pending",
      service_tier: provider?.service_tier ?? 0,
      modules: (modules ?? []).map((m) => ({
        code: m.code,
        title: m.title,
        required_for_tier: m.required_for_tier,
        completion: compMap.get(m.code) ?? null,
      })),
    };
  });
