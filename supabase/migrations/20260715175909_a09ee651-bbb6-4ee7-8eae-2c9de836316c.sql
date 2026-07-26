ALTER TABLE public.senior_preferences
  ADD COLUMN IF NOT EXISTS family_can_edit boolean NOT NULL DEFAULT false;