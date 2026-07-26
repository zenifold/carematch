import { createFileRoute, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

// Staff-type roles (user_roles table) take priority over the profiles.role
// column, which only ever holds senior/family/provider — an admin or support
// agent still has one of those as their "home" role from signup, but should
// land in the console, not the consumer portal.
const STAFF_LANDING: Record<string, string> = {
  admin: "/admin",
  support: "/admin/support",
  success: "/admin/success",
  finance: "/admin/finance",
  trust_safety: "/admin/trust-safety",
  staff: "/admin/support",
};
const STAFF_PRIORITY = ["admin", "support", "success", "finance", "trust_safety", "staff"] as const;

// Router: send each signed-in user to the right dashboard based on their role.
// New users (no onboarded_at) go through a short setup flow first.
export const Route = createFileRoute("/_authenticated/dashboard")({
  beforeLoad: async () => {
    const { data: userRes } = await supabase.auth.getUser();
    if (!userRes.user) throw redirect({ to: "/auth" });

    const { data: staffRoles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userRes.user.id)
      .in("role", STAFF_PRIORITY);
    const heldRoles = new Set((staffRoles ?? []).map((r) => r.role));
    const staffRole = STAFF_PRIORITY.find((r) => heldRoles.has(r));
    if (staffRole) throw redirect({ to: STAFF_LANDING[staffRole] });

    const { data: profile } = await supabase
      .from("profiles")
      .select("role, onboarded_at")
      .eq("id", userRes.user.id)
      .maybeSingle();
    const role = profile?.role ?? "senior";
    const onboarded = !!profile?.onboarded_at;

    if (!onboarded) {
      if (role === "family") throw redirect({ to: "/onboarding/family" });
      if (role === "provider") throw redirect({ to: "/onboarding/provider" });
      throw redirect({ to: "/onboarding/senior" });
    }

    if (role === "family") throw redirect({ to: "/family" });
    if (role === "provider") throw redirect({ to: "/provider" });
    throw redirect({ to: "/senior" });
  },
});
