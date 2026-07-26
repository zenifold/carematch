
-- 1. senior_preferences
CREATE TYPE public.text_size AS ENUM ('normal', 'large', 'xlarge');

CREATE TABLE public.senior_preferences (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  text_size public.text_size NOT NULL DEFAULT 'normal',
  high_contrast BOOLEAN NOT NULL DEFAULT false,
  reduce_motion BOOLEAN NOT NULL DEFAULT false,
  notify_before_visit BOOLEAN NOT NULL DEFAULT true,
  call_for_changes BOOLEAN NOT NULL DEFAULT true,
  family_can_see BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.senior_preferences TO authenticated;
GRANT ALL ON public.senior_preferences TO service_role;
ALTER TABLE public.senior_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read their own preferences"
  ON public.senior_preferences FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);
CREATE POLICY "Users insert their own preferences"
  ON public.senior_preferences FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update their own preferences"
  ON public.senior_preferences FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER senior_preferences_touch_updated_at
  BEFORE UPDATE ON public.senior_preferences
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();


-- 2. conversations (two-participant threads)
CREATE TABLE public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_a UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  participant_b UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  last_message_at TIMESTAMPTZ,
  last_message_preview TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT participants_distinct CHECK (participant_a <> participant_b),
  CONSTRAINT participants_ordered CHECK (participant_a < participant_b),
  UNIQUE (participant_a, participant_b)
);
GRANT SELECT, INSERT, UPDATE ON public.conversations TO authenticated;
GRANT ALL ON public.conversations TO service_role;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants read their conversations"
  ON public.conversations FOR SELECT
  TO authenticated
  USING (auth.uid() IN (participant_a, participant_b));
CREATE POLICY "Participants create their conversations"
  ON public.conversations FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IN (participant_a, participant_b));
CREATE POLICY "Participants update their conversations"
  ON public.conversations FOR UPDATE
  TO authenticated
  USING (auth.uid() IN (participant_a, participant_b))
  WITH CHECK (auth.uid() IN (participant_a, participant_b));

CREATE INDEX conversations_participant_a_idx ON public.conversations (participant_a);
CREATE INDEX conversations_participant_b_idx ON public.conversations (participant_b);

CREATE TRIGGER conversations_touch_updated_at
  BEFORE UPDATE ON public.conversations
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();


-- 3. messages
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.messages TO authenticated;
GRANT ALL ON public.messages TO service_role;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants read messages in their conversations"
  ON public.messages FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.conversations c
    WHERE c.id = messages.conversation_id
      AND auth.uid() IN (c.participant_a, c.participant_b)
  ));
CREATE POLICY "Senders insert messages in their conversations"
  ON public.messages FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = sender_id
    AND EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = conversation_id
        AND auth.uid() IN (c.participant_a, c.participant_b)
    )
  );
CREATE POLICY "Participants mark messages read"
  ON public.messages FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.conversations c
    WHERE c.id = messages.conversation_id
      AND auth.uid() IN (c.participant_a, c.participant_b)
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.conversations c
    WHERE c.id = messages.conversation_id
      AND auth.uid() IN (c.participant_a, c.participant_b)
  ));

CREATE INDEX messages_conversation_idx ON public.messages (conversation_id, created_at DESC);

-- Update conversation preview when a message is inserted
CREATE OR REPLACE FUNCTION public.bump_conversation_preview()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.conversations
  SET last_message_at = NEW.created_at,
      last_message_preview = LEFT(NEW.body, 200),
      updated_at = now()
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER messages_bump_conversation
  AFTER INSERT ON public.messages
  FOR EACH ROW EXECUTE FUNCTION public.bump_conversation_preview();


-- 4. Enable realtime for messages + conversations
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
ALTER TABLE public.messages REPLICA IDENTITY FULL;
ALTER TABLE public.conversations REPLICA IDENTITY FULL;
