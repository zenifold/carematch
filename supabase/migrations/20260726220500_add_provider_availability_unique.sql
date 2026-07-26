-- provider.profile.tsx's weekday availability picker was decorative (no
-- onClick, always rendered "active") despite this table already existing.
-- A unique constraint lets the UI upsert one row per weekday cleanly.
ALTER TABLE public.provider_availability
  ADD CONSTRAINT provider_availability_provider_weekday_key UNIQUE (provider_id, weekday);
