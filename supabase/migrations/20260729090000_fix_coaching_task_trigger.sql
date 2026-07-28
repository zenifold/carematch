-- recompute_provider_rating_and_coach() inserted into cs_tasks using columns
-- that were never part of that table (`type`, `subject_user_id` — the real
-- columns are `title`, `target_user_id`) and never supplied `created_by`,
-- which is NOT NULL. Since this SECURITY DEFINER function runs from an
-- AFTER INSERT/UPDATE trigger on visits.senior_rating_num, any time a rating
-- pushed a provider's rolling average below 4.5 with 3+ ratings, the coaching
-- task insert would fail and roll back the entire triggering statement —
-- meaning the senior's rating itself would silently fail to save, in exactly
-- the case (a struggling provider) where that feedback matters most.
--
-- cs_tasks.created_by is NOT NULL REFERENCES auth.users(id), but a
-- system-generated coaching task has no human actor. Rather than fake one,
-- make created_by nullable (a NULL creator legitimately means "the system
-- created this"), matching target_user_id/assignee_id which are already
-- nullable with ON DELETE SET NULL.
ALTER TABLE public.cs_tasks ALTER COLUMN created_by DROP NOT NULL;
ALTER TABLE public.cs_tasks DROP CONSTRAINT IF EXISTS cs_tasks_created_by_fkey;
ALTER TABLE public.cs_tasks
  ADD CONSTRAINT cs_tasks_created_by_fkey
  FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;

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
      WHERE target_user_id = pid
        AND title = 'Provider rating dipped below 4.5'
        AND created_at > now() - interval '7 days'
      LIMIT 1;
    IF existing_task_id IS NULL THEN
      INSERT INTO public.cs_tasks (target_user_id, title, status, priority, notes)
      VALUES (pid, 'Provider rating dipped below 4.5', 'open', 'normal',
              'Rolling rating dropped to ' || avg5::text || ' over last ' || total::text || ' rated visits. Reach out with support, not discipline.');
    END IF;
  END IF;

  RETURN NEW;
END; $$;
