-- Visit reminder emails formatted the start time with
-- toLocaleString(undefined, ...), and on a Cloudflare Worker the ambient zone
-- is UTC. Every senior was therefore told their visit time in UTC: a 5:00 PM
-- visit in California rendered as "Friday 12:00 AM" — wrong time and wrong
-- day, in the subject line of the email.
--
-- There was nowhere to store the correct zone, so add one. Captured from the
-- browser at signup via Intl.DateTimeFormat().resolvedOptions().timeZone.

ALTER TABLE public.senior_preferences
  ADD COLUMN IF NOT EXISTS timezone TEXT;

COMMENT ON COLUMN public.senior_preferences.timezone IS
  'IANA time zone name for this senior, e.g. America/New_York, captured from '
  'the browser at signup. NULL means unknown — consumers must fall back to a '
  'documented default and always label the zone in user-facing output rather '
  'than presenting an unqualified local time. Client-supplied, so validate '
  'before passing to Intl (an unknown name throws RangeError).';

-- Deliberately nullable with no default. A NOT NULL DEFAULT would stamp every
-- existing row as Eastern, which is indistinguishable from a senior who really
-- is in Eastern — the same silent-wrong-answer failure this migration fixes.
-- NULL keeps "we do not know" honest and lets the formatter label its fallback.
