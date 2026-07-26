-- admin-credentials.functions.ts already checks has_any_role(...,'trust_safety',...),
-- but the enum never gained this value, so that RPC call throws for every caller today.
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'trust_safety';
