
-- Family invites: senior generates a code (optionally emails it) so a family member can join
CREATE TABLE public.family_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  senior_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  code text NOT NULL UNIQUE,
  email text,
  permission text NOT NULL DEFAULT 'view',
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '14 days'),
  redeemed_at timestamptz,
  redeemed_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX family_invites_senior_idx ON public.family_invites(senior_id);
CREATE INDEX family_invites_code_idx ON public.family_invites(code);
CREATE INDEX family_invites_email_idx ON public.family_invites(lower(email));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.family_invites TO authenticated;
GRANT ALL ON public.family_invites TO service_role;

ALTER TABLE public.family_invites ENABLE ROW LEVEL SECURITY;

-- Senior manages their own invites
CREATE POLICY "senior manages own invites"
ON public.family_invites FOR ALL
TO authenticated
USING (senior_id = auth.uid())
WITH CHECK (senior_id = auth.uid());

-- Redeemer can read the invite they just used (by exact code they know)
-- We keep redemption via server function (service role); no broad read policy needed for other users.
