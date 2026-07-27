import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ShieldCheck, Loader2, ExternalLink, AlertTriangle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import {
  getMyBackgroundCheck,
  startBackgroundCheck,
  listMyBackgroundCheckEvents,
} from "@/lib/background-checks.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RouteErrorBoundary } from "@/components/carematch";

export const Route = createFileRoute("/_authenticated/provider/background-check")({
  component: BackgroundCheckPage,
  errorComponent: RouteErrorBoundary,
});

function statusCopy(status: string, vendor?: string) {
  if (vendor === "manual") {
    switch (status) {
      case "pending_vendor":
        return "Submitted — our team is reviewing it directly and will follow up.";
      case "clear":
        return "All clear.";
      case "canceled":
        return "Canceled.";
      case "error":
        return "Something went wrong. Please contact support.";
      default:
        return status;
    }
  }
  switch (status) {
    case "invitation_sent":
      return "Invitation sent — check your email.";
    case "pending_candidate_info":
      return "Waiting for you to complete the vendor form.";
    case "pending_vendor":
      return "In progress with our verification partner. Usually 1–3 business days.";
    case "clear":
      return "All clear.";
    case "consider":
      return "Under review — a member of our team will reach out.";
    case "canceled":
      return "Canceled.";
    case "error":
      return "Something went wrong. Please contact support.";
    default:
      return status;
  }
}

function BackgroundCheckPage() {
  const bgFn = useServerFn(getMyBackgroundCheck);
  const startFn = useServerFn(startBackgroundCheck);
  const eventsFn = useServerFn(listMyBackgroundCheckEvents);

  const q = useQuery({ queryKey: ["provider", "bg-check"], queryFn: () => bgFn() });
  const eventsQ = useQuery({
    queryKey: ["provider", "bg-check-events"],
    queryFn: () => eventsFn(),
  });

  const [ssn, setSsn] = useState("");
  const [busy, setBusy] = useState(false);

  if (q.isLoading)
    return (
      <div className="p-6">
        <Loader2 className="size-5 animate-spin" />
      </div>
    );
  if (q.error) return <div className="p-6 text-sm text-destructive">Could not load status.</div>;

  const start = async () => {
    if (!/^\d{3}-?\d{2}-?\d{4}$/.test(ssn)) {
      toast.error("Enter a valid 9-digit SSN.");
      return;
    }
    setBusy(true);
    try {
      const res = await startFn({ data: { ssn } });
      toast.success("Background check started.");
      setSsn("");
      if (res.invitation_url) window.open(res.invitation_url, "_blank", "noopener,noreferrer");
      await q.refetch();
    } catch (err: any) {
      toast.error(err?.message ?? "Could not start check.");
    } finally {
      setBusy(false);
    }
  };

  const row = q.data?.row;

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6">
      <div className="flex items-center gap-2">
        <ShieldCheck className="size-6 text-primary" />
        <h1 className="text-2xl font-semibold">Background check</h1>
      </div>

      {!row && !q.data?.idv_verified && (
        <div className="rounded-xl border border-amber-500/40 bg-amber-500/5 p-4 text-sm">
          <div className="flex items-start gap-2">
            <AlertTriangle className="mt-0.5 size-5 text-amber-600" />
            <div>
              <p className="font-semibold">Verify your identity first</p>
              <p className="mt-1 text-muted-foreground">
                We use a secure ID scan and liveness selfie to confirm you are who you say you are.
                This must be completed before we run a background check.
              </p>
              <Link
                to="/provider/identity-verification"
                className="mt-2 inline-flex text-primary font-semibold"
              >
                Start identity verification →
              </Link>
            </div>
          </div>
        </div>
      )}

      {!row && q.data?.idv_verified && !q.data?.identity_ready && (
        <div className="rounded-xl border border-amber-500/40 bg-amber-500/5 p-4 text-sm">
          <div className="flex items-start gap-2">
            <AlertTriangle className="mt-0.5 size-5 text-amber-600" />
            <div>
              <p className="font-semibold">Finish identity paperwork</p>
              <p className="mt-1 text-muted-foreground">
                We still need your signed disclosures and address history before we can run a check.
              </p>
              <Link
                to="/onboarding/provider/identity"
                className="mt-2 inline-flex text-primary font-semibold"
              >
                Continue →
              </Link>
            </div>
          </div>
        </div>
      )}

      {!row && q.data?.identity_ready && (
        <div className="space-y-4 rounded-xl border p-5">
          <div>
            <p className="font-semibold">Ready to start</p>
            <p className="text-sm text-muted-foreground">
              Package: <span className="font-medium text-foreground">{q.data.tier_label}</span>
              {q.data.active_vendor !== "manual" && (
                <> · Est. cost ${((q.data.estimated_cost_cents ?? 0) / 100).toFixed(2)}</>
              )}
            </p>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Enter your Social Security Number</label>
            <Input
              value={ssn}
              onChange={(e) => setSsn(e.target.value)}
              placeholder="123-45-6789"
              inputMode="numeric"
              autoComplete="off"
            />
            <p className="text-xs text-muted-foreground">
              {q.data.active_vendor === "manual"
                ? "Used only to confirm your submission — reviewed by our team, never stored."
                : "Sent directly to our verification partner. We keep only the last 4 digits."}
            </p>
          </div>
          <Button onClick={start} disabled={busy} className="w-full">
            {busy ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
            {q.data.active_vendor === "manual" ? "Submit for review" : "Start background check"}
          </Button>
        </div>
      )}

      {row && (
        <div className="space-y-4 rounded-xl border p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm text-muted-foreground">Current status</p>
              <p className="text-xl font-semibold capitalize">{row.status.replace(/_/g, " ")}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {statusCopy(row.status, row.vendor)}
              </p>
            </div>
            {row.status === "clear" && row.adjudication === "cleared" && (
              <CheckCircle2 className="size-6 text-emerald-600" />
            )}
          </div>

          <dl className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <dt className="text-muted-foreground">Package</dt>
              <dd className="font-medium">{row.package_tier.replace(/_/g, " ")}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Ordered</dt>
              <dd className="font-medium">{new Date(row.ordered_at).toLocaleDateString()}</dd>
            </div>
          </dl>

          {row.invitation_url && row.status !== "clear" && (
            <a
              href={row.invitation_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm font-semibold text-primary"
            >
              Continue with our partner <ExternalLink className="size-4" />
            </a>
          )}
        </div>
      )}

      {row && eventsQ.data && eventsQ.data.length > 0 && (
        <div className="rounded-xl border p-5">
          <p className="mb-3 text-sm font-semibold">Timeline</p>
          <ul className="space-y-2 text-sm">
            {eventsQ.data.map((e, i) => (
              <li key={i} className="flex items-center justify-between">
                <span>{e.event_type}</span>
                <span className="text-muted-foreground">
                  {new Date(e.received_at).toLocaleString()}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
