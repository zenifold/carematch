-- Pre-launch interest capture for the /coming-soon page. The marketing site is
-- deployed but gated, and two pages already promise a waitlist with no form
-- behind it (legal/state-availability's "we'll add you to the waitlist", and
-- contact's partners@ mailto). This is that form's storage.
--
-- Not reusing `profiles` or the auth tables: these people have no account and
-- may never create one, and we want the raw expression of interest preserved
-- even if they later sign up properly.
--
-- Segment-specific answers go in `details` jsonb rather than 20 mostly-null
-- columns — the four segments share almost no fields (a caregiver's specialties
-- vs a partner agency's states served), and the shape will churn while we're
-- still learning what to ask.
CREATE TABLE public.waitlist_signups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  segment text NOT NULL CHECK (segment IN ('senior', 'family', 'caregiver', 'partner')),
  name text NOT NULL,
  email text NOT NULL,
  phone text,
  city text,
  state text,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  -- Which page/campaign produced the signup, for when we start driving traffic.
  source text,
  -- Set once the team has actually replied to this person.
  contacted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_waitlist_signups_recent ON public.waitlist_signups(created_at DESC);
CREATE INDEX idx_waitlist_signups_segment ON public.waitlist_signups(segment, created_at DESC);
-- Not a unique constraint: the same person legitimately signs up for two
-- segments (an adult child who is also a caregiver), and a hard duplicate error
-- on a marketing form is a worse experience than a duplicate row. This index
-- just makes the dedupe query cheap when staff work the list.
CREATE INDEX idx_waitlist_signups_email ON public.waitlist_signups(lower(email));

-- No grants to `anon`, and no INSERT policy at all: submissions arrive through
-- an unauthenticated server function that uses the service-role client, so the
-- table stays completely closed to the browser. That keeps the anon key from
-- being usable to enumerate or spam the list directly.
GRANT SELECT, UPDATE ON public.waitlist_signups TO authenticated;
GRANT ALL ON public.waitlist_signups TO service_role;

ALTER TABLE public.waitlist_signups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff read waitlist signups"
  ON public.waitlist_signups FOR SELECT TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin','staff','support','success']::public.app_role[]));

CREATE POLICY "Staff update waitlist signups"
  ON public.waitlist_signups FOR UPDATE TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin','staff','support','success']::public.app_role[]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin','staff','support','success']::public.app_role[]));
