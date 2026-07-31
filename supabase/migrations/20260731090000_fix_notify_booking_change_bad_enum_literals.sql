-- CRITICAL FIX: notify_booking_change() compared NEW.status (booking_status
-- enum: 'requested'|'confirmed'|'in_progress'|'completed'|'cancelled') against
-- the literals 'accepted' and 'declined', neither of which is a valid member
-- of that enum. Casting an invalid literal to an enum type fails immediately
-- at that comparison, not just when it would've matched — so this has been
-- throwing "invalid input value for enum booking_status" on every real
-- UPDATE that changes bookings.status (acceptBooking, declineBooking,
-- cancelBooking, checkInVisit, checkOutVisit all update status), unnoticed
-- because every seed/demo booking was created via direct INSERT with its
-- final status already set — the buggy branch only runs on TG_OP = 'UPDATE'.
-- Discovered while testing the charge-on-approval change, confirmed against
-- the real project (an UPDATE to status='confirmed' failed with exactly
-- this error).
CREATE OR REPLACE FUNCTION public.notify_booking_change()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE senior_name text; provider_name text;
BEGIN
  SELECT full_name INTO senior_name FROM public.profiles WHERE id = NEW.senior_id;
  SELECT full_name INTO provider_name FROM public.profiles WHERE id = NEW.provider_id;
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.notifications (user_id, kind, title, body, link)
    VALUES (NEW.provider_id, 'booking_request', 'New booking request',
      COALESCE(senior_name,'A senior') || ' requested a ' || NEW.service_type || ' visit', '/provider/jobs');
    RETURN NEW;
  END IF;
  IF TG_OP = 'UPDATE' AND NEW.status IS DISTINCT FROM OLD.status THEN
    IF NEW.status = 'confirmed' THEN
      INSERT INTO public.notifications (user_id, kind, title, body, link)
      VALUES (NEW.senior_id, 'booking_accepted', 'Booking accepted',
        COALESCE(provider_name,'Your caregiver') || ' accepted your visit', '/senior/visits');
    ELSIF NEW.status = 'cancelled' THEN
      INSERT INTO public.notifications (user_id, kind, title, body, link)
      VALUES (NEW.senior_id, 'booking_declined', 'Booking ' || NEW.status,
        'Your visit request was ' || NEW.status, '/senior/visits');
    END IF;
  END IF;
  RETURN NEW;
END; $$;
