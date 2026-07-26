
REVOKE EXECUTE ON FUNCTION public.notify_booking_change() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_new_message() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_verification_change() FROM PUBLIC, anon, authenticated;
