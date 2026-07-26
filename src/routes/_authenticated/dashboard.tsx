import { createFileRoute, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

// Router: send each signed-in user to the right dashboard based on their role.
// New users (no onboarded_at) go through a short setup flow first.
export const Route = createFileRoute("/_authenticated/dashboard")({
  beforeLoad: async () => {
    const { data: userRes } = await supabase.auth.getUser();
    if (!userRes.user) throw redirect({ to: "/auth" });
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
