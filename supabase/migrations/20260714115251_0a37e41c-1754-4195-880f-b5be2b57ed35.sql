
-- 1) senior_invites
CREATE TABLE public.senior_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  code text NOT NULL UNIQUE,
  senior_email text,
  senior_name text,
  relationship text,
  permission text NOT NULL DEFAULT 'view',
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '14 days'),
  redeemed_at timestamptz,
  redeemed_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX senior_invites_family_idx ON public.senior_invites(family_id);
CREATE INDEX senior_invites_code_idx ON public.senior_invites(code);
CREATE INDEX senior_invites_email_idx ON public.senior_invites(lower(senior_email));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.senior_invites TO authenticated;
GRANT ALL ON public.senior_invites TO service_role;

ALTER TABLE public.senior_invites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "family manages own senior invites" ON public.senior_invites
  FOR ALL TO authenticated
  USING (family_id = auth.uid())
  WITH CHECK (family_id = auth.uid());

CREATE POLICY "redeemer reads own senior invite" ON public.senior_invites
  FOR SELECT TO authenticated
  USING (redeemed_by = auth.uid());

CREATE TRIGGER senior_invites_touch_updated_at
  BEFORE UPDATE ON public.senior_invites
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- 2) Seed test users
DO $$
DECLARE
  senior_uid uuid := '11111111-1111-1111-1111-111111111111';
  family_uid uuid := '22222222-2222-2222-2222-222222222222';
  provider_uid uuid := '33333333-3333-3333-3333-333333333333';
  admin_uid uuid := '44444444-4444-4444-4444-444444444444';
  hashed text := crypt('CareMatch123!', gen_salt('bf'));
  u record;
BEGIN
  FOR u IN
    SELECT * FROM (VALUES
      (senior_uid,   'senior@carematch.test',    'Marta Alvarez',    'senior'),
      (family_uid,   'family@carematch.test',    'Dana Alvarez',     'family'),
      (provider_uid, 'caregiver@carematch.test', 'Andrea Rivera',    'provider'),
      (admin_uid,    'admin@carematch.test',     'CareMatch Admin',  'senior')
    ) AS t(uid, email, full_name, role_meta)
  LOOP
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at, confirmation_token, email_change,
      email_change_token_new, recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000', u.uid, 'authenticated', 'authenticated',
      u.email, hashed, now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      jsonb_build_object('full_name', u.full_name, 'name', u.full_name, 'role', u.role_meta),
      now(), now(), '', '', '', ''
    ) ON CONFLICT (id) DO NOTHING;

    INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
    VALUES (gen_random_uuid(), u.uid,
      jsonb_build_object('sub', u.uid::text, 'email', u.email),
      'email', u.uid::text, now(), now(), now())
    ON CONFLICT (provider, provider_id) DO NOTHING;
  END LOOP;

  -- Backfill profiles
  UPDATE public.profiles SET full_name='Marta Alvarez', city='Sarasota, FL', phone='+19415550101', onboarded_at=now(), monthly_budget_cents=80000 WHERE id=senior_uid;
  UPDATE public.profiles SET full_name='Dana Alvarez',  city='Denver, CO',   phone='+13035550102', onboarded_at=now() WHERE id=family_uid;
  UPDATE public.profiles SET full_name='Andrea Rivera', city='Phoenix, AZ',  phone='+16025550103', onboarded_at=now() WHERE id=provider_uid;
  UPDATE public.profiles SET full_name='CareMatch Admin', city='Remote',     phone='+18005550104', onboarded_at=now() WHERE id=admin_uid;

  -- Fix roles (trigger defaults admin to 'senior')
  UPDATE public.user_roles SET role='family'::public.app_role   WHERE user_id=family_uid   AND role='senior'::public.app_role;
  UPDATE public.user_roles SET role='provider'::public.app_role WHERE user_id=provider_uid AND role='senior'::public.app_role;
  DELETE FROM public.user_roles WHERE user_id=admin_uid;
  INSERT INTO public.user_roles (user_id, role) VALUES (admin_uid, 'admin'::public.app_role) ON CONFLICT DO NOTHING;

  -- Provider profile
  INSERT INTO public.providers (id, headline, bio, hourly_rate_cents, years_experience, service_area, specialties, languages, is_active)
  VALUES (provider_uid,
    'Warm, dependable weekday helper',
    'CNA-trained with 8 years supporting older adults through companionship, errands, and light personal care. Same friendly face, every visit.',
    2800, 8, 'Phoenix, AZ',
    ARRAY['Companionship','Errands & rides','Meal prep','Medication reminders']::text[],
    ARRAY['English','Spanish']::text[],
    true)
  ON CONFLICT (id) DO NOTHING;

  -- Senior preferences
  INSERT INTO public.senior_preferences (user_id, text_size, high_contrast, reduce_motion, notify_before_visit, call_for_changes, family_can_see)
  VALUES (senior_uid, 'large', false, false, true, true, true)
  ON CONFLICT (user_id) DO NOTHING;

  -- Link family <-> senior (approved)
  INSERT INTO public.family_links (senior_id, family_id, permission, approved)
  VALUES (senior_uid, family_uid, 'modify', true)
  ON CONFLICT (senior_id, family_id) DO NOTHING;
END $$;
