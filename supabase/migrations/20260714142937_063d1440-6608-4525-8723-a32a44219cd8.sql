
-- ============ Enums ============
CREATE TYPE public.credential_kind AS ENUM (
  'background_check','id_verification','tb_test','cpr','first_aid',
  'pca','hha','cna','med_tech','phlebotomy','lpn','rn',
  'driver_license','auto_insurance'
);

CREATE TYPE public.referral_payout_status AS ENUM ('none','pending','posted','void');

-- ============ providers additions ============
ALTER TABLE public.providers
  ADD COLUMN onboarding_step smallint NOT NULL DEFAULT 0,
  ADD COLUMN service_tier smallint NOT NULL DEFAULT 0;

-- ============ provider_credentials ============
CREATE TABLE public.provider_credentials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  kind public.credential_kind NOT NULL,
  status public.verification_status NOT NULL DEFAULT 'pending',
  issued_on date,
  expires_on date,
  issuing_state text,
  document_path text,
  verified_at timestamptz,
  verified_by uuid,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (provider_id, kind)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.provider_credentials TO authenticated;
GRANT ALL ON public.provider_credentials TO service_role;
ALTER TABLE public.provider_credentials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Providers manage own credentials"
  ON public.provider_credentials FOR ALL TO authenticated
  USING (auth.uid() = provider_id)
  WITH CHECK (auth.uid() = provider_id);

CREATE POLICY "Staff read all credentials"
  ON public.provider_credentials FOR SELECT TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin','staff','support','success']::public.app_role[]));

CREATE POLICY "Staff update credentials"
  ON public.provider_credentials FOR UPDATE TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin','staff','support']::public.app_role[]));

CREATE TRIGGER trg_provider_credentials_touch
  BEFORE UPDATE ON public.provider_credentials
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Backfill from verifications
INSERT INTO public.provider_credentials (provider_id, kind, status, issued_on, expires_on, verified_at, notes)
SELECT provider_id, kind::text::public.credential_kind, status, verified_on, expires_on,
       CASE WHEN status = 'passed' THEN created_at END,
       vendor
FROM public.verifications
ON CONFLICT DO NOTHING;

-- ============ service_capabilities catalog ============
CREATE TABLE public.service_capabilities (
  code text PRIMARY KEY,
  label text NOT NULL,
  category text NOT NULL,
  required_tier smallint NOT NULL DEFAULT 0,
  required_credential public.credential_kind,
  description text,
  active boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 0
);
GRANT SELECT ON public.service_capabilities TO anon, authenticated;
GRANT ALL ON public.service_capabilities TO service_role;
ALTER TABLE public.service_capabilities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public reads active capabilities"
  ON public.service_capabilities FOR SELECT TO anon, authenticated
  USING (active = true);
CREATE POLICY "Admins manage capabilities"
  ON public.service_capabilities FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ============ provider_capabilities ============
CREATE TABLE public.provider_capabilities (
  provider_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  capability_code text NOT NULL REFERENCES public.service_capabilities(code) ON DELETE CASCADE,
  opted_in boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (provider_id, capability_code)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.provider_capabilities TO authenticated;
GRANT ALL ON public.provider_capabilities TO service_role;
GRANT SELECT ON public.provider_capabilities TO anon;
ALTER TABLE public.provider_capabilities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone reads capability opt-ins"
  ON public.provider_capabilities FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Providers manage own capabilities"
  ON public.provider_capabilities FOR ALL TO authenticated
  USING (auth.uid() = provider_id)
  WITH CHECK (auth.uid() = provider_id);

-- ============ training_programs ============
CREATE TABLE public.training_programs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  provider_org text NOT NULL,
  credential_kind public.credential_kind NOT NULL,
  state text,
  city text,
  format text,
  cost_cents int,
  duration_weeks int,
  url text NOT NULL,
  our_referral_id text NOT NULL,
  bounty_cents int NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.training_programs TO anon, authenticated;
GRANT ALL ON public.training_programs TO service_role;
ALTER TABLE public.training_programs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public reads active programs"
  ON public.training_programs FOR SELECT TO anon, authenticated
  USING (active = true);
CREATE POLICY "Admins manage programs"
  ON public.training_programs FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_training_programs_touch
  BEFORE UPDATE ON public.training_programs
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ============ training_referrals ============
CREATE TABLE public.training_referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  program_id uuid NOT NULL REFERENCES public.training_programs(id) ON DELETE RESTRICT,
  clicked_at timestamptz NOT NULL DEFAULT now(),
  applied_at timestamptz,
  enrolled_at timestamptz,
  completed_at timestamptz,
  payout_cents int NOT NULL DEFAULT 0,
  payout_status public.referral_payout_status NOT NULL DEFAULT 'none',
  external_ref text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.training_referrals TO authenticated;
GRANT ALL ON public.training_referrals TO service_role;
ALTER TABLE public.training_referrals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Providers read own referrals"
  ON public.training_referrals FOR SELECT TO authenticated
  USING (auth.uid() = provider_id
         OR public.has_any_role(auth.uid(), ARRAY['admin','finance','staff','success']::public.app_role[]));
CREATE POLICY "Providers create own referrals"
  ON public.training_referrals FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = provider_id);
CREATE POLICY "Finance updates referral payouts"
  ON public.training_referrals FOR UPDATE TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin','finance','staff']::public.app_role[]));

CREATE TRIGGER trg_training_referrals_touch
  BEFORE UPDATE ON public.training_referrals
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ============ Tier-recompute trigger ============
CREATE OR REPLACE FUNCTION public.recompute_provider_tier()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  pid uuid;
  new_tier smallint;
  has_bg boolean;
  has_pca_hha boolean;
  has_cna boolean;
  has_clinical boolean;
BEGIN
  pid := COALESCE(NEW.provider_id, OLD.provider_id);

  SELECT EXISTS (SELECT 1 FROM public.provider_credentials
                  WHERE provider_id = pid AND kind = 'background_check' AND status = 'passed'),
         EXISTS (SELECT 1 FROM public.provider_credentials
                  WHERE provider_id = pid AND kind IN ('pca','hha') AND status = 'passed'),
         EXISTS (SELECT 1 FROM public.provider_credentials
                  WHERE provider_id = pid AND kind = 'cna' AND status = 'passed'),
         EXISTS (SELECT 1 FROM public.provider_credentials
                  WHERE provider_id = pid AND kind IN ('lpn','rn','phlebotomy','med_tech') AND status = 'passed')
    INTO has_bg, has_pca_hha, has_cna, has_clinical;

  new_tier := 0;
  IF has_bg AND has_pca_hha THEN new_tier := 1; END IF;
  IF has_bg AND has_cna THEN new_tier := 2; END IF;
  IF has_bg AND has_clinical THEN new_tier := 3; END IF;

  UPDATE public.providers SET service_tier = new_tier WHERE id = pid;

  -- Revoke opted-in capabilities above the new tier
  DELETE FROM public.provider_capabilities pc
   USING public.service_capabilities sc
   WHERE pc.provider_id = pid
     AND pc.capability_code = sc.code
     AND sc.required_tier > new_tier;

  RETURN COALESCE(NEW, OLD);
END; $$;
REVOKE EXECUTE ON FUNCTION public.recompute_provider_tier() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER trg_recompute_tier_ins_upd
  AFTER INSERT OR UPDATE OF status ON public.provider_credentials
  FOR EACH ROW EXECUTE FUNCTION public.recompute_provider_tier();
CREATE TRIGGER trg_recompute_tier_del
  AFTER DELETE ON public.provider_credentials
  FOR EACH ROW EXECUTE FUNCTION public.recompute_provider_tier();

-- Backfill existing providers
DO $$ DECLARE r RECORD; BEGIN
  FOR r IN SELECT id FROM public.providers LOOP
    UPDATE public.providers SET service_tier = 0 WHERE id = r.id;
    -- fire recompute by touching one credential row if exists, else stay 0
    UPDATE public.provider_credentials SET status = status WHERE provider_id = r.id;
  END LOOP;
END $$;

-- ============ Seed service capabilities ============
INSERT INTO public.service_capabilities (code, label, category, required_tier, required_credential, description, sort_order) VALUES
  ('companionship',    'Companionship & conversation', 'companion', 0, NULL, 'Visit, chat, read, play games.', 10),
  ('walks',            'Walks & light activity',       'companion', 0, NULL, 'Short walks, garden time.', 15),
  ('tech_help',        'Tech help',                    'companion', 0, NULL, 'Phone, tablet, video calls.', 20),
  ('housekeeping',     'Light housekeeping',           'household', 0, NULL, 'Tidying, dishes, vacuuming.', 30),
  ('laundry',          'Laundry',                      'household', 0, NULL, 'Wash, dry, fold.', 35),
  ('meal_prep_basic',  'Meal prep (standard diet)',    'household', 0, NULL, 'Simple meals; no therapeutic diets.', 40),
  ('errands',          'Errands & groceries',          'errands',   0, 'driver_license', 'Grocery pickup, pharmacy.', 50),
  ('transport',        'Transportation',               'errands',   0, 'driver_license', 'Rides to appointments.', 55),
  ('pet_care',         'Pet & plant care',             'household', 0, NULL, 'Walk, feed, water.', 60),
  ('respite',          'Respite sit',                  'companion', 0, NULL, 'Cover while family is out.', 70),

  ('bathing',          'Bathing assistance',           'personal',  1, 'pca', 'Bath, shower, hygiene.', 110),
  ('dressing',         'Dressing assistance',          'personal',  1, 'pca', 'Help getting dressed.', 115),
  ('toileting',        'Toileting & incontinence',     'personal',  1, 'pca', 'Bathroom, brief changes.', 120),
  ('transfers',        'Transfers with gait belt',     'personal',  1, 'pca', 'Bed-to-chair, sit-to-stand.', 125),
  ('mobility',         'Ambulation & mobility',        'personal',  1, 'pca', 'Walker, cane support.', 130),
  ('meal_prep_diet',   'Meal prep (therapeutic diet)', 'personal',  1, 'pca', 'Diabetic, low-sodium, renal.', 140),
  ('med_reminders',    'Medication reminders',         'personal',  1, 'pca', 'Prompts, not administration.', 145),

  ('vitals',           'Vitals (BP, pulse, temp, SpO2)','clinical', 2, 'cna', 'Take and record vitals.', 210),
  ('glucose',          'Glucose checks',               'clinical',  2, 'cna', 'Fingerstick, log readings.', 215),
  ('wound_observe',    'Wound observation',            'clinical',  2, 'cna', 'Observe, photograph, report.', 220),
  ('mech_lift',        'Mechanical lift (Hoyer)',      'clinical',  2, 'cna', 'Two-person or with equipment.', 225),
  ('post_op',          'Post-op / discharge support',  'clinical',  2, 'cna', 'Follow discharge plan.', 230),

  ('med_admin',        'Medication administration',    'skilled',   3, 'med_tech', 'Administer per MAR.', 310),
  ('injections',       'Injections',                   'skilled',   3, 'lpn', 'SQ / IM per scope.', 315),
  ('phlebotomy',       'Blood draws (in-home)',        'skilled',   3, 'phlebotomy', 'Venipuncture, capillary.', 320),
  ('catheter_ostomy',  'Catheter / ostomy care',       'skilled',   3, 'lpn', 'Change, monitor.', 325),
  ('wound_dressing',   'Wound dressing changes',       'skilled',   3, 'lpn', 'Sterile technique.', 330)
ON CONFLICT (code) DO NOTHING;

-- ============ Seed training programs ============
INSERT INTO public.training_programs (name, provider_org, credential_kind, state, city, format, cost_cents, duration_weeks, url, our_referral_id, bounty_cents, description)
VALUES
  ('Home Health Aide Certification','Red Cross Regional','hha', NULL, NULL, 'hybrid', 75000, 3, 'https://www.redcross.org/take-a-class', 'cm-hha-rc', 5000, 'Nationally recognized HHA training with in-person clinicals.'),
  ('Personal Care Aide (75-hr state)', 'CareCollege Online', 'pca', NULL, NULL, 'online', 39900, 3, 'https://carecollege.example.com/pca', 'cm-pca-cc', 4000, '75-hour PCA curriculum accepted by most state registries.'),
  ('Certified Nursing Assistant', 'Community College of Sarasota', 'cna', 'FL', 'Sarasota', 'in-person', 89900, 6, 'https://scf.edu/cna', 'cm-cna-scf', 12000, 'State-approved CNA program with clinical rotations.'),
  ('CNA Fast-Track', 'PimaCNA Institute', 'cna', 'AZ', 'Phoenix', 'in-person', 79900, 4, 'https://pimacna.example.com', 'cm-cna-pima', 12000, 'Weekend-friendly 4-week CNA course.'),
  ('Phlebotomy Technician', 'National Phlebotomy Academy', 'phlebotomy', NULL, NULL, 'hybrid', 129900, 8, 'https://npa.example.com', 'cm-phleb-npa', 15000, 'Includes 100+ successful venipunctures.'),
  ('Medication Aide (Med-Tech)', 'AllCare Academy', 'med_tech', 'TX', 'Austin', 'in-person', 59900, 4, 'https://allcare.example.com/medtech', 'cm-medtech-ac', 8000, 'Texas-approved medication aide program.'),
  ('BLS + CPR Certification', 'American Heart Association', 'cpr', NULL, NULL, 'in-person', 8500, 1, 'https://cpr.heart.org', 'cm-cpr-aha', 1000, 'Half-day BLS + CPR certification, valid 2 years.'),
  ('LPN Bridge Program', 'Statewide Nursing Institute', 'lpn', NULL, NULL, 'in-person', 899900, 52, 'https://sni.example.com/lpn', 'cm-lpn-sni', 30000, 'One-year LPN track for existing CNAs.')
ON CONFLICT DO NOTHING;
