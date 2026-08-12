/**
 * Where CompanionCare actually operates, as one shared source of truth.
 *
 * Shared by /coming-soon and /legal/state-availability, because two
 * hand-maintained copies of "which states are live" is exactly the kind of
 * drift that makes a legal page wrong. Same reasoning as src/lib/pricing-tiers.ts.
 *
 * Current rollout: Virginia only, with the Carolinas and Tennessee in progress.
 * Keep this list short and true — it is the one claim on the pre-launch page
 * that a visitor can check against reality.
 */

export type TierAvail = "live" | "partner" | "waitlist" | "none";

export type StateRow = {
  state: string;
  /** Two-letter code, used for compact display on /coming-soon. */
  code: string;
  helpers: TierAvail;
  companions: TierAvail;
  partners: TierAvail;
  health: TierAvail;
  note?: string;
};

export const STATE_AVAILABILITY: StateRow[] = [
  {
    state: "Virginia",
    code: "VA",
    helpers: "live",
    companions: "live",
    // Personal care and skilled care need licensed/certified agency partners,
    // which aren't signed yet — so they're waitlist, not "via partner".
    partners: "waitlist",
    health: "waitlist",
    note: "Home Care Organizations are licensed by VDH; companion care is not licensed.",
  },
  {
    state: "North Carolina",
    code: "NC",
    helpers: "waitlist",
    companions: "waitlist",
    partners: "waitlist",
    health: "waitlist",
    note: "In progress — building the helper bench now.",
  },
  {
    state: "South Carolina",
    code: "SC",
    helpers: "waitlist",
    companions: "waitlist",
    partners: "waitlist",
    health: "waitlist",
    note: "In progress — building the helper bench now.",
  },
  {
    state: "Tennessee",
    code: "TN",
    helpers: "waitlist",
    companions: "waitlist",
    partners: "waitlist",
    health: "waitlist",
    note: "In progress — building the helper bench now.",
  },
];

export const TIER_META: Record<TierAvail, { label: string; description: string }> = {
  live: { label: "Live", description: "Fully operational" },
  partner: { label: "Via partner", description: "Delivered by licensed agency partner" },
  waitlist: { label: "Waitlist", description: "Coming soon — join the list" },
  none: { label: "Not available", description: "Not currently offered" },
};

/**
 * A state counts as open if you can actually book something there today —
 * either our own helpers or a licensed partner. Used for the rollout counter on
 * /coming-soon, so the number can't contradict the table under it.
 */
export function isStateOpen(row: StateRow): boolean {
  return [row.helpers, row.companions, row.partners, row.health].some(
    (tier) => tier === "live" || tier === "partner",
  );
}

export const OPEN_STATES = STATE_AVAILABILITY.filter(isStateOpen);
export const COMING_STATES = STATE_AVAILABILITY.filter((row) => !isStateOpen(row));
export const OPEN_STATE_COUNT = OPEN_STATES.length;
export const WAITLIST_STATE_COUNT = COMING_STATES.length;
