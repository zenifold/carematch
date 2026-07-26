
-- Support ticket enums
DO $$ BEGIN
  CREATE TYPE public.support_status AS ENUM ('open','pending','resolved','closed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.support_priority AS ENUM ('low','normal','high','urgent');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.support_portal AS ENUM ('senior','family','provider','other');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- support_tickets
CREATE TABLE public.support_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  assignee_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  subject text NOT NULL,
  body text NOT NULL,
  status public.support_status NOT NULL DEFAULT 'open',
  priority public.support_priority NOT NULL DEFAULT 'normal',
  category text,
  portal public.support_portal NOT NULL DEFAULT 'other',
  last_activity_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.support_tickets TO authenticated;
GRANT ALL ON public.support_tickets TO service_role;

ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Requesters can view their own tickets"
  ON public.support_tickets FOR SELECT TO authenticated
  USING (requester_id = auth.uid() OR public.has_any_role(auth.uid(), ARRAY['admin','support','staff']::public.app_role[]));

CREATE POLICY "Users can create their own tickets"
  ON public.support_tickets FOR INSERT TO authenticated
  WITH CHECK (requester_id = auth.uid());

CREATE POLICY "Staff can update all tickets"
  ON public.support_tickets FOR UPDATE TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin','support','staff']::public.app_role[]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin','support','staff']::public.app_role[]));

CREATE INDEX support_tickets_status_idx ON public.support_tickets(status, last_activity_at DESC);
CREATE INDEX support_tickets_requester_idx ON public.support_tickets(requester_id, last_activity_at DESC);
CREATE INDEX support_tickets_assignee_idx ON public.support_tickets(assignee_id, last_activity_at DESC);

CREATE TRIGGER support_tickets_touch
  BEFORE UPDATE ON public.support_tickets
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- support_messages
CREATE TABLE public.support_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body text NOT NULL,
  internal boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.support_messages TO authenticated;
GRANT ALL ON public.support_messages TO service_role;

ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Ticket participants read messages"
  ON public.support_messages FOR SELECT TO authenticated
  USING (
    public.has_any_role(auth.uid(), ARRAY['admin','support','staff']::public.app_role[])
    OR (
      internal = false
      AND EXISTS (
        SELECT 1 FROM public.support_tickets t
        WHERE t.id = support_messages.ticket_id AND t.requester_id = auth.uid()
      )
    )
  );

CREATE POLICY "Participants post messages"
  ON public.support_messages FOR INSERT TO authenticated
  WITH CHECK (
    author_id = auth.uid() AND (
      public.has_any_role(auth.uid(), ARRAY['admin','support','staff']::public.app_role[])
      OR (
        internal = false
        AND EXISTS (
          SELECT 1 FROM public.support_tickets t
          WHERE t.id = ticket_id AND t.requester_id = auth.uid()
        )
      )
    )
  );

CREATE INDEX support_messages_ticket_idx ON public.support_messages(ticket_id, created_at);

-- staff_impersonation_sessions
CREATE TABLE public.staff_impersonation_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason text NOT NULL,
  token_hash text NOT NULL,
  expires_at timestamptz NOT NULL,
  ended_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.staff_impersonation_sessions TO authenticated;
GRANT ALL ON public.staff_impersonation_sessions TO service_role;

ALTER TABLE public.staff_impersonation_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins view all impersonation sessions"
  ON public.staff_impersonation_sessions FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR staff_id = auth.uid());

CREATE POLICY "Staff create their own impersonation sessions"
  ON public.staff_impersonation_sessions FOR INSERT TO authenticated
  WITH CHECK (
    staff_id = auth.uid()
    AND public.has_any_role(auth.uid(), ARRAY['admin','support','staff','success']::public.app_role[])
  );

CREATE POLICY "Staff end their own impersonation sessions"
  ON public.staff_impersonation_sessions FOR UPDATE TO authenticated
  USING (staff_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (staff_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE INDEX staff_impersonation_staff_idx ON public.staff_impersonation_sessions(staff_id, created_at DESC);
CREATE INDEX staff_impersonation_target_idx ON public.staff_impersonation_sessions(target_user_id, created_at DESC);
