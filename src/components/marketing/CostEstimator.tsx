import { useId, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Wallet, ArrowRight, Info } from "lucide-react";
import {
  ASSISTED_LIVING_MONTHLY,
  TIERS,
  boundRate,
  breakEvenHoursPerWeek,
  estimateMonthly,
  midRate,
  money,
  moneyRounded,
  tierByKey,
} from "@/lib/pricing-tiers";

/**
 * Monthly cost estimator for the cost-of-care article.
 *
 * Deliberately different from the pricing page's estimator, which prices a
 * single visit. A reader here is asking "what will this cost me a month?", so
 * the inputs are hours per week and the output is a monthly total, compared
 * against assisted living. Both read the same rate bands from pricing-tiers.
 */
export function CostEstimator({ defaultTier = "companionship" }: { defaultTier?: string }) {
  const [tierKey, setTierKey] = useState(defaultTier);
  const tier = useMemo(() => tierByKey(tierKey), [tierKey]);

  const [rate, setRate] = useState(() => midRate(tierByKey(defaultTier)));
  const [hoursPerWeek, setHoursPerWeek] = useState(20);

  const effectiveRate = boundRate(tier, rate);
  const estimate = estimateMonthly(tier, hoursPerWeek, effectiveRate);
  const breakEven = breakEvenHoursPerWeek(tier, effectiveRate);
  const cheaperThanFacility = estimate.total < ASSISTED_LIVING_MONTHLY;

  const tierId = useId();
  const rateId = useId();
  const hoursId = useId();

  return (
    <section
      aria-labelledby={`${tierId}-heading`}
      className="not-prose my-10 overflow-hidden rounded-3xl border border-border bg-secondary/30"
    >
      <div className="border-b border-border bg-background/60 px-6 py-5 md:px-8">
        <div className="flex items-center gap-2">
          <Wallet className="size-4 text-primary" aria-hidden />
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">
            Estimate your monthly cost
          </p>
        </div>
        <h2 id={`${tierId}-heading`} className="mt-2 font-serif text-2xl tracking-tight md:text-3xl">
          What would this cost for your family?
        </h2>
      </div>

      <div className="grid gap-8 p-6 md:p-8 lg:grid-cols-2">
        {/* Inputs */}
        <div className="space-y-6">
          <div>
            <label
              htmlFor={tierId}
              className="text-sm font-semibold uppercase tracking-wider text-muted-foreground"
            >
              Type of help
            </label>
            <select
              id={tierId}
              value={tierKey}
              onChange={(e) => {
                const next = tierByKey(e.target.value);
                setTierKey(next.key);
                // Snap the rate to the new band's midpoint — carrying a $90
                // handyman rate over to companionship would show nonsense.
                setRate(midRate(next));
              }}
              className="mt-2 w-full rounded-2xl border border-border bg-background px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {TIERS.map((t) => (
                <option key={t.key} value={t.key}>
                  {t.name}
                </option>
              ))}
            </select>
            <p className="mt-2 text-sm text-muted-foreground">{tier.blurb}</p>
          </div>

          <div>
            <div className="flex items-baseline justify-between">
              <label
                htmlFor={hoursId}
                className="text-sm font-semibold uppercase tracking-wider text-muted-foreground"
              >
                Hours per week
              </label>
              <span className="font-serif text-xl text-primary">{hoursPerWeek}</span>
            </div>
            <input
              id={hoursId}
              type="range"
              min={1}
              max={60}
              step={1}
              value={hoursPerWeek}
              onChange={(e) => setHoursPerWeek(Number(e.target.value))}
              className="mt-3 w-full accent-primary"
              aria-describedby={`${hoursId}-hint`}
            />
            <p id={`${hoursId}-hint`} className="mt-1 text-sm text-muted-foreground">
              About {estimate.monthlyHours.toFixed(0)} hours a month.
            </p>
          </div>

          <div>
            <div className="flex items-baseline justify-between">
              <label
                htmlFor={rateId}
                className="text-sm font-semibold uppercase tracking-wider text-muted-foreground"
              >
                Provider's hourly rate
              </label>
              <span className="font-serif text-xl text-primary">{money(effectiveRate)}</span>
            </div>
            <input
              id={rateId}
              type="range"
              min={tier.providerLow}
              max={tier.providerHigh}
              step={1}
              value={effectiveRate}
              onChange={(e) => setRate(Number(e.target.value))}
              className="mt-3 w-full accent-primary"
            />
            <p className="mt-1 text-sm text-muted-foreground">
              Providers in this category set rates between {money(tier.providerLow)} and{" "}
              {money(tier.providerHigh)} an hour.
            </p>
          </div>
        </div>

        {/* Output */}
        <div className="rounded-3xl border border-border bg-background p-6">
          <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Estimated monthly total
          </p>
          <p className="mt-1 font-serif text-4xl tracking-tight text-primary md:text-5xl">
            {moneyRounded(estimate.total)}
          </p>

          <dl className="mt-6 space-y-3 text-base">
            <div className="flex items-baseline justify-between gap-4">
              <dt className="text-muted-foreground">
                Provider ({estimate.monthlyHours.toFixed(0)} hrs × {money(effectiveRate)})
              </dt>
              <dd className="font-semibold">{moneyRounded(estimate.providerCost)}</dd>
            </div>
            <div className="flex items-baseline justify-between gap-4">
              <dt className="text-muted-foreground">Service fee ({tier.feePct}%)</dt>
              <dd className="font-semibold">{moneyRounded(estimate.serviceFee)}</dd>
            </div>
            <div className="flex items-baseline justify-between gap-4 border-t border-border pt-3">
              <dt className="font-semibold">Total per month</dt>
              <dd className="font-serif text-xl text-primary">{moneyRounded(estimate.total)}</dd>
            </div>
          </dl>

          <div className="mt-6 rounded-2xl bg-secondary/50 p-4">
            <div className="flex gap-2">
              <Info className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
              <p className="text-sm leading-relaxed">
                {cheaperThanFacility ? (
                  <>
                    That's <strong>{moneyRounded(ASSISTED_LIVING_MONTHLY - estimate.total)} less</strong>{" "}
                    per month than the {moneyRounded(ASSISTED_LIVING_MONTHLY)} average for assisted
                    living. At this rate, care at home stays cheaper up to about{" "}
                    <strong>{breakEven.toFixed(0)} hours a week</strong>.
                  </>
                ) : (
                  <>
                    Above about <strong>{breakEven.toFixed(0)} hours a week</strong> at this rate,
                    assisted living (around {moneyRounded(ASSISTED_LIVING_MONTHLY)} a month) usually
                    becomes the cheaper option — worth weighing against staying home.
                  </>
                )}
              </p>
            </div>
          </div>

          <Link
            to="/auth"
            search={{ mode: "signup" }}
            className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-base font-semibold text-primary-foreground transition hover:opacity-90"
          >
            See real providers near you <ArrowRight className="size-4" aria-hidden />
          </Link>
          <p className="mt-3 text-center text-xs text-muted-foreground">
            An estimate, not a quote — you'll see each provider's actual rate and the full total
            before you book anything.
          </p>
        </div>
      </div>
    </section>
  );
}
