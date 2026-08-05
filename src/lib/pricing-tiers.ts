/**
 * Canonical marketplace pricing data.
 *
 * Extracted from the pricing page so the pricing estimator and the cost
 * article can't drift apart the first time a rate band changes. Anything
 * quoting rates or fees to a visitor should read from here.
 */

export type ServiceTier = {
  key: string;
  name: string;
  providerLow: number;
  providerHigh: number;
  /** Platform fee percentage, charged on the senior side on top of the provider's rate. */
  feePct: number;
  blurb: string;
};

export const TIERS: ServiceTier[] = [
  {
    key: "companionship",
    name: "Companionship & check-ins",
    providerLow: 18,
    providerHigh: 30,
    feePct: 18,
    blurb: "A friendly visit — conversation, walks, activities.",
  },
  {
    key: "errands",
    name: "Errands & grocery runs",
    providerLow: 18,
    providerHigh: 28,
    feePct: 18,
    blurb: "Shopping, pharmacy pickups, post office.",
  },
  {
    key: "transport",
    name: "Rides to appointments",
    providerLow: 20,
    providerHigh: 32,
    feePct: 18,
    blurb: "Door-to-door rides. Plus IRS-standard mileage.",
  },
  {
    key: "mealprep",
    name: "Meal prep & light cooking",
    providerLow: 20,
    providerHigh: 32,
    feePct: 18,
    blurb: "A home-cooked meal, dishes done, fridge stocked.",
  },
  {
    key: "cleaning",
    name: "House cleaning & laundry",
    providerLow: 25,
    providerHigh: 40,
    feePct: 18,
    blurb: "Weekly, bi-weekly, or one-time refreshes.",
  },
  {
    key: "techhelp",
    name: "Tech help & setup",
    providerLow: 22,
    providerHigh: 38,
    feePct: 18,
    blurb: "Phone, tablet, TV, video calls with family.",
  },
  {
    key: "personal",
    name: "Personal care (CNA / HHA)",
    providerLow: 28,
    providerHigh: 50,
    feePct: 18,
    blurb: "Bathing, dressing, mobility support.",
  },
  {
    key: "handyman",
    name: "Handyman & small repairs",
    providerLow: 45,
    providerHigh: 90,
    feePct: 18,
    blurb: "Grab bars, minor fixes, installs.",
  },
  {
    key: "nursing",
    name: "Skilled nursing",
    providerLow: 45,
    providerHigh: 80,
    feePct: 15,
    blurb: "Licensed RN / LPN visits.",
  },
];

export function tierByKey(key: string): ServiceTier {
  const tier = TIERS.find((t) => t.key === key);
  if (!tier) throw new Error(`Unknown service tier: ${key}`);
  return tier;
}

export const money = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 });

export const moneyRounded = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

/**
 * 52/12, not 4.
 *
 * A "4 weeks per month" shortcut undercounts by a full month of visits a year,
 * which on 20 hrs/week of personal care is roughly $2,000 — not a rounding
 * error in a number a family is budgeting against.
 */
export const WEEKS_PER_MONTH = 52 / 12;

/** Average US assisted living, monthly, 2026. Used for the at-home comparison. */
export const ASSISTED_LIVING_MONTHLY = 5500;

export type MonthlyEstimate = {
  monthlyHours: number;
  providerCost: number;
  serviceFee: number;
  total: number;
};

/** Cost of `hoursPerWeek` at `rate`, carried out to a month. */
export function estimateMonthly(
  tier: ServiceTier,
  hoursPerWeek: number,
  rate: number,
): MonthlyEstimate {
  const monthlyHours = hoursPerWeek * WEEKS_PER_MONTH;
  const providerCost = rate * monthlyHours;
  const serviceFee = providerCost * (tier.feePct / 100);
  return { monthlyHours, providerCost, serviceFee, total: providerCost + serviceFee };
}

/** Clamp a rate into a tier's published band. */
export function boundRate(tier: ServiceTier, rate: number): number {
  return Math.max(tier.providerLow, Math.min(tier.providerHigh, rate));
}

export function midRate(tier: ServiceTier): number {
  return Math.round((tier.providerLow + tier.providerHigh) / 2);
}

/**
 * Weekly hours at which in-home care overtakes assisted living on cost.
 *
 * The point the cost article makes in prose; computed here so it stays true
 * when rates change instead of being a hardcoded "~40 hours".
 */
export function breakEvenHoursPerWeek(tier: ServiceTier, rate: number): number {
  const allInHourly = rate * (1 + tier.feePct / 100);
  return ASSISTED_LIVING_MONTHLY / allInHourly / WEEKS_PER_MONTH;
}
