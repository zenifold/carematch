-- Lets the staff roles that already manage credentials also read them.
--
-- The permissions were inconsistent in a way that only shows up from outside the
-- admin console. Since 20260717165638, `admin`/`staff`/`support`/`success` can
-- UPDATE verifications — but SELECT has been *owner or admin* since 20260714110541.
-- So four roles could write rows they could not read. The admin pages did not notice
-- because they read through the service-role client, which bypasses RLS entirely.
--
-- It surfaced when the credential-expiry sweep (tasks/check-credential-expiry.ts)
-- needed a consumer. The integration account holds `support` + `trust_safety` and
-- got zero rows from `verifications`, so a warning about a lapsed background check
-- had no route to anyone working outside the console.
--
-- Read is aligned with the existing UPDATE set, plus `trust_safety` — whose whole
-- remit is whether a provider is safe to send into someone's home, which is exactly
-- what these rows record. This is strictly narrower than what those roles can
-- already do: three of them could edit these rows before this migration.
--
-- Added as a separate permissive policy rather than by rewriting the existing one.
-- Policies are OR'd, so this widens SELECT without touching the owner-reads-own-rows
-- guarantee that providers depend on.

CREATE POLICY "verifications readable by staff"
  ON public.verifications
  FOR SELECT
  TO authenticated
  USING (
    public.has_any_role(
      auth.uid(),
      ARRAY['admin', 'staff', 'support', 'success', 'trust_safety']::public.app_role[]
    )
  );
