
-- Visits: plan items, check-in coords, checkout summary + voice, numeric rating
ALTER TABLE public.visits
  ADD COLUMN IF NOT EXISTS plan_items jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS checkin_lat numeric(9,6),
  ADD COLUMN IF NOT EXISTS checkin_lng numeric(9,6),
  ADD COLUMN IF NOT EXISTS checkout_summary_text text,
  ADD COLUMN IF NOT EXISTS checkout_voice_url text,
  ADD COLUMN IF NOT EXISTS senior_rating_num smallint CHECK (senior_rating_num IS NULL OR senior_rating_num BETWEEN 1 AND 5),
  ADD COLUMN IF NOT EXISTS rated_at timestamptz;

-- Bookings: provider-side rating of senior/visit
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS provider_rating smallint CHECK (provider_rating IS NULL OR provider_rating BETWEEN 1 AND 5),
  ADD COLUMN IF NOT EXISTS provider_comment text;

-- Providers: rolling rating + visit counters
ALTER TABLE public.providers
  ADD COLUMN IF NOT EXISTS rating_avg numeric(3,2),
  ADD COLUMN IF NOT EXISTS rating_count integer NOT NULL DEFAULT 0;

-- Bonus ledger (idempotent per provider+senior+milestone)
CREATE TABLE IF NOT EXISTS public.visit_bonuses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id uuid NOT NULL REFERENCES public.providers(id) ON DELETE CASCADE,
  senior_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  milestone smallint NOT NULL,
  visit_id uuid REFERENCES public.visits(id) ON DELETE SET NULL,
  ledger_id uuid REFERENCES public.payment_ledger(id) ON DELETE SET NULL,
  amount_cents integer NOT NULL,
  awarded_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (provider_id, senior_id, milestone)
);

GRANT SELECT ON public.visit_bonuses TO authenticated;
GRANT ALL ON public.visit_bonuses TO service_role;

ALTER TABLE public.visit_bonuses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "bonuses visible to parties"
  ON public.visit_bonuses FOR SELECT
  TO authenticated
  USING (
    provider_id = auth.uid()
    OR senior_id = auth.uid()
    OR public.has_any_role(auth.uid(), ARRAY['admin','staff','support','success']::public.app_role[])
    OR EXISTS (SELECT 1 FROM public.family_links fl
                WHERE fl.senior_id = visit_bonuses.senior_id
                  AND fl.family_id = auth.uid()
                  AND fl.approved = true)
  );

CREATE INDEX IF NOT EXISTS visit_bonuses_provider_idx ON public.visit_bonuses (provider_id);

-- Rolling avg + coaching task trigger on senior rating
CREATE OR REPLACE FUNCTION public.recompute_provider_rating_and_coach()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  pid uuid;
  avg5 numeric(3,2);
  total integer;
  recent_low_count integer;
  existing_task_id uuid;
BEGIN
  IF NEW.senior_rating_num IS NULL THEN
    RETURN NEW;
  END IF;
  IF TG_OP = 'UPDATE' AND NEW.senior_rating_num IS NOT DISTINCT FROM OLD.senior_rating_num THEN
    RETURN NEW;
  END IF;

  SELECT b.provider_id INTO pid FROM public.bookings b WHERE b.id = NEW.booking_id;
  IF pid IS NULL THEN RETURN NEW; END IF;

  -- Rolling avg over last 5 rated visits
  SELECT AVG(x.senior_rating_num)::numeric(3,2), COUNT(*)
    INTO avg5, total
    FROM (
      SELECT v.senior_rating_num
        FROM public.visits v
        JOIN public.bookings b ON b.id = v.booking_id
        WHERE b.provider_id = pid AND v.senior_rating_num IS NOT NULL
        ORDER BY v.rated_at DESC NULLS LAST, v.created_at DESC
        LIMIT 5
    ) x;

  UPDATE public.providers
     SET rating_avg = avg5,
         rating_count = (SELECT COUNT(*) FROM public.visits v
                           JOIN public.bookings b ON b.id = v.booking_id
                           WHERE b.provider_id = pid AND v.senior_rating_num IS NOT NULL)
     WHERE id = pid;

  -- Coaching task if avg dips below 4.5 with at least 3 ratings; dedup within 7 days
  IF avg5 IS NOT NULL AND avg5 < 4.5 AND total >= 3 THEN
    SELECT id INTO existing_task_id
      FROM public.cs_tasks
      WHERE type = 'coaching_outreach'
        AND subject_user_id = pid
        AND created_at > now() - interval '7 days'
      LIMIT 1;
    IF existing_task_id IS NULL THEN
      INSERT INTO public.cs_tasks (type, subject_user_id, status, priority, notes)
      VALUES ('coaching_outreach', pid, 'open', 'normal',
              'Rolling rating dropped to ' || avg5::text || ' over last ' || total::text || ' rated visits. Reach out with support, not discipline.');
    END IF;
  END IF;

  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_visits_rating_coach ON public.visits;
CREATE TRIGGER trg_visits_rating_coach
  AFTER INSERT OR UPDATE OF senior_rating_num ON public.visits
  FOR EACH ROW EXECUTE FUNCTION public.recompute_provider_rating_and_coach();
