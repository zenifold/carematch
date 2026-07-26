-- Onboarding collects "what do you need help with?" but never persisted it
-- (onboarding.senior.tsx only used it to pick a post-signup redirect).
ALTER TABLE public.senior_preferences
  ADD COLUMN IF NOT EXISTS care_needs text[] NOT NULL DEFAULT '{}';
