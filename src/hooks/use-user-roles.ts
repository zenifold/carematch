import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type AppRole = "senior" | "family" | "provider" | "admin";

export const ROLE_HOME: Record<AppRole, string> = {
  senior: "/senior",
  family: "/family",
  provider: "/provider",
  admin: "/dashboard", // admin console lives here for now
};

export const ROLE_LABEL: Record<AppRole, string> = {
  senior: "I need care",
  family: "Family member",
  provider: "Caregiver",
  admin: "CompanionCare staff",
};

async function fetchRoles(userId: string | null): Promise<AppRole[]> {
  if (!userId) return [];
  const { data, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId);
  if (error) throw error;
  return (data ?? []).map((r) => r.role as AppRole);
}

/**
 * useUserRoles — returns the current user's role assignments.
 * The primary role is the first one; multiple roles enable the role switcher.
 */
export function useUserRoles(userId: string | null | undefined) {
  return useQuery({
    queryKey: ["user_roles", userId ?? null],
    queryFn: () => fetchRoles(userId ?? null),
    enabled: !!userId,
    staleTime: 60_000,
  });
}
