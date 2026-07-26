
-- role enum
CREATE TYPE public.app_role AS ENUM ('senior', 'family', 'provider');
CREATE TYPE public.verification_kind AS ENUM ('id_check', 'background_check', 'license_check', 'references', 'insurance');
CREATE TYPE public.verification_status AS ENUM ('pending', 'passed', 'failed', 'expired');
CREATE TYPE public.booking_status AS ENUM ('requested', 'confirmed', 'in_progress', 'completed', 'cancelled');
CREATE TYPE public.provider_tier AS ENUM ('bronze', 'silver', 'gold');

-- profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  role app_role NOT NULL DEFAULT 'senior',
  phone TEXT,
  avatar_url TEXT,
  city TEXT,
  monthly_budget_cents INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles readable by authenticated" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "profiles insert own" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles update own" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- providers
CREATE TABLE public.providers (
  id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  tier provider_tier NOT NULL DEFAULT 'bronze',
  hourly_rate_cents INTEGER NOT NULL DEFAULT 2400,
  bio TEXT,
  headline TEXT,
  years_experience INTEGER,
  specialties TEXT[] NOT NULL DEFAULT '{}',
  languages TEXT[] NOT NULL DEFAULT '{English}',
  service_area TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.providers TO authenticated;
GRANT ALL ON public.providers TO service_role;
ALTER TABLE public.providers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "providers readable by authenticated" ON public.providers FOR SELECT TO authenticated USING (true);
CREATE POLICY "providers manage own" ON public.providers FOR ALL TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- verifications
CREATE TABLE public.verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID NOT NULL REFERENCES public.providers(id) ON DELETE CASCADE,
  kind verification_kind NOT NULL,
  status verification_status NOT NULL DEFAULT 'pending',
  verified_on DATE,
  expires_on DATE,
  vendor TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.verifications TO authenticated;
GRANT ALL ON public.verifications TO service_role;
ALTER TABLE public.verifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "verifications readable by authenticated" ON public.verifications FOR SELECT TO authenticated USING (true);
CREATE POLICY "verifications manage own" ON public.verifications FOR ALL TO authenticated USING (auth.uid() = provider_id) WITH CHECK (auth.uid() = provider_id);

-- bookings
CREATE TABLE public.bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  senior_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  provider_id UUID NOT NULL REFERENCES public.providers(id) ON DELETE RESTRICT,
  scheduled_at TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 120,
  service_type TEXT NOT NULL DEFAULT 'companionship',
  status booking_status NOT NULL DEFAULT 'requested',
  hourly_rate_cents INTEGER NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.bookings TO authenticated;
GRANT ALL ON public.bookings TO service_role;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- family_links
CREATE TABLE public.family_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  senior_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  family_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  permission TEXT NOT NULL DEFAULT 'view',
  approved BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(senior_id, family_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.family_links TO authenticated;
GRANT ALL ON public.family_links TO service_role;
ALTER TABLE public.family_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY "family_links visible to participants" ON public.family_links FOR SELECT TO authenticated USING (auth.uid() = senior_id OR auth.uid() = family_id);
CREATE POLICY "family_links create by family or senior" ON public.family_links FOR INSERT TO authenticated WITH CHECK (auth.uid() = family_id OR auth.uid() = senior_id);
CREATE POLICY "family_links senior manages" ON public.family_links FOR UPDATE TO authenticated USING (auth.uid() = senior_id) WITH CHECK (auth.uid() = senior_id);
CREATE POLICY "family_links senior deletes" ON public.family_links FOR DELETE TO authenticated USING (auth.uid() = senior_id);

-- bookings RLS (after family_links exists)
CREATE POLICY "bookings visible to participants" ON public.bookings FOR SELECT TO authenticated USING (
  auth.uid() = senior_id
  OR auth.uid() = provider_id
  OR EXISTS (SELECT 1 FROM public.family_links fl WHERE fl.senior_id = bookings.senior_id AND fl.family_id = auth.uid() AND fl.approved = true)
);
CREATE POLICY "bookings senior creates" ON public.bookings FOR INSERT TO authenticated WITH CHECK (auth.uid() = senior_id);
CREATE POLICY "bookings participants update" ON public.bookings FOR UPDATE TO authenticated USING (auth.uid() = senior_id OR auth.uid() = provider_id) WITH CHECK (auth.uid() = senior_id OR auth.uid() = provider_id);

-- visits
CREATE TABLE public.visits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  checked_in_at TIMESTAMPTZ,
  checked_out_at TIMESTAMPTZ,
  provider_notes TEXT,
  senior_rating TEXT,
  senior_comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.visits TO authenticated;
GRANT ALL ON public.visits TO service_role;
ALTER TABLE public.visits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "visits visible via booking" ON public.visits FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.bookings b WHERE b.id = visits.booking_id AND (
    b.senior_id = auth.uid()
    OR b.provider_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.family_links fl WHERE fl.senior_id = b.senior_id AND fl.family_id = auth.uid() AND fl.approved = true)
  ))
);
CREATE POLICY "visits provider writes" ON public.visits FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM public.bookings b WHERE b.id = visits.booking_id AND b.provider_id = auth.uid())
) WITH CHECK (
  EXISTS (SELECT 1 FROM public.bookings b WHERE b.id = visits.booking_id AND b.provider_id = auth.uid())
);

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.touch_updated_at() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql SET search_path = public;
CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER trg_providers_updated BEFORE UPDATE ON public.providers FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER trg_bookings_updated BEFORE UPDATE ON public.bookings FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
