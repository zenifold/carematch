import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Loader2,
  Lock,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  GraduationCap,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RouteErrorBoundary, PageSkeleton, ErrorState } from "@/components/carematch";
import {
  getMyProviderProfile,
  saveProviderBasics,
  saveProviderCapabilities,
  saveProviderListing,
  submitCredential,
  setOnboardingStep,
  listTrainingPrograms,
  startTrainingReferral,
  getMarketRateBands,
  acknowledgeSeriousTone,
} from "@/lib/provider-credentials.functions";

export const Route = createFileRoute("/_authenticated/onboarding/provider/")({
  component: ProviderOnboarding,
  errorComponent: RouteErrorBoundary,
});

const LANGUAGES = ["English", "Spanish", "Mandarin", "Vietnamese", "Portuguese", "Tagalog", "Hindi", "Arabic"];
const TIER_LABEL: Record<number, string> = {
  0: "Companion / Household",
  1: "PCA / HHA",
  2: "CNA",
  3: "Skilled / Clinical",
};
const MOTIVATIONS: { code: "extra_cash" | "between_jobs" | "love_seniors" | "toward_cna"; label: string; blurb: string }[] = [
  { code: "extra_cash", label: "Extra cash", blurb: "Pick up shifts around your schedule." },
  { code: "between_jobs", label: "Between jobs", blurb: "Steady hours while you figure out what's next." },
  { code: "love_seniors", label: "I love seniors", blurb: "You just enjoy being with older folks." },
  { code: "toward_cna", label: "Building toward CNA/nursing", blurb: "We'll help fund your certification." },
];

function ProviderOnboarding() {
  const navigate = useNavigate();
  const getProfile = useServerFn(getMyProviderProfile);
  const saveBasicsFn = useServerFn(saveProviderBasics);
  const saveListingFn = useServerFn(saveProviderListing);
  const saveCapsFn = useServerFn(saveProviderCapabilities);
  const submitCredFn = useServerFn(submitCredential);
  const setStepFn = useServerFn(setOnboardingStep);
  const listProgramsFn = useServerFn(listTrainingPrograms);
  const startReferralFn = useServerFn(startTrainingReferral);
  const bandsFn = useServerFn(getMarketRateBands);
  const ackSeriousFn = useServerFn(acknowledgeSeriousTone);

  const profileQ = useQuery({ queryKey: ["provider", "onboarding"], queryFn: () => getProfile() });
  const bandsQ = useQuery({ queryKey: ["market", "bands"], queryFn: () => bandsFn() });

  const [step, setStep] = useState<number>(0);
  const [busy, setBusy] = useState(false);

  // Form state
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [serviceArea, setServiceArea] = useState("");
  const [languages, setLanguages] = useState<string[]>(["English"]);
  const [motivation, setMotivation] = useState<"extra_cash" | "between_jobs" | "love_seniors" | "toward_cna" | null>(null);
  const [headline, setHeadline] = useState("");
  const [bio, setBio] = useState("");
  const [rate, setRate] = useState(28);
  const [years, setYears] = useState(3);
  const [selectedCaps, setSelectedCaps] = useState<Set<string>>(new Set());
  const [consentBg, setConsentBg] = useState(false);
  const [issuingState, setIssuingState] = useState("");

  useEffect(() => {
    const p = profileQ.data;
    if (!p) return;
    setFullName(p.profile.full_name ?? "");
    setPhone(p.profile.phone ?? "");
    setServiceArea(p.provider.service_area ?? p.profile.city ?? "");
    if (p.provider.languages?.length) setLanguages(p.provider.languages);
    setHeadline(p.provider.headline ?? "");
    setBio(p.provider.bio ?? "");
    if (p.provider.hourly_rate_cents) setRate(Math.round(p.provider.hourly_rate_cents / 100));
    if (p.provider.years_experience) setYears(p.provider.years_experience);
    setSelectedCaps(new Set(p.capabilities.filter((c) => c.opted_in).map((c) => c.code)));
    const m = (p.provider as unknown as { motivation?: string | null }).motivation;
    if (m === "extra_cash" || m === "between_jobs" || m === "love_seniors" || m === "toward_cna") setMotivation(m);
    setStep(p.provider.onboarding_step ?? 0);
  }, [profileQ.data]);

  if (profileQ.isPending) return <PageSkeleton title="Provider onboarding" cards={4} />;
  if (profileQ.isError) return <ErrorState error={profileQ.error} onRetry={() => profileQ.refetch()} />;

  const p = profileQ.data!;
  const tier = p.provider.service_tier;

  const toggleLang = (l: string) =>
    setLanguages((prev) => (prev.includes(l) ? prev.filter((x) => x !== l) : [...prev, l]));
  const toggleCap = (code: string) =>
    setSelectedCaps((prev) => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });

  const persistStep = async (s: number) => {
    await setStepFn({ data: { step: s } });
    setStep(s);
  };

  const goNext = async (target: number) => {
    setBusy(true);
    try {
      if (step === 0) {
        await saveBasicsFn({
          data: {
            full_name: fullName || null,
            phone: phone || null,
            city: serviceArea || null,
            service_area: serviceArea || null,
            languages,
            motivation: motivation ?? null,
          },
        });
      } else if (step === 1) {
        await saveCapsFn({ data: { codes: Array.from(selectedCaps) } });
      } else if (step === 2) {
        if (!headline.trim()) {
          toast.error("Please add a headline.");
          setBusy(false);
          return;
        }
        await saveListingFn({
          data: {
            headline: headline.trim(),
            bio: bio.trim() || null,
            hourly_rate_cents: Math.max(0, Math.round(rate * 100)),
            years_experience: Math.max(0, Math.round(years)),
          },
        });
      } else if (step === 3) {
        // Tone-shift interstitial — record the acknowledgement.
        await ackSeriousFn();
      } else if (step === 4) {
        if (!consentBg) {
          toast.error("Please consent to the background check to continue.");
          setBusy(false);
          return;
        }
        await submitCredFn({
          data: { kind: "background_check", issuing_state: issuingState || null },
        });
        await submitCredFn({
          data: { kind: "id_verification", issuing_state: issuingState || null },
        });
      }
      await persistStep(target);
      await profileQ.refetch();
      toast.success("Saved");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  const finish = async () => {
    await persistStep(6);
    navigate({ to: "/provider", replace: true });
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-6 lg:px-0">
      <header className="space-y-2">
        <div className="flex items-center gap-2 text-primary">
          <Sparkles className="size-5" />
          <p className="text-xs font-bold uppercase tracking-widest">Welcome, caregiver</p>
        </div>
        <h1 className="font-serif text-3xl lg:text-4xl">Set up your caregiver profile</h1>
        <StepDots current={step} total={6} />
      </header>

      {step === 0 && (
        <StepCard title="1. About you" description="Basics that families see up front — takes 2 minutes.">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Full name">
              <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
            </Field>
            <Field label="Phone">
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
            </Field>
            <Field label="City / service area" className="sm:col-span-2">
              <Input
                value={serviceArea}
                onChange={(e) => setServiceArea(e.target.value)}
                placeholder="e.g. Sarasota, FL"
              />
            </Field>
          </div>
          <div>
            <p className="mb-2 text-sm font-medium">Languages you speak</p>
            <ChipGroup items={LANGUAGES} selected={languages} onToggle={toggleLang} />
          </div>
          <div>
            <p className="mb-2 text-sm font-medium">Why are you here? <span className="text-muted-foreground font-normal">(No wrong answer — helps us match you well.)</span></p>
            <div className="grid gap-2 sm:grid-cols-2">
              {MOTIVATIONS.map((m) => {
                const on = motivation === m.code;
                return (
                  <button
                    key={m.code}
                    type="button"
                    onClick={() => setMotivation(m.code)}
                    className={`rounded-lg border p-3 text-left text-sm transition ${
                      on ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
                    }`}
                  >
                    <div className="flex items-center gap-2 font-medium">
                      {on && <CheckCircle2 className="size-4 text-primary" />}
                      {m.label}
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">{m.blurb}</p>
                  </button>
                );
              })}
            </div>
          </div>
          <StepNav onNext={() => goNext(1)} busy={busy} />
        </StepCard>
      )}

      {step === 1 && (
        <StepCard
          title="2. What you want to do"
          description={`You're currently at Tier ${tier} — ${TIER_LABEL[tier]}. Pick everything you're comfortable offering. Higher tiers unlock as you add credentials.`}
        >
          {[0, 1, 2, 3].map((t) => {
            const caps = p.capabilities.filter((c) => c.required_tier === t);
            if (!caps.length) return null;
            const locked = t > tier;
            return (
              <div key={t} className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">
                    Tier {t} · {TIER_LABEL[t]}
                  </h3>
                  {locked && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                      <Lock className="size-3" /> Locked
                    </span>
                  )}
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  {caps.map((c) => {
                    const on = selectedCaps.has(c.code);
                    return (
                      <button
                        key={c.code}
                        type="button"
                        disabled={locked}
                        onClick={() => toggleCap(c.code)}
                        className={`rounded-lg border p-3 text-left text-sm transition ${
                          locked
                            ? "cursor-not-allowed border-dashed border-border/60 opacity-60"
                            : on
                              ? "border-primary bg-primary/5"
                              : "border-border hover:border-primary/40"
                        }`}
                      >
                        <div className="flex items-center gap-2 font-medium">
                          {on && !locked && <CheckCircle2 className="size-4 text-primary" />}
                          {c.label}
                        </div>
                        {c.description && (
                          <p className="mt-1 text-xs text-muted-foreground">{c.description}</p>
                        )}
                        {locked && c.required_credential && (
                          <p className="mt-1 text-xs text-amber-700">
                            Requires {c.required_credential.replace("_", " ")}.
                          </p>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
          {tier < 3 && (
            <div className="rounded-xl border border-dashed border-primary/40 bg-primary/5 p-4 text-sm">
              <div className="flex items-center gap-2 font-semibold text-primary">
                <TrendingUp className="size-4" /> Earn more with certification
              </div>
              <p className="mt-1 text-muted-foreground">
                Step 5 shows programs near you — becoming a PCA, CNA, phlebotomist or LPN can raise
                your hourly rate significantly.
              </p>
            </div>
          )}
          <StepNav onBack={() => persistStep(0)} onNext={() => goNext(2)} busy={busy} />
        </StepCard>
      )}

      {step === 2 && (
        <StepCard title="3. Your listing & rate" description="Tell families about you.">
          <Field label="Headline">
            <Input
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
              placeholder="Warm, patient companion — 8+ years"
            />
          </Field>
          <Field label="Short bio">
            <Textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={4}
              placeholder="What do you love about caregiving? How do you support seniors day-to-day?"
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Hourly rate (USD)">
              <Input
                type="number"
                min={0}
                value={rate}
                onChange={(e) => setRate(Number(e.target.value))}
              />
            </Field>
            <Field label="Years experience">
              <Input
                type="number"
                min={0}
                value={years}
                onChange={(e) => setYears(Number(e.target.value))}
              />
            </Field>
          </div>
          {bandsQ.data && (
            <div className="rounded-xl border border-border bg-secondary/50 p-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Typical hourly rate by tier
              </p>
              <ul className="grid gap-1 text-sm sm:grid-cols-2">
                {bandsQ.data.map((b) => (
                  <li
                    key={b.tier}
                    className={`flex justify-between rounded-md px-2 py-1 ${
                      b.tier === tier ? "bg-primary/10 font-semibold text-primary" : ""
                    }`}
                  >
                    <span>
                      Tier {b.tier} · {b.label}
                    </span>
                    <span>
                      ${b.low}–${b.high}/hr
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <StepNav onBack={() => persistStep(1)} onNext={() => goNext(3)} busy={busy} />
        </StepCard>
      )}

      {step === 3 && (
        <section className="space-y-6 rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/5 via-background to-background p-6 lg:p-10">
          <div className="flex items-center gap-2 text-primary">
            <ShieldCheck className="size-5" />
            <p className="text-xs font-bold uppercase tracking-widest">A quick pause</p>
          </div>
          <h2 className="font-serif text-2xl leading-tight lg:text-3xl">
            From here on, it gets a little more serious.
          </h2>
          <div className="space-y-4 text-base leading-relaxed text-muted-foreground">
            <p>
              Everything above was the fun part. What's next matters more.
            </p>
            <p>
              The people you'll help are someone's <b className="text-foreground">mom, dad, or grandparent</b>.
              They trust CareMatch to send them someone kind, reliable, and honest — and now they'll trust you.
            </p>
            <p>
              That means showing up on time. Treating them with patience and respect, even on tough days.
              Never taking anything that isn't yours. Never doing anything you're not trained for.
              If something feels off, you tell us. Always.
            </p>
            <p>
              We take this seriously so families can rest easy — and so caregivers who do the right thing
              get rewarded with steady work and better pay.
            </p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4 text-sm">
            <p className="font-semibold">Ready to keep going?</p>
            <p className="mt-1 text-muted-foreground">
              Next up: ID check and background check. Standard stuff — takes about 5 minutes on your end,
              24–72 hours to clear.
            </p>
          </div>
          <StepNav
            onBack={() => persistStep(2)}
            onNext={() => goNext(4)}
            busy={busy}
            nextLabel="I'm ready"
          />
        </section>
      )}

      {step === 4 && (
        <StepCard
          title="5. Trust & safety"
          description="Every caregiver on CareMatch passes an ID check and background check before accepting jobs."
        >
          <div className="rounded-xl border border-border bg-secondary/50 p-4 text-sm">
            <div className="flex items-center gap-2 font-semibold">
              <ShieldCheck className="size-4 text-primary" /> Background & ID check
            </div>
            <p className="mt-1 text-muted-foreground">
              We use Certn to verify your identity and run a nationwide background check. Turnaround
              is typically 24–72 hours. You can browse and select jobs while it's pending, but you
              can't accept them until it clears.
            </p>
          </div>
          <Field label="State that issued your ID">
            <Input
              value={issuingState}
              onChange={(e) => setIssuingState(e.target.value)}
              placeholder="e.g. FL"
              maxLength={4}
            />
          </Field>
          <label className="flex items-start gap-2 text-sm">
            <input
              type="checkbox"
              className="mt-1"
              checked={consentBg}
              onChange={(e) => setConsentBg(e.target.checked)}
            />
            <span>
              I authorize CareMatch and Certn to verify my identity and run a background check for
              caregiver placement. I understand a passing result is required to accept bookings.
            </span>
          </label>
          <StepNav onBack={() => persistStep(3)} onNext={() => goNext(5)} busy={busy} nextLabel="Submit" />
        </StepCard>
      )}

      {step === 5 && (
        <StepCard
          title="6. Grow your income"
          description={`You're at Tier ${tier}. Here's what other tiers earn — and programs near you that could get you there.`}
        >
          <GrowPrograms
            tier={tier}
            listProgramsFn={listProgramsFn}
            startReferralFn={startReferralFn}
            bands={bandsQ.data ?? []}
          />
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <button
              type="button"
              onClick={() => persistStep(4)}
              className="text-sm text-muted-foreground underline-offset-2 hover:underline"
            >
              <ArrowLeft className="mr-1 inline size-3" /> Back
            </button>
            <div className="flex gap-2">
              <Link
                to="/provider/grow"
                className="text-sm text-muted-foreground underline-offset-2 hover:underline"
              >
                Browse full catalog
              </Link>
              <Button onClick={finish} size="lg">
                Finish & go to portal
              </Button>
            </div>
          </div>
        </StepCard>
      )}
    </div>
  );
}

function StepDots({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-1.5">
      {Array.from({ length: total }).map((_, i) => (
        <span
          key={i}
          className={`h-1.5 flex-1 rounded-full ${
            i <= current ? "bg-primary" : "bg-border"
          }`}
        />
      ))}
    </div>
  );
}

function StepCard({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-5 rounded-2xl border border-border bg-card p-5 lg:p-6">
      <div>
        <h2 className="font-serif text-xl">{title}</h2>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
      {children}
    </section>
  );
}

function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`space-y-1.5 ${className ?? ""}`}>
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function ChipGroup({
  items,
  selected,
  onToggle,
}: {
  items: string[];
  selected: string[];
  onToggle: (v: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((it) => {
        const on = selected.includes(it);
        return (
          <button
            key={it}
            type="button"
            onClick={() => onToggle(it)}
            className={`rounded-full border px-3.5 py-1.5 text-sm font-semibold transition ${
              on
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-background hover:border-primary/40"
            }`}
          >
            {it}
          </button>
        );
      })}
    </div>
  );
}

function StepNav({
  onBack,
  onNext,
  busy,
  nextLabel = "Continue",
}: {
  onBack?: () => void;
  onNext: () => void;
  busy?: boolean;
  nextLabel?: string;
}) {
  return (
    <div className="flex items-center justify-between pt-2">
      {onBack ? (
        <button
          type="button"
          onClick={onBack}
          className="text-sm text-muted-foreground underline-offset-2 hover:underline"
        >
          <ArrowLeft className="mr-1 inline size-3" /> Back
        </button>
      ) : (
        <span />
      )}
      <Button onClick={onNext} disabled={busy} size="lg">
        {busy ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
        {nextLabel} <ArrowRight className="ml-1 size-4" />
      </Button>
    </div>
  );
}

function GrowPrograms({
  tier,
  listProgramsFn,
  startReferralFn,
  bands,
}: {
  tier: number;
  listProgramsFn: ReturnType<typeof useServerFn<typeof listTrainingPrograms>>;
  startReferralFn: ReturnType<typeof useServerFn<typeof startTrainingReferral>>;
  bands: { tier: number; label: string; low: number; median: number; high: number }[];
}) {
  const progsQ = useQuery({
    queryKey: ["programs", "all"],
    queryFn: () => listProgramsFn({ data: {} }),
  });
  const nextBand = useMemo(() => bands.find((b) => b.tier === tier + 1), [bands, tier]);
  const currentBand = useMemo(() => bands.find((b) => b.tier === tier), [bands, tier]);

  const openReferral = async (programId: string) => {
    try {
      const { url } = await startReferralFn({ data: { program_id: programId } });
      window.open(url, "_blank", "noopener,noreferrer");
      toast.success("Opened program page in a new tab");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not start referral");
    }
  };

  return (
    <div className="space-y-4">
      {nextBand && currentBand && (
        <div className="rounded-xl border border-primary/30 bg-primary/5 p-4">
          <div className="flex items-center gap-2 font-semibold text-primary">
            <TrendingUp className="size-4" /> Next-tier earnings
          </div>
          <p className="mt-1 text-sm">
            You could go from about <b>${currentBand.median}/hr</b> to <b>${nextBand.median}/hr</b> as
            a {nextBand.label.toLowerCase()}.
          </p>
        </div>
      )}
      {progsQ.isPending ? (
        <p className="text-sm text-muted-foreground">Loading programs…</p>
      ) : (
        <ul className="grid gap-3">
          {(progsQ.data ?? []).slice(0, 6).map((prog) => (
            <li key={prog.id} className="rounded-xl border border-border p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 font-semibold">
                    <GraduationCap className="size-4 text-primary" /> {prog.name}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {prog.provider_org}
                    {prog.city ? ` · ${prog.city}, ${prog.state}` : ""}
                    {prog.format ? ` · ${prog.format}` : ""}
                  </p>
                  {prog.description && (
                    <p className="mt-1.5 text-sm text-muted-foreground">{prog.description}</p>
                  )}
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
              <div className="mt-3 flex justify-end">
                <Button size="sm" onClick={() => openReferral(prog.id)}>
                  Apply through CareMatch
                </Button>
              </div>
              <p className="mt-1 text-[11px] text-muted-foreground">
                CareMatch may earn a referral fee. This doesn't change what you pay.
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
