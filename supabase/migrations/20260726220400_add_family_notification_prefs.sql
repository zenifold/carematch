-- family.settings.tsx notification toggles were local useState only,
-- discarded on reload. Mirrors the shape of senior_preferences' notification
-- flags but scoped to the family user, not the senior.
CREATE TABLE public.family_notification_prefs (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  sms boolean NOT NULL DEFAULT true,
  email boolean NOT NULL DEFAULT true,
  push boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.family_notification_prefs TO authenticated;
GRANT ALL ON public.family_notification_prefs TO service_role;
ALTER TABLE public.family_notification_prefs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "family notification prefs select own"
  ON public.family_notification_prefs FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);
CREATE POLICY "family notification prefs insert own"
  ON public.family_notification_prefs FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "family notification prefs update own"
  ON public.family_notification_prefs FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER family_notification_prefs_set_updated_at
  BEFORE UPDATE ON public.family_notification_prefs
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
