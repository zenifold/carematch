-- Same systemic gap as bookings/profiles: these tables only had
-- "owner reads own row" SELECT policies, no staff carve-out. The
-- application layer already gates the staff-facing functions correctly
-- (isStaff/isTrustSafetyStaff checks), but those functions query through
-- the RLS-scoped client, not the service-role client — so RLS silently
-- zeroed out every result for staff. In practice this meant the entire
-- support-ticket inbox and trust & safety incident queue showed nothing
-- for any staff member, and the Seniors count on the Queue dashboard
-- (counted via user_roles) was always zero.

-- has_any_role/has_role query user_roles internally. Neither is currently
-- SECURITY DEFINER, so using them inside a policy ON user_roles itself
-- would recurse (evaluating the policy re-triggers the same policy check
-- on the inner query) and Postgres would reject it with "infinite
-- recursion detected in policy for relation \"user_roles\"". Making them
-- SECURITY DEFINER is the standard fix — they only ever return a boolean
-- role check, so running with definer privileges doesn't expose anything.
ALTER FUNCTION public.has_role(uuid, public.app_role) SECURITY DEFINER;
ALTER FUNCTION public.has_any_role(uuid, public.app_role[]) SECURITY DEFINER;

CREATE POLICY "support_tickets readable by staff"
  ON public.support_tickets FOR SELECT TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin','support','staff']::public.app_role[]));

CREATE POLICY "support_messages readable by staff"
  ON public.support_messages FOR SELECT TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin','support','staff']::public.app_role[]));

CREATE POLICY "incidents readable by staff"
  ON public.incidents FOR SELECT TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin','trust_safety','staff']::public.app_role[]));

CREATE POLICY "user_roles readable by staff"
  ON public.user_roles FOR SELECT TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin','staff','support','finance','success','trust_safety']::public.app_role[]));
