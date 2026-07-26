
CREATE TYPE public.incident_category AS ENUM ('no_show','safety','abuse','theft','quality','billing','other');
CREATE TYPE public.incident_status AS ENUM ('open','triaged','resolved','dismissed');

CREATE TABLE public.incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
  subject_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  category public.incident_category NOT NULL,
  status public.incident_status NOT NULL DEFAULT 'open',
  severity SMALLINT NOT NULL DEFAULT 2 CHECK (severity BETWEEN 1 AND 4),
  summary TEXT NOT NULL CHECK (length(summary) BETWEEN 1 AND 4000),
  resolution_notes TEXT,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX incidents_status_created_idx ON public.incidents(status, created_at DESC);
CREATE INDEX incidents_reporter_idx ON public.incidents(reporter_id, created_at DESC);

GRANT SELECT, INSERT, UPDATE ON public.incidents TO authenticated;
GRANT ALL ON public.incidents TO service_role;

ALTER TABLE public.incidents ENABLE ROW LEVEL SECURITY;

-- Reporters can read and create their own incidents.
CREATE POLICY "Reporters read own incidents" ON public.incidents
  FOR SELECT TO authenticated
  USING (reporter_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Reporters create own incidents" ON public.incidents
  FOR INSERT TO authenticated
  WITH CHECK (reporter_id = auth.uid());

-- Only admins can update (triage/resolve).
CREATE POLICY "Admins update incidents" ON public.incidents
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER incidents_touch_updated_at
  BEFORE UPDATE ON public.incidents
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
