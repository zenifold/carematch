-- Same blind spot as provider_credentials_guard_verif_fields (fixed above):
-- provider_documents_guard_review() only exempted has_any_role(auth.uid(),
-- staff_roles), which is always false for service-role calls (auth.uid()
-- is null with no JWT). No live app code currently updates status/
-- reviewed_at/reviewed_by/rejected_reason via supabaseAdmin, so this hasn't
-- broken a shipped feature yet — but it's the identical landmine, and the
-- first person to wire up a "staff reviews an individual uploaded document"
-- action via the server-role client would hit it. Fixing proactively while
-- the pattern is already identified.
CREATE OR REPLACE FUNCTION public.provider_documents_guard_review()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF auth.role() = 'service_role' THEN
    RETURN NEW;
  END IF;
  IF public.has_any_role(auth.uid(), ARRAY['admin','staff','support','success']::public.app_role[]) THEN
    RETURN NEW;
  END IF;
  -- Non-staff: can only move status from 'uploaded' -> 'superseded', and cannot set review fields.
  IF NEW.status IS DISTINCT FROM OLD.status
     AND NOT (OLD.status = 'uploaded' AND NEW.status = 'superseded') THEN
    RAISE EXCEPTION 'Only staff may accept or reject documents';
  END IF;
  IF NEW.reviewed_at IS DISTINCT FROM OLD.reviewed_at
     OR NEW.reviewed_by IS DISTINCT FROM OLD.reviewed_by
     OR NEW.rejected_reason IS DISTINCT FROM OLD.rejected_reason THEN
    RAISE EXCEPTION 'Not authorized to change review fields';
  END IF;
  RETURN NEW;
END; $$;
