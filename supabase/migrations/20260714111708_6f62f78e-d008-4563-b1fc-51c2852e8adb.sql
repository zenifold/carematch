
-- =========================================================
-- Enums
-- =========================================================
CREATE TYPE public.ledger_entry_type AS ENUM
  ('charge', 'platform_fee', 'provider_payout', 'refund', 'adjustment');

CREATE TYPE public.ledger_status AS ENUM
  ('pending', 'posted', 'reversed');

CREATE TYPE public.notification_kind AS ENUM
  ('booking_request', 'booking_accepted', 'booking_declined',
   'visit_check_in', 'visit_check_out', 'message',
   'invite_redeemed', 'verification_update', 'payout_posted', 'system');

-- =========================================================
-- payment_ledger
-- =========================================================
CREATE TABLE public.payment_ledger (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id      uuid NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  visit_id        uuid REFERENCES public.visits(id) ON DELETE SET NULL,
  senior_id       uuid NOT NULL,
  provider_id     uuid NOT NULL,
  entry_type      public.ledger_entry_type NOT NULL,
  amount_cents    integer NOT NULL,
  currency        text NOT NULL DEFAULT 'USD',
  status          public.ledger_status NOT NULL DEFAULT 'pending',
  memo            text,
  posted_at       timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.payment_ledger TO authenticated;
GRANT ALL ON public.payment_ledger TO service_role;

ALTER TABLE public.payment_ledger ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ledger senior reads own charges"
  ON public.payment_ledger
  FOR SELECT TO authenticated
  USING (
    senior_id = auth.uid()
    AND entry_type IN ('charge', 'refund', 'adjustment')
  );

CREATE POLICY "ledger provider reads own payouts"
  ON public.payment_ledger
  FOR SELECT TO authenticated
  USING (
    provider_id = auth.uid()
    AND entry_type IN ('provider_payout', 'adjustment')
  );

CREATE POLICY "ledger admin reads all"
  ON public.payment_ledger
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE TRIGGER payment_ledger_touch_updated_at
  BEFORE UPDATE ON public.payment_ledger
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE INDEX payment_ledger_booking_idx   ON public.payment_ledger(booking_id);
CREATE INDEX payment_ledger_senior_idx    ON public.payment_ledger(senior_id, entry_type, posted_at DESC);
CREATE INDEX payment_ledger_provider_idx  ON public.payment_ledger(provider_id, entry_type, posted_at DESC);

-- =========================================================
-- notifications
-- =========================================================
CREATE TABLE public.notifications (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL,
  kind        public.notification_kind NOT NULL,
  title       text NOT NULL,
  body        text,
  link        text,
  read_at     timestamptz,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, UPDATE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notifications owner reads"
  ON public.notifications
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "notifications owner marks read"
  ON public.notifications
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE TRIGGER notifications_touch_updated_at
  BEFORE UPDATE ON public.notifications
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE INDEX notifications_user_unread_idx
  ON public.notifications(user_id, read_at, created_at DESC);

-- =========================================================
-- provider_availability (weekly recurring schedule)
-- =========================================================
CREATE TABLE public.provider_availability (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id  uuid NOT NULL REFERENCES public.providers(id) ON DELETE CASCADE,
  weekday      smallint NOT NULL CHECK (weekday BETWEEN 0 AND 6),
  start_time   time NOT NULL,
  end_time     time NOT NULL,
  active       boolean NOT NULL DEFAULT true,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),
  CHECK (end_time > start_time)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.provider_availability TO authenticated;
GRANT ALL ON public.provider_availability TO service_role;

ALTER TABLE public.provider_availability ENABLE ROW LEVEL SECURITY;

CREATE POLICY "availability readable by authenticated"
  ON public.provider_availability
  FOR SELECT TO authenticated
  USING (active OR provider_id = auth.uid());

CREATE POLICY "availability provider manages own"
  ON public.provider_availability
  FOR ALL TO authenticated
  USING (provider_id = auth.uid())
  WITH CHECK (provider_id = auth.uid());

CREATE TRIGGER provider_availability_touch_updated_at
  BEFORE UPDATE ON public.provider_availability
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE INDEX provider_availability_provider_idx
  ON public.provider_availability(provider_id, weekday);

-- =========================================================
-- provider_time_off (date-range blackouts)
-- =========================================================
CREATE TABLE public.provider_time_off (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id  uuid NOT NULL REFERENCES public.providers(id) ON DELETE CASCADE,
  starts_on    date NOT NULL,
  ends_on      date NOT NULL,
  reason       text,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),
  CHECK (ends_on >= starts_on)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.provider_time_off TO authenticated;
GRANT ALL ON public.provider_time_off TO service_role;

ALTER TABLE public.provider_time_off ENABLE ROW LEVEL SECURITY;

CREATE POLICY "time_off readable by authenticated"
  ON public.provider_time_off
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "time_off provider manages own"
  ON public.provider_time_off
  FOR ALL TO authenticated
  USING (provider_id = auth.uid())
  WITH CHECK (provider_id = auth.uid());

CREATE TRIGGER provider_time_off_touch_updated_at
  BEFORE UPDATE ON public.provider_time_off
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE INDEX provider_time_off_provider_idx
  ON public.provider_time_off(provider_id, starts_on, ends_on);

-- =========================================================
-- Helpful indexes on existing tables
-- =========================================================
CREATE INDEX IF NOT EXISTS bookings_senior_idx    ON public.bookings(senior_id, scheduled_at DESC);
CREATE INDEX IF NOT EXISTS bookings_provider_idx  ON public.bookings(provider_id, scheduled_at DESC);
CREATE INDEX IF NOT EXISTS bookings_scheduled_idx ON public.bookings(scheduled_at);
CREATE INDEX IF NOT EXISTS visits_booking_idx     ON public.visits(booking_id);
CREATE INDEX IF NOT EXISTS visit_extras_booking_idx ON public.visit_extras(booking_id);
CREATE INDEX IF NOT EXISTS messages_conversation_idx ON public.messages(conversation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS conversations_participants_idx ON public.conversations(participant_a, participant_b);
CREATE INDEX IF NOT EXISTS family_invites_code_idx ON public.family_invites(code);
CREATE INDEX IF NOT EXISTS family_links_family_idx ON public.family_links(family_id, approved);
CREATE INDEX IF NOT EXISTS verifications_provider_idx ON public.verifications(provider_id, status);
