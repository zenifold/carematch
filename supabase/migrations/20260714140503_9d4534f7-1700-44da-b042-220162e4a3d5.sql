
DO $$ BEGIN
  CREATE TYPE public.cs_task_status AS ENUM ('open','in_progress','done','snoozed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.cs_task_priority AS ENUM ('low','normal','high');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.broadcast_audience AS ENUM ('all','senior','family','provider','staff');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- cs_tasks
CREATE TABLE public.cs_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  target_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  assignee_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  title text NOT NULL,
  notes text,
  status public.cs_task_status NOT NULL DEFAULT 'open',
  priority public.cs_task_priority NOT NULL DEFAULT 'normal',
  due_at timestamptz,
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.cs_tasks TO authenticated;
GRANT ALL ON public.cs_tasks TO service_role;
ALTER TABLE public.cs_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff read CS tasks"
  ON public.cs_tasks FOR SELECT TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin','success','staff','support']::public.app_role[]));

CREATE POLICY "Staff create CS tasks"
  ON public.cs_tasks FOR INSERT TO authenticated
  WITH CHECK (
    created_by = auth.uid()
    AND public.has_any_role(auth.uid(), ARRAY['admin','success','staff','support']::public.app_role[])
  );

CREATE POLICY "Staff update CS tasks"
  ON public.cs_tasks FOR UPDATE TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin','success','staff','support']::public.app_role[]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin','success','staff','support']::public.app_role[]));

CREATE POLICY "Admins delete CS tasks"
  ON public.cs_tasks FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX cs_tasks_status_idx ON public.cs_tasks(status, due_at NULLS LAST);
CREATE INDEX cs_tasks_assignee_idx ON public.cs_tasks(assignee_id, status);

CREATE TRIGGER cs_tasks_touch BEFORE UPDATE ON public.cs_tasks
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- feature_flags
CREATE TABLE public.feature_flags (
  key text PRIMARY KEY,
  description text,
  enabled boolean NOT NULL DEFAULT false,
  rollout_percent smallint NOT NULL DEFAULT 100 CHECK (rollout_percent BETWEEN 0 AND 100),
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.feature_flags TO authenticated;
GRANT ALL ON public.feature_flags TO service_role;
ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone signed in reads flags"
  ON public.feature_flags FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins write flags"
  ON public.feature_flags FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER feature_flags_touch BEFORE UPDATE ON public.feature_flags
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- broadcasts
CREATE TABLE public.broadcasts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  body text NOT NULL,
  audience public.broadcast_audience NOT NULL DEFAULT 'all',
  starts_at timestamptz NOT NULL DEFAULT now(),
  ends_at timestamptz,
  dismissible boolean NOT NULL DEFAULT true,
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.broadcasts TO authenticated;
GRANT ALL ON public.broadcasts TO service_role;
ALTER TABLE public.broadcasts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Signed-in users read active broadcasts"
  ON public.broadcasts FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR (
      starts_at <= now()
      AND (ends_at IS NULL OR ends_at > now())
    )
  );

CREATE POLICY "Admins manage broadcasts"
  ON public.broadcasts FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin') AND created_by = auth.uid());

CREATE POLICY "Admins update broadcasts"
  ON public.broadcasts FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins delete broadcasts"
  ON public.broadcasts FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX broadcasts_active_idx ON public.broadcasts(starts_at, ends_at);

CREATE TRIGGER broadcasts_touch BEFORE UPDATE ON public.broadcasts
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
