import { useState } from "react";
import { Star, Sparkles, ShieldCheck } from "lucide-react";
import { VerificationModal } from "./VerificationModal";

export type MatchCardData = {
  id: string;
  name: string;
  headline: string;
  initials: string;
  monthlyPlan: number;
  hourlyRate: number;
  /** null when the provider has no ratings yet — shown as "New to CompanionCare", never a fabricated number. */
  rating: number | null;
  ratingCount: number;
  serviceArea: string | null;
  whyMatch: string[];
  tier?: "Gold" | "Silver" | "Bronze";
  /** Real providers.verification_state — the trigger copy must never claim more than this. */
  verificationState: "pending" | "provisional" | "verified" | "suspended";
};

const VERIFICATION_LABEL: Record<MatchCardData["verificationState"], string> = {
  verified: "Verified · tap for details",
  provisional: "Verification in progress · tap for details",
  pending: "New application · tap to see our process",
  suspended: "Verification in progress · tap for details",
};

type Props = {
  provider: MatchCardData;
  onChoose?: () => void;
  onSkip?: () => void;
  className?: string;
};

/**
 * MatchCard — one candidate provider filling a screen.
 * Photo (initials) on top, name + verified badge, "why this match", monthly plan cost.
 */
export function MatchCard({ provider, onChoose, onSkip, className = "" }: Props) {
  const [verifyOpen, setVerifyOpen] = useState(false);
  const fmt = (n: number) =>
    n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

  return (
    <article className={`surface-card overflow-hidden ${className}`}>
      <div className="relative flex aspect-[4/3] items-center justify-center bg-gradient-to-br from-primary/15 to-accent/15">
        <div className="grid size-40 place-items-center rounded-full bg-primary text-primary-foreground font-serif text-6xl shadow-lifted">
          {provider.initials}
        </div>
        {provider.tier && (
          <span className="absolute right-4 top-4 inline-flex items-center gap-1 rounded-full bg-accent px-3 py-1 text-sm font-semibold text-accent-foreground">
            <Sparkles className="size-4" /> {provider.tier}
          </span>
        )}
      </div>
      <div className="p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-serif text-3xl leading-tight">{provider.name}</h3>
            <p className="mt-1 text-lg text-muted-foreground">{provider.headline}</p>
          </div>
          <div className="flex items-center gap-1 rounded-full bg-secondary px-3 py-1 text-sm font-semibold">
            <Star className="size-4 fill-accent text-accent" />
            {provider.rating !== null
              ? `${provider.rating.toFixed(1)} (${provider.ratingCount})`
              : "New to CompanionCare"}
          </div>
        </div>

        <button
          type="button"
          onClick={() => setVerifyOpen(true)}
          className="mt-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-2 text-sm font-semibold text-primary hover:bg-primary/15"
        >
          <ShieldCheck className="size-4" /> {VERIFICATION_LABEL[provider.verificationState]}
        </button>
        <VerificationModal
          open={verifyOpen}
          onClose={() => setVerifyOpen(false)}
          providerName={provider.name}
          verificationState={provider.verificationState}
        />

        <p className="mt-5 text-sm font-semibold uppercase tracking-wider text-primary">
          Why this match
        </p>
        <ul className="mt-2 space-y-1.5">
          {provider.whyMatch.map((r) => (
            <li key={r} className="flex items-start gap-2 text-base">
              <span className="mt-2 size-1.5 shrink-0 rounded-full bg-primary" aria-hidden />
              <span>{r}</span>
            </li>
          ))}
        </ul>

        <div className="mt-6 flex items-baseline justify-between rounded-2xl bg-secondary px-5 py-4">
          <div>
            <p className="text-sm text-muted-foreground">Your monthly plan with {provider.name.split(" ")[0]}</p>
            <p className="font-serif text-3xl text-primary">{fmt(provider.monthlyPlan)}<span className="text-base text-muted-foreground"> /mo</span></p>
          </div>
          <p className="text-sm text-muted-foreground">
            {provider.serviceArea ? `Serves ${provider.serviceArea}` : "Service area on file"}
          </p>
        </div>

        {(onChoose || onSkip) && (
          <div className="mt-6 flex flex-col gap-3">
            {onChoose && (
              <button
                onClick={onChoose}
                className="inline-flex min-h-14 items-center justify-center rounded-full bg-primary px-6 text-xl font-semibold text-primary-foreground shadow-soft hover:bg-primary/90"
              >
                Choose {provider.name.split(" ")[0]}
              </button>
            )}
            {onSkip && (
              <button
                onClick={onSkip}
                className="inline-flex min-h-12 items-center justify-center rounded-full border border-input bg-card px-6 text-lg font-semibold text-foreground hover:bg-secondary"
              >
                See next match
              </button>
            )}
          </div>
        )}
      </div>
    </article>
  );
}
