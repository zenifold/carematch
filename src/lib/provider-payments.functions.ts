import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type ConnectStatus = {
  configured: boolean;
  has_account: boolean;
  charges_enabled: boolean;
  payouts_enabled: boolean;
  details_submitted: boolean;
};

/** The provider's own Stripe Connect onboarding state — read-only, source of
 * truth is the account.updated webhook, not this call. */
export const getMyConnectStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<ConnectStatus> => {
    const { isStripeConfigured } = await import("@/lib/stripe/client.server");
    const { data, error } = await context.supabase
      .from("providers")
      .select("stripe_account_id, stripe_charges_enabled, stripe_payouts_enabled, stripe_details_submitted")
      .eq("id", context.userId)
      .maybeSingle();
    if (error) throw error;
    return {
      configured: isStripeConfigured(),
      has_account: !!data?.stripe_account_id,
      charges_enabled: data?.stripe_charges_enabled ?? false,
      payouts_enabled: data?.stripe_payouts_enabled ?? false,
      details_submitted: data?.stripe_details_submitted ?? false,
    };
  });

const OnboardingInput = z.object({
  /** Client passes window.location.origin + "/provider/payments" — the
   * server can't know the real origin (dev vs prod), same convention as
   * idv.functions.ts's returnUrl. */
  returnUrl: z.string().url().optional(),
});

/**
 * Creates (or reuses) a Stripe Express account for this provider and returns
 * a one-time Account Link URL for Stripe's hosted onboarding. Payout
 * eligibility (charges_enabled/payouts_enabled) is only ever set by the
 * account.updated webhook — this call never marks a provider payable itself,
 * since finishing the redirect doesn't guarantee Stripe actually approved them.
 */
export const startConnectOnboarding = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => OnboardingInput.parse(i ?? {}))
  .handler(async ({ data, context }): Promise<{ url: string }> => {
    const { stripe } = await import("@/lib/stripe/client.server");

    const { data: provider, error: provErr } = await context.supabase
      .from("providers")
      .select("stripe_account_id")
      .eq("id", context.userId)
      .maybeSingle();
    if (provErr) throw provErr;
    if (!provider) throw new Error("Provider profile not found.");

    let accountId = provider.stripe_account_id;
    if (!accountId) {
      const account = await stripe.accounts.create({
        type: "express",
        email: (context.claims.email as string | undefined) ?? undefined,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        business_type: "individual",
      });
      accountId = account.id;
      const { error: updErr } = await context.supabase
        .from("providers")
        .update({ stripe_account_id: accountId })
        .eq("id", context.userId);
      if (updErr) throw updErr;
    }

    const returnUrl = data.returnUrl ?? "https://getcompanioncare.com/provider/payments";
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      type: "account_onboarding",
      refresh_url: returnUrl,
      return_url: returnUrl,
    });
    return { url: accountLink.url };
  });
