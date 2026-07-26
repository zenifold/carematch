-- Fix handle_new_user to also set profiles.role from signup metadata.
-- Without this, family and provider signups land on /onboarding/senior because
-- the dashboard router reads profiles.role which was silently defaulting to 'senior'.
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  requested text;
  resolved public.app_role;
BEGIN
  requested := NEW.raw_user_meta_data->>'role';
  IF requested IN ('senior', 'family', 'provider') THEN
    resolved := requested::public.app_role;
  ELSE
    resolved := 'senior'::public.app_role;
  END IF;

  INSERT INTO public.profiles (id, full_name, avatar_url, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url',
    resolved
  );

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, resolved)
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN NEW;
END;
$function$;

-- Backfill: sync profiles.role from user_roles for any existing users where they disagree.
UPDATE public.profiles p
   SET role = ur.role
  FROM public.user_roles ur
 WHERE ur.user_id = p.id
   AND p.role IS DISTINCT FROM ur.role;