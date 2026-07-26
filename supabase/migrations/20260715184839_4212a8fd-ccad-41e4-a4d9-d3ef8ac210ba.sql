-- Add care_notes column
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS care_notes text;

-- Revoke public/anon/authenticated execute on trigger-only functions
REVOKE ALL ON FUNCTION public.notify_change_request_created() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.notify_change_request_resolved() FROM PUBLIC, anon, authenticated;

-- Ensure apply_change_request is not callable by anon (only authenticated)
REVOKE ALL ON FUNCTION public.apply_change_request(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.apply_change_request(uuid) TO authenticated;