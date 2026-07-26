import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { GraduationCap, MapPin, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageSkeleton, ErrorState, RouteErrorBoundary } from "@/components/carematch";
import {
  listTrainingPrograms,
  startTrainingReferral,
  getMyProviderProfile,
  getMarketRateBands,
  type TrainingProgram,
} from "@/lib/provider-credentials.functions";

export const Route = createFileRoute("/_authenticated/provider/grow")({
  component: GrowPage,
  errorComponent: RouteErrorBoundary,
});

function GrowPage() {
  const listFn = useServerFn(listTrainingPrograms);
  const startFn = useServerFn(startTrainingReferral);
  const profileFn = useServerFn(getMyProviderProfile);
  const bandsFn = useServerFn(getMarketRateBands);

  const [stateFilter, setStateFilter] = useState("");

  const profileQ = useQuery({ queryKey: ["provider", "profile-full"], queryFn: () => profileFn() });
  const bandsQ = useQuery({ queryKey: ["market", "bands"], queryFn: () => bandsFn() });
  const progsQ = useQuery({
    queryKey: ["programs", stateFilter],
    queryFn: () => listFn({ data: stateFilter ? { state: stateFilter.toUpperCase() } : {} }),
  });

  const tier = profileQ.data?.provider.service_tier ?? 0;
  const nextBand = useMemo(
    () => bandsQ.data?.find((b) => b.tier === tier + 1),
    [bandsQ.data, tier],
  );
  const currentBand = useMemo(
    () => bandsQ.data?.find((b) => b.tier === tier),
    [bandsQ.data, tier],
  );

  const openReferral = async (id: string) => {
    try {
      const { url } = await startFn({ data: { program_id: id } });
      window.open(url, "_blank", "noopener,noreferrer");
      toast.success("Opened program page in a new tab");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not start referral");
    }
  };

  if (progsQ.isPending || profileQ.isPending) return <PageSkeleton title="Grow" cards={4} />;
  if (progsQ.isError) return <ErrorState error={progsQ.error} onRetry={() => progsQ.refetch()} />;

  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs uppercase tracking-widest text-muted-foreground">Provider portal</p>
        <h1 className="font-serif text-2xl lg:text-3xl">Grow your income</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Certifications unlock higher-paying jobs. Apply through CareMatch and we may help cover
          the cost.
        </p>
      </header>

      {nextBand && currentBand && (
        <section className="rounded-2xl border border-primary/30 bg-primary/5 p-5">
          <div className="flex items-center gap-2 font-semibold text-primary">
            <TrendingUp className="size-4" /> You're at Tier {tier} — {currentBand.label}
          </div>
          <p className="mt-1 text-sm">
            Move to Tier {nextBand.tier} ({nextBand.label}) and typical pay rises from about
            <b> ${currentBand.median}/hr</b> to <b>${nextBand.median}/hr</b>.
          </p>
        </section>
      )}

      <section className="rounded-2xl border border-border bg-card p-5">
        <div className="flex items-end gap-3">
          <div className="flex-1">
            <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Filter by state
            </label>
            <Input
              placeholder="e.g. FL"
              value={stateFilter}
              onChange={(e) => setStateFilter(e.target.value)}
              maxLength={4}
              className="mt-1"
            />
          </div>
          <p className="pb-2 text-xs text-muted-foreground">
            National programs always show.
          </p>
        </div>
      </section>

      <ul className="grid gap-3">
        {(progsQ.data ?? []).map((prog: TrainingProgram) => (
          <li key={prog.id} className="rounded-2xl border border-border bg-card p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 font-semibold">
                  <GraduationCap className="size-4 text-primary" /> {prog.name}
                </div>
                <p className="text-xs text-muted-foreground">
                  {prog.provider_org}
                  {prog.city ? (
                    <span className="inline-flex items-center gap-1">
                      {" · "}
                      <MapPin className="size-3" />
                      {prog.city}, {prog.state}
                    </span>
                  ) : (
                    " · Nationwide"
                  )}
                  {prog.format ? ` · ${prog.format}` : ""}
                </p>
                {prog.description && (
                  <p className="mt-2 text-sm text-muted-foreground">{prog.description}</p>
                )}
                <p className="mt-2 text-xs font-medium uppercase tracking-wider text-primary">
                  Unlocks: {prog.credential_kind.replace("_", " ")}
                </p>
              </div>
              <div className="text-right text-sm">
                <div className="font-semibold">
                  {prog.cost_cents ? `$${Math.round(prog.cost_cents / 100)}` : "Cost varies"}
                </div>
                <div className="text-xs text-muted-foreground">
                  {prog.duration_weeks ? `~${prog.duration_weeks} wks` : ""}
                </div>
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between">
              <p className="text-[11px] text-muted-foreground">
                CareMatch may earn a referral fee. This doesn't change what you pay.
              </p>
              <Button size="sm" onClick={() => openReferral(prog.id)}>
                Apply through CareMatch
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
