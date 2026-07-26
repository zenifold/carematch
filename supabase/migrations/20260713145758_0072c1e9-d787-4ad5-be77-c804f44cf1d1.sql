
-- Trigger function should run as invoker (the message sender), not as owner.
-- RLS on conversations already restricts UPDATE to participants, which is exactly
-- what we want when a participant inserts a message.
CREATE OR REPLACE FUNCTION public.bump_conversation_preview()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
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

REVOKE EXECUTE ON FUNCTION public.bump_conversation_preview() FROM PUBLIC, anon, authenticated;
