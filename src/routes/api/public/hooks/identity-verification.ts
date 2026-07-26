import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/hooks/identity-verification")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const rawBody = await request.text();
        const { getActiveIdvVendor } = await import("@/lib/idv/vendor");
        const { getIdvAdapter } = await import("@/lib/idv/adapters/index.server");
        const vendor = getActiveIdvVendor();
        const adapter = getIdvAdapter(vendor);

        if (!adapter.verifyWebhookSignature(rawBody, request.headers)) {
          return new Response("Invalid signature", { status: 401 });
        }

        const evt = adapter.parseEvent(rawBody);
        if (!evt) return new Response("ok (ignored)", { status: 200 });

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        const patch: Record<string, unknown> = {
          status: evt.status,
          raw_last_event: JSON.parse(rawBody),
        };
        if (evt.vendorReportId) patch.vendor_report_id = evt.vendorReportId;
        if (evt.errorMessage) patch.last_error = evt.errorMessage;
        if (evt.status === "verified") patch.verified_at = new Date().toISOString();

        const { error } = await supabaseAdmin
          .from("provider_identity_verifications" as any)
          .update(patch)
          .eq("vendor", vendor)
          .eq("vendor_session_id", evt.vendorSessionId);

        if (error) return new Response(`DB error: ${error.message}`, { status: 500 });
        return new Response("ok", { status: 200 });
      },
    },
  },
});
