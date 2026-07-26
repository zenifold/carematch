
ALTER TABLE public.senior_preferences
  ADD COLUMN IF NOT EXISTS extras_monthly_budget_cents integer NOT NULL DEFAULT 4000;

CREATE TABLE IF NOT EXISTS public.visit_extras (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  visit_id uuid REFERENCES public.visits(id) ON DELETE SET NULL,
  kind text NOT NULL CHECK (kind IN ('errand_stop','extra_time','reimbursement','other')),
  amount_cents integer NOT NULL CHECK (amount_cents >= 0),
  note text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','declined','auto_approved')),
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS visit_extras_booking_idx ON public.visit_extras(booking_id);
CREATE INDEX IF NOT EXISTS visit_extras_visit_idx ON public.visit_extras(visit_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.visit_extras TO authenticated;
GRANT ALL ON public.visit_extras TO service_role;

ALTER TABLE public.visit_extras ENABLE ROW LEVEL SECURITY;

CREATE POLICY "visit_extras visible to participants"
ON public.visit_extras FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.bookings b
    WHERE b.id = visit_extras.booking_id
      AND (
        b.senior_id = auth.uid()
        OR b.provider_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.family_links fl
          WHERE fl.senior_id = b.senior_id AND fl.family_id = auth.uid() AND fl.approved = true
        )
      )
  )
);

CREATE POLICY "visit_extras provider inserts"
ON public.visit_extras FOR INSERT
WITH CHECK (
  created_by = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.bookings b
    WHERE b.id = visit_extras.booking_id AND b.provider_id = auth.uid()
  )
);

CREATE POLICY "visit_extras senior approves"
ON public.visit_extras FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.bookings b
    WHERE b.id = visit_extras.booking_id AND b.senior_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.bookings b
    WHERE b.id = visit_extras.booking_id AND b.senior_id = auth.uid()
  )
);

CREATE POLICY "visit_extras provider deletes own pending"
ON public.visit_extras FOR DELETE
USING (
  created_by = auth.uid() AND status = 'pending'
);

CREATE TRIGGER visit_extras_touch_updated_at
BEFORE UPDATE ON public.visit_extras
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
