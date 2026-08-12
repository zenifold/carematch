/**
 * Credential expiry rules for the daily sweep (tasks/check-credential-expiry.ts).
 *
 * `verifications.expires_on` was written and read by the credential CRUD paths but
 * nothing ever swept it, so a background check could lapse while the provider still
 * read as verified and kept taking bookings. Nobody was told. This is the watcher.
 *
 * Pure on purpose: the threshold arithmetic is the part most likely to be subtly
 * wrong (off-by-one at a boundary, timezone drift turning "expires today" into
 * "expired yesterday"), and it should be testable without a database.
 */

export type CredentialRow = {
  id: string;
  provider_id: string;
  kind: string;
  status: string;
  expires_on: string | null;
};

export type ExpiringCredential = CredentialRow & { days_until_expiry: number };

/**
 * Alert on the day a credential crosses one of these, not every day it sits inside
 * the window.
 *
 * Stateless by design: "does today land exactly on a threshold" needs no record of
 * what was already sent, so there is no notified_at column to add, backfill, or get
 * out of step with reality. The cost is that a sweep missed during an outage skips
 * that threshold — acceptable when there are four more chances, and far better than
 * a channel that repeats the same warning for thirty consecutive days until people
 * mute it.
 */
export const ALERT_THRESHOLD_DAYS = [30, 14, 7, 1, 0];

/** Statuses worth warning about. A failed check needs no expiry warning. */
const WATCHED_STATUSES = new Set(["passed"]);

/**
 * Whole days from `today` to `expiresOn`, both treated as calendar dates in UTC.
 *
 * Date-only arithmetic, not elapsed milliseconds: `expires_on` is a DATE, so a
 * credential expiring today should read 0 whether the sweep runs at 01:00 or 23:00.
 * Subtracting timestamps would make that flip to -1 partway through the day.
 */
export function daysUntil(expiresOn: string, today: Date): number {
  const [y, m, d] = expiresOn.slice(0, 10).split("-").map(Number);
  const expiryUtc = Date.UTC(y, m - 1, d);
  const todayUtc = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
  return Math.round((expiryUtc - todayUtc) / 86_400_000);
}

/**
 * Credentials that should raise an alert today — those landing exactly on a
 * threshold. Already-expired ones are deliberately excluded here and reported as a
 * standing count instead; see buildCredentialExpiryEvent.
 */
export function selectExpiringToday(rows: CredentialRow[], today: Date): ExpiringCredential[] {
  return rows
    .filter((r) => r.expires_on && WATCHED_STATUSES.has(r.status))
    .map((r) => ({ ...r, days_until_expiry: daysUntil(r.expires_on as string, today) }))
    .filter((r) => ALERT_THRESHOLD_DAYS.includes(r.days_until_expiry))
    .sort((a, b) => a.days_until_expiry - b.days_until_expiry);
}

/**
 * Credentials whose expiry has already passed while still marked `passed`.
 *
 * This is the actual safety hole rather than a reminder: the row says the check is
 * good, the date says it is not, and nothing reconciles the two. Reported as a count
 * and a sample so the backlog stays visible without the channel repeating every name
 * every day.
 */
export function selectAlreadyExpired(rows: CredentialRow[], today: Date): ExpiringCredential[] {
  return rows
    .filter((r) => r.expires_on && WATCHED_STATUSES.has(r.status))
    .map((r) => ({ ...r, days_until_expiry: daysUntil(r.expires_on as string, today) }))
    .filter((r) => r.days_until_expiry < 0)
    .sort((a, b) => a.days_until_expiry - b.days_until_expiry);
}

export type CredentialExpiryEvent = {
  event: "credential_expiry.warning";
  id: string;
  expiring: {
    credential_id: string;
    provider_id: string;
    provider_name: string | null;
    kind: string;
    expires_on: string;
    days_until_expiry: number;
  }[];
  already_expired_count: number;
  already_expired_sample: {
    credential_id: string;
    provider_id: string;
    provider_name: string | null;
    kind: string;
    expires_on: string;
    days_overdue: number;
  }[];
  urgent: boolean;
  admin_url: string;
};

/** How many overdue credentials to name before falling back to the count alone. */
const OVERDUE_SAMPLE_SIZE = 5;

/**
 * Builds the event.
 *
 * Provider names are included here, unlike incident payloads. The distinction is
 * deliberate: an incident payload can carry an allegation about a person, where a
 * lapsed licence is an operational fact about a contractor, and whoever picks this up
 * has to know who to chase. No contact details either way.
 */
export function buildCredentialExpiryEvent(input: {
  runId: string;
  expiring: ExpiringCredential[];
  alreadyExpired: ExpiringCredential[];
  nameFor: (providerId: string) => string | null;
  siteOrigin: string;
}): CredentialExpiryEvent {
  return {
    event: "credential_expiry.warning",
    id: input.runId,
    expiring: input.expiring.map((c) => ({
      credential_id: c.id,
      provider_id: c.provider_id,
      provider_name: input.nameFor(c.provider_id),
      kind: c.kind,
      expires_on: (c.expires_on as string).slice(0, 10),
      days_until_expiry: c.days_until_expiry,
    })),
    already_expired_count: input.alreadyExpired.length,
    already_expired_sample: input.alreadyExpired.slice(0, OVERDUE_SAMPLE_SIZE).map((c) => ({
      credential_id: c.id,
      provider_id: c.provider_id,
      provider_name: input.nameFor(c.provider_id),
      kind: c.kind,
      expires_on: (c.expires_on as string).slice(0, 10),
      days_overdue: Math.abs(c.days_until_expiry),
    })),
    // Something lapsing today, or already lapsed, means a provider may be taking
    // bookings while reading as verified. That warrants a mention; a 30-day heads-up
    // does not.
    urgent: input.alreadyExpired.length > 0 || input.expiring.some((c) => c.days_until_expiry <= 1),
    admin_url: `${input.siteOrigin.replace(/\/+$/, "")}/admin/credentials`,
  };
}

/** Whether there is anything worth sending at all. */
export function hasAnythingToReport(event: CredentialExpiryEvent): boolean {
  return event.expiring.length > 0 || event.already_expired_count > 0;
}
