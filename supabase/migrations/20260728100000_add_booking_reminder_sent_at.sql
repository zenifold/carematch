-- Tracks whether a visit-reminder email has already gone out for a
-- booking, so the scheduled task doesn't re-notify on every run.
ALTER TABLE public.bookings ADD COLUMN reminder_sent_at timestamptz;
