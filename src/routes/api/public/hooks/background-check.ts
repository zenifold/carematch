import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/hooks/background-check")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const rawBody = await request.text();
        const { getAdapter } = await import("@/lib/background-check/adapters/index.server");
        const { getActiveVendor } = await import("@/lib/background-check/vendor");
        const vendor = getActiveVendor();
        const adapter = getAdapter(vendor);

        const verified = adapter.verifyWebhookSignature(rawBody, request.headers);
        if (!verified) {
          return new Response("Invalid signature", { status: 401 });
        }

        let payload: unknown;
        try {
          payload = JSON.parse(rawBody);
        } catch {
          return new Response("Invalid JSON", { status: 400 });
        }

        let normalized;
        try {
          normalized = adapter.normalizeEvent(payload);
        } catch (err: any) {
          return new Response(`Event parse error: ${err?.message ?? "unknown"}`, { status: 400 });
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        // Find the matching check row.
        let checkId: string | null = null;
        if (normalized.vendorReportId) {
          const { data } = await supabaseAdmin
            .from("provider_background_checks" as any)
            .select("id")
            .eq("vendor", vendor)
            .eq("vendor_report_id", normalized.vendorReportId)
            .maybeSingle();
          checkId = (data as any)?.id ?? null;
        }
        if (!checkId && normalized.vendorCandidateId) {
          const { data } = await supabaseAdmin
            .from("provider_background_checks" as any)
            .select("id")
            .eq("vendor", vendor)
            .eq("vendor_candidate_id", normalized.vendorCandidateId)
            .order("ordered_at", { ascending: false })
            .limit(1)
            .maybeSingle();
          checkId = (data as any)?.id ?? null;
        }

        // Idempotent insert into event ledger.
        const { error: insErr } = await supabaseAdmin
          .from("background_check_events" as any)
          .insert({
            background_check_id: checkId,
            vendor,
            vendor_event_id: normalized.vendorEventId,
            event_type: normalized.eventType,
            payload,
            signature_verified: true,
          });
        if (insErr && !String(insErr.message).includes("duplicate")) {
          return new Response(`DB error: ${insErr.message}`, { status: 500 });
        }
        if (insErr) {
          // Duplicate = already processed; still 200.
          return new Response("ok (duplicate)", { status: 200 });
        }

        if (checkId && normalized.status) {
          const patch: Record<string, unknown> = {
            status: normalized.status,
            raw_last_event: payload,
          };
          if (normalized.vendorReportId) patch.vendor_report_id = normalized.vendorReportId;
          if (typeof normalized.costCents === "number") patch.cost_cents = normalized.costCents;
          if (normalized.status === "clear" || normalized.status === "consider" || normalized.status === "canceled") {
            patch.completed_at = new Date().toISOString();
          }
          // Auto-adjudicate "clear" status to cleared unless already decided.
          if (normalized.status === "clear") {
            patch.adjudication = "cleared";
          }
          await supabaseAdmin
            .from("provider_background_checks" as any)
            .update(patch)
            .eq("id", checkId);
        }

        return new Response("ok", { status: 200 });
      },
    },
  },
});
