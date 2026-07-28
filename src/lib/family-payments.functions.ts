import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const SeniorIdSchema = z.object({ senior_id: z.string().uuid() });

/** Self, or an approved family_link with the 'financial' tier specifically —
 * matches that tier's own description ("Manage payment methods and see all
 * transactions"). view/modify family members can see the budget but not this. */
async function assertFinancialAccess(
  context: { supabase: any; userId: string },
  seniorId: string,
) {
  if (context.userId === seniorId) return;
  const { data: link } = await context.supabase
    .from("family_links")
    .select("permission")
    .eq("senior_id", seniorId)
    .eq("family_id", context.userId)
    .eq("approved", true)
    .maybeSingle();
  if (!link || link.permission !== "financial") throw new Error("Forbidden");
}

export type PaymentMethodStatus = {
  configured: boolean;
  has_payment_method: boolean;
  brand: string | null;
  last4: string | null;
};

export const getPaymentMethodStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => SeniorIdSchema.parse(i))
  .handler(async ({ data, context }): Promise<PaymentMethodStatus> => {
    await assertFinancialAccess(context, data.senior_id);
    const { isStripeConfigured } = await import("@/lib/stripe/client.server");
    const { data: row, error } = await context.supabase
      .from("profiles")
      .select("stripe_payment_method_id, stripe_pm_brand, stripe_pm_last4")
      .eq("id", data.senior_id)
      .maybeSingle();
    if (error) throw error;
    return {
      configured: isStripeConfigured(),
      has_payment_method: !!row?.stripe_payment_method_id,
      brand: row?.stripe_pm_brand ?? null,
      last4: row?.stripe_pm_last4 ?? null,
    };
  });

const StartSetupInput = z.object({
  senior_id: z.string().uuid(),
  /** Client passes window.location.origin + a return path — same convention
   * as idv.functions.ts and startConnectOnboarding. */
  returnUrl: z.string().url().optional(),
});

/**
 * Creates (or reuses) a Stripe Customer for the senior and returns a Stripe
 * Checkout Session URL in "setup" mode — collects and saves a card without
 * charging anything. The actual card never touches CareMatch's server.
 */
export const startAddPaymentMethod = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => StartSetupInput.parse(i))
  .handler(async ({ data, context }): Promise<{ url: string }> => {
    await assertFinancialAccess(context, data.senior_id);
    const { stripe } = await import("@/lib/stripe/client.server");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: profile, error: profErr } = await supabaseAdmin
      .from("profiles")
      .select("full_name, stripe_customer_id")
      .eq("id", data.senior_id)
      .maybeSingle();
    if (profErr) throw profErr;
    if (!profile) throw new Error("Senior profile not found.");

    let customerId = profile.stripe_customer_id;
    if (!customerId) {
      const { data: userR } = await supabaseAdmin.auth.admin.getUserById(data.senior_id);
      const customer = await stripe.customers.create({
        name: profile.full_name ?? undefined,
        email: userR?.user?.email ?? undefined,
        metadata: { senior_id: data.senior_id },
      });
      customerId = customer.id;
      const { error: updErr } = await supabaseAdmin
        .from("profiles")
        .update({ stripe_customer_id: customerId })
        .eq("id", data.senior_id);
      if (updErr) throw updErr;
    }

    const returnUrl = data.returnUrl ?? "https://carematcher.lovable.app/family/budget";
    const session = await stripe.checkout.sessions.create({
      mode: "setup",
      customer: customerId,
      payment_method_types: ["card"],
      success_url: returnUrl,
      cancel_url: returnUrl,
    });
    if (!session.url) throw new Error("Stripe did not return a checkout URL.");
    return { url: session.url };
  });

export const removePaymentMethod = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => SeniorIdSchema.parse(i))
  .handler(async ({ data, context }): Promise<{ ok: true }> => {
    await assertFinancialAccess(context, data.senior_id);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("stripe_payment_method_id")
      .eq("id", data.senior_id)
      .maybeSingle();
    if (profile?.stripe_payment_method_id) {
      const { stripe } = await import("@/lib/stripe/client.server");
      await stripe.paymentMethods.detach(profile.stripe_payment_method_id).catch(() => {
        // Already detached or invalid — fine, we're clearing our own record either way.
      });
    }
    const { error } = await supabaseAdmin
      .from("profiles")
      .update({
        stripe_payment_method_id: null,
        stripe_pm_brand: null,
        stripe_pm_last4: null,
      })
      .eq("id", data.senior_id);
    if (error) throw error;
    return { ok: true };
  });
