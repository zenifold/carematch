import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ShieldCheck, Loader2, ExternalLink, AlertTriangle, CheckCircle2, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { getMyIdv, startIdvSession } from "@/lib/idv.functions";
import { Button } from "@/components/ui/button";
import { RouteErrorBoundary } from "@/components/carematch";

export const Route = createFileRoute("/_authenticated/provider/identity-verification")({
  component: IdvPage,
  errorComponent: RouteErrorBoundary,
});

function statusCopy(status: string) {
  switch (status) {
    case "not_started": return "You haven't started identity verification yet.";
    case "processing": return "We're reviewing your ID and selfie. Usually takes under a minute.";
    case "requires_input": return "We need another photo or a clearer image. Continue below.";
    case "verified": return "Identity verified. You can now start your background check.";
    case "canceled": return "Verification was canceled. Start again below.";
    case "failed": return "Verification failed. Please try again or contact support.";
    default: return status;
  }
}

function IdvPage() {
  const getFn = useServerFn(getMyIdv);
  const startFn = useServerFn(startIdvSession);
  const q = useQuery({ queryKey: ["provider", "idv"], queryFn: () => getFn(), refetchInterval: 8000 });
  const [busy, setBusy] = useState(false);

  const row = q.data?.row;
  const status = row?.status ?? "not_started";

  const start = async () => {
    setBusy(true);
    try {
      const returnUrl = `${window.location.origin}/provider/identity-verification`;
      const res = await startFn({ data: { returnUrl } });
      if (res.hosted_url) {
        window.location.href = res.hosted_url;
      } else if (res.status === "verified") {
        toast.success("Already verified.");
        await q.refetch();
      }
    } catch (err: any) {
      toast.error(err?.message ?? "Could not start verification.");
    } finally {
      setBusy(false);
    }
  };

  if (q.isLoading) return <div className="p-6"><Loader2 className="size-5 animate-spin" /></div>;

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6">
      <div className="flex items-center gap-2">
        <ShieldCheck className="size-6 text-primary" />
        <h1 className="text-2xl font-semibold">Identity verification</h1>
      </div>

      <div className="rounded-xl border p-5 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm text-muted-foreground">Current status</p>
            <p className="text-xl font-semibold capitalize">{status.replace(/_/g, " ")}</p>
            <p className="mt-1 text-sm text-muted-foreground">{statusCopy(status)}</p>
          </div>
          {status === "verified" && <CheckCircle2 className="size-6 text-emerald-600" />}
          {(status === "requires_input" || status === "failed") && (
            <AlertTriangle className="size-6 text-amber-600" />
          )}
        </div>

        {row?.last_error && (
          <div className="rounded-md border border-amber-500/40 bg-amber-500/5 p-3 text-sm">
            {row.last_error}
          </div>
        )}

        {status !== "verified" && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              You'll scan a government ID (driver's license, state ID, or passport) and take a short liveness selfie.
              Takes about 90 seconds on your phone.
            </p>
            <Button onClick={start} disabled={busy} className="w-full">
              {busy ? <Loader2 className="mr-2 size-4 animate-spin" /> : status === "processing" || status === "requires_input" ? <ExternalLink className="mr-2 size-4" /> : null}
              {status === "not_started" || status === "canceled" || status === "failed"
                ? "Start identity verification"
                : "Continue verification"}
            </Button>
            {(status === "processing" || status === "requires_input") && (
              <button
                onClick={() => q.refetch()}
                className="mx-auto flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
              >
                <RotateCcw className="size-3.5" /> Refresh status
              </button>
            )}
          </div>
        )}

        {status === "verified" && (
          <Link
            to="/provider/background-check"
            className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
          >
            Continue to background check <ExternalLink className="size-4" />
          </Link>
        )}
      </div>

      <div className="text-xs text-muted-foreground">
        Verification is powered by Stripe Identity. Your photos and personal details are handled by Stripe and never
        stored on CareMatch's servers beyond a pass/fail record.
      </div>
    </div>
  );
}
