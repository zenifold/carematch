-- Second pass of verification cleanup. The first (20260812140000) removed the probe
-- messages but missed two things.
--
-- 1. Ticket priority. The verification script sets `priority = high` to exercise
--    agent_update_ticket and restores it at the end; two interrupted runs left two
--    tickets stuck on `high`. Values below are the ones scripts/seed-demo.mjs
--    creates, keyed on subject rather than id so this is stable across re-seeds.
--
-- 2. Two `agent.%` audit rows survived the previous DELETE despite matching both
--    predicates on inspection. Rather than re-run the same statement and hope, this
--    drops the actor_id subquery: `agent.%` actions are only ever written by the
--    four agent_* RPCs, and those refuse any caller without a staff role, so the
--    action prefix alone is a sufficient and simpler predicate.

UPDATE public.support_tickets
   SET priority = 'normal'
 WHERE subject = 'Can I be billed instead of my mother?'
   AND priority <> 'normal';

UPDATE public.support_tickets
   SET priority = 'low'
 WHERE subject = 'Turning off text-message reminders'
   AND priority <> 'low';

DELETE FROM public.admin_audit_log
 WHERE action LIKE 'agent.%';
