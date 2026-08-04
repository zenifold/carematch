/**
 * Time zone used when we do not know the senior's own.
 *
 * Not a guess at "most users" so much as a deliberate, documented choice: the
 * output always carries its zone abbreviation, so a reader in another zone can
 * see that the time is stated in Eastern rather than silently misreading it as
 * local.
 */
export const FALLBACK_TIME_ZONE = "America/New_York";

/**
 * Formatting locale is pinned rather than left to the runtime.
 *
 * A Cloudflare Worker's default locale and time zone are not the reader's —
 * the zone in particular resolves to UTC — so anything relying on the ambient
 * default produces a correct-looking, wrong answer.
 */
const LOCALE = "en-US";

/**
 * The browser's IANA zone, or null if it cannot be determined.
 *
 * Returns null rather than a guess so the column stays honestly empty and the
 * formatter's labelled fallback kicks in.
 */
export function browserTimeZone(): string | null {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || null;
  } catch {
    return null;
  }
}

export function isValidTimeZone(timeZone: string): boolean {
  try {
    new Intl.DateTimeFormat(LOCALE, { timeZone });
    return true;
  } catch {
    return false;
  }
}

/**
 * Pick the zone to format in, tolerating junk.
 *
 * The stored value originates from a browser (`resolvedOptions().timeZone`) and
 * is therefore client-supplied. An unrecognised IANA name makes
 * Intl.DateTimeFormat throw a RangeError, and this runs inside an hourly sweep
 * over every senior with an imminent visit — one bad row must not take down
 * everyone else's reminder.
 */
export function resolveTimeZone(timeZone: string | null | undefined): string {
  if (!timeZone) return FALLBACK_TIME_ZONE;
  return isValidTimeZone(timeZone) ? timeZone : FALLBACK_TIME_ZONE;
}

/**
 * Render a visit's start time for a reminder email.
 *
 * Always includes the zone abbreviation ("5:00 PM EDT"), which is both what
 * scheduling emails conventionally do and the thing that makes a fallback
 * visible instead of misleading.
 */
export function formatVisitTime(
  scheduledAt: string | Date,
  timeZone: string | null | undefined,
): string {
  const when = scheduledAt instanceof Date ? scheduledAt : new Date(scheduledAt);
  return when.toLocaleString(LOCALE, {
    weekday: "long",
    hour: "numeric",
    minute: "2-digit",
    timeZone: resolveTimeZone(timeZone),
    timeZoneName: "short",
  });
}
