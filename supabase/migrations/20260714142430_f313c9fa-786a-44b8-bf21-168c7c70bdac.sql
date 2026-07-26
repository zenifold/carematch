
CREATE OR REPLACE FUNCTION public.notify_booking_change()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE senior_name text; provider_name text;
BEGIN
  SELECT full_name INTO senior_name FROM public.profiles WHERE id = NEW.senior_id;
  SELECT full_name INTO provider_name FROM public.profiles WHERE id = NEW.provider_id;
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.notifications (user_id, kind, title, body, link)
    VALUES (NEW.provider_id, 'booking_request', 'New booking request',
      COALESCE(senior_name,'A senior') || ' requested a ' || NEW.service_type || ' visit', '/provider/jobs');
    RETURN NEW;
  END IF;
  IF TG_OP = 'UPDATE' AND NEW.status IS DISTINCT FROM OLD.status THEN
    IF NEW.status = 'accepted' THEN
      INSERT INTO public.notifications (user_id, kind, title, body, link)
      VALUES (NEW.senior_id, 'booking_accepted', 'Booking accepted',
        COALESCE(provider_name,'Your caregiver') || ' accepted your visit', '/senior/visits');
    ELSIF NEW.status IN ('declined','cancelled') THEN
      INSERT INTO public.notifications (user_id, kind, title, body, link)
      VALUES (NEW.senior_id, 'booking_declined', 'Booking ' || NEW.status,
        'Your visit request was ' || NEW.status, '/senior/visits');
    END IF;
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_notify_booking_change ON public.bookings;
CREATE TRIGGER trg_notify_booking_change
AFTER INSERT OR UPDATE ON public.bookings
FOR EACH ROW EXECUTE FUNCTION public.notify_booking_change();

CREATE OR REPLACE FUNCTION public.notify_new_message()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE recipient uuid; sender_name text;
BEGIN
  SELECT CASE WHEN participant_a = NEW.sender_id THEN participant_b ELSE participant_a END
    INTO recipient FROM public.conversations WHERE id = NEW.conversation_id;
  IF recipient IS NULL THEN RETURN NEW; END IF;
  SELECT full_name INTO sender_name FROM public.profiles WHERE id = NEW.sender_id;
  INSERT INTO public.notifications (user_id, kind, title, body, link)
  VALUES (recipient, 'message', 'New message from ' || COALESCE(sender_name,'someone'),
    LEFT(NEW.body, 140), '/senior/messages/' || NEW.conversation_id);
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_notify_new_message ON public.messages;
CREATE TRIGGER trg_notify_new_message
AFTER INSERT ON public.messages
FOR EACH ROW EXECUTE FUNCTION public.notify_new_message();

CREATE OR REPLACE FUNCTION public.notify_verification_change()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO public.notifications (user_id, kind, title, body, link)
    VALUES (NEW.provider_id, 'verification_update', 'Verification ' || NEW.status,
      'Your ' || NEW.kind || ' verification is now ' || NEW.status, '/provider/profile');
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_notify_verification_change ON public.verifications;
CREATE TRIGGER trg_notify_verification_change
AFTER UPDATE ON public.verifications
FOR EACH ROW EXECUTE FUNCTION public.notify_verification_change();

DO $$
DECLARE demo RECORD; new_uid uuid;
BEGIN
  FOR demo IN
    SELECT * FROM (VALUES
      ('nia.okafor@carematch.demo',   'Nia Okafor',        'Atlanta, GA',  'silver'::public.provider_tier,  3200, 6,  ARRAY['companionship','light-housekeeping','errands'], ARRAY['English'],           'Warm companion who loves crosswords and long walks.', 'Companion caregiver in Atlanta'),
      ('priya.shah@carematch.demo',   'Priya Shah',        'Austin, TX',   'gold'::public.provider_tier,    4800, 9,  ARRAY['personal-care','medication-reminders','dementia-care'], ARRAY['English','Hindi','Gujarati'], 'CNA with a decade of dementia-care experience.', 'Premium personal-care caregiver'),
      ('marcus.chen@carematch.demo',  'Marcus Chen',       'Seattle, WA',  'silver'::public.provider_tier,  3600, 4,  ARRAY['companionship','transportation','errands'], ARRAY['English','Mandarin'], 'Patient driver and companion for medical appointments.', 'Transportation & companion care'),
      ('luisa.fernandez@carematch.demo','Luisa Fernandez', 'Miami, FL',    'gold'::public.provider_tier,    5000, 12, ARRAY['personal-care','post-op-recovery','meal-prep'], ARRAY['English','Spanish'], 'Bilingual caregiver specializing in post-hospital recovery.', 'Bilingual post-op recovery caregiver')
    ) AS t(email, full_name, service_area, tier, hourly_rate_cents, years_experience, specialties, languages, bio, headline)
  LOOP
    IF EXISTS (SELECT 1 FROM auth.users WHERE email = demo.email) THEN CONTINUE; END IF;
    new_uid := gen_random_uuid();
    INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password,
      email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
    VALUES (new_uid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
      demo.email, crypt('CareMatch123!', gen_salt('bf')), now(),
      jsonb_build_object('provider','email'),
      jsonb_build_object('full_name', demo.full_name, 'role','provider'),
      now(), now());
    UPDATE public.profiles SET full_name = demo.full_name WHERE id = new_uid;
    INSERT INTO public.user_roles (user_id, role) VALUES (new_uid, 'provider') ON CONFLICT DO NOTHING;
    DELETE FROM public.user_roles WHERE user_id = new_uid AND role = 'senior';
    INSERT INTO public.providers (id, tier, hourly_rate_cents, bio, headline, years_experience,
      specialties, languages, service_area, is_active)
    VALUES (new_uid, demo.tier, demo.hourly_rate_cents, demo.bio, demo.headline,
      demo.years_experience, demo.specialties, demo.languages, demo.service_area, true);
    INSERT INTO public.verifications (provider_id, kind, status, verified_on, vendor)
    VALUES (new_uid, 'background_check', 'passed', current_date - interval '30 days', 'Checkr');
  END LOOP;
END $$;
