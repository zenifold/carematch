import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { getActiveIdvVendor } from "@/lib/idv/vendor";

async function upsertManualIdvRow(userId: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { error } = await supabaseAdmin.from("provider_identity_verifications" as any).upsert(
    {
      provider_id: userId,
      vendor: "manual",
      status: "processing",
      hosted_url: null,
      last_error: null,
    } as any,
    { onConflict: "provider_id,vendor" },
  );
  if (error) throw new Error(error.message);
}

const StartSchema = z.object({
  returnUrl: z.string().url().optional(),
});

export const getMyIdv = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("provider_identity_verifications" as any)
      .select(
        "id, status, hosted_url, vendor, vendor_session_id, last_error, verified_at, updated_at, created_at",
      )
      .eq("provider_id", userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return { row: data as any, active_vendor: getActiveIdvVendor() };
  });

export const startIdvSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => StartSchema.parse(raw ?? {}))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    // Load profile for name/email
    const { data: prof } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", userId)
      .maybeSingle();

    const { data: authUser } = await supabase.auth.getUser();
    const email = authUser?.user?.email ?? "";
    const fullName = (prof as any)?.full_name ?? email;

    // If a verified row already exists, short-circuit.
    const { data: existing } = await supabase
      .from("provider_identity_verifications" as any)
      .select("id, status, hosted_url, vendor_session_id")
      .eq("provider_id", userId)
      .maybeSingle();

    if ((existing as any)?.status === "verified") {
      return { hosted_url: null, status: "verified" as const, already: true };
    }

    // Re-use a still-open session if present.
    if (
      (existing as any)?.hosted_url &&
      ["processing", "requires_input"].includes((existing as any)?.status)
    ) {
      return {
        hosted_url: (existing as any).hosted_url,
        status: (existing as any).status,
        already: false,
      };
    }

    const vendor = getActiveIdvVendor();

    if (vendor === "manual") {
      // No vendor configured — queue for manual admin review (see the
      // credentials queue) instead of calling out to a vendor API that
      // doesn't exist yet.
      await upsertManualIdvRow(userId);
      return { hosted_url: null, status: "processing" as const, already: false };
    }

    const { getIdvAdapter } = await import("@/lib/idv/adapters/index.server");
    const adapter = getIdvAdapter(vendor);

    const returnUrl =
      data.returnUrl ?? "https://carematcher.lovable.app/provider/identity-verification";
    const session = await adapter.createSession({
      providerId: userId,
      email,
      fullName,
      returnUrl,
    });

    // Persist via admin (bypasses RLS write; row belongs to this user).
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error: upErr } = await supabaseAdmin
      .from("provider_identity_verifications" as any)
      .upsert(
        {
          provider_id: userId,
          vendor,
          vendor_session_id: session.vendorSessionId,
          client_secret: session.clientSecret,
          hosted_url: session.hostedUrl,
          status: "processing",
          last_error: null,
        } as any,
        { onConflict: "provider_id,vendor" },
      );
    if (upErr) throw new Error(upErr.message);

    return { hosted_url: session.hostedUrl, status: "processing" as const, already: false };
  });
