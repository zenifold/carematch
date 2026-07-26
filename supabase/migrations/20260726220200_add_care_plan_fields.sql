-- senior.care-plan.tsx and family.care-plan.tsx render Medical/At-home/No-go
-- as static placeholder text with nowhere to save real data. profiles.care_notes
-- already exists (an append-only family-suggestion ledger written by
-- apply_change_request's 'care_note' branch) but was never displayed either.
-- These three are current-state fields the senior edits directly; family can
-- view them and, like care_notes, propose changes via the existing
-- change-request flow rather than editing directly.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS care_medical_notes text,
  ADD COLUMN IF NOT EXISTS care_home_notes text,
  ADD COLUMN IF NOT EXISTS care_no_go_notes text;
