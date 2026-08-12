-- Removes rows left behind by interrupted runs of scripts/verify-agent-rpcs.py.
--
-- That script creates `[rpc check]` messages to exercise agent_post_reply and
-- deletes them at the end. Three runs were interrupted mid-way (the REST path from
-- the operator's machine started timing out), so their cleanup never ran and six
-- probe messages plus their audit rows stayed behind.
--
-- Normally this would just be a re-run of the script, or of `npm run seed:demo`,
-- which rebuilds demo data from scratch. Both need the REST API, which was
-- unreachable; migrations go over a direct Postgres connection, which was not.
--
-- Scoped as narrowly as the residue: the literal probe marker, and audit rows for
-- the agent's own `agent.%` actions. Idempotent, and a no-op on any database that
-- never ran the verification.

DELETE FROM public.support_messages
 WHERE body LIKE '[rpc check]%';

-- Audit rows for the probe actions. Constrained to the integration account so a
-- real agent action logged by a different actor is never touched.
DELETE FROM public.admin_audit_log
 WHERE action LIKE 'agent.%'
   AND actor_id IN (
     SELECT id FROM auth.users
      WHERE email = 'buzz-agent@integrations.getcompanioncare.com'
   );

-- The probes also bumped last_activity_at on the tickets they touched, which
-- reorders the staff inbox. Recompute it from what is actually on each ticket now,
-- rather than guessing at the previous value: the latest message, else creation.
-- Only tickets whose newest remaining message is older than their last_activity_at
-- are affected, which is exactly the ones a deleted probe left skewed.
UPDATE public.support_tickets t
   SET last_activity_at = GREATEST(
         t.created_at,
         COALESCE((SELECT max(m.created_at) FROM public.support_messages m
                    WHERE m.ticket_id = t.id), t.created_at)
       )
 WHERE t.last_activity_at > GREATEST(
         t.created_at,
         COALESCE((SELECT max(m.created_at) FROM public.support_messages m
                    WHERE m.ticket_id = t.id), t.created_at)
       );
