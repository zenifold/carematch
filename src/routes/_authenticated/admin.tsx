import {
  createFileRoute,
  Link,
  Outlet,
  redirect,
  useNavigate,
  useRouterState,
} from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  Heart,
  LogOut,
  Inbox,
  Users,
  Briefcase,
  Calendar,
  ShieldAlert,
  BarChart3,
  Search,
  Bell,
  UserCog,
  ScrollText,
  CheckSquare,
  DollarSign,
  Settings,
  BadgeCheck,
  ClipboardList,
  MoreHorizontal,
} from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { getMyStaffRoles } from "@/lib/admin.functions";
import { RouteErrorBoundary } from "@/components/carematch";
import {
  Drawer,
  DrawerTrigger,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerClose,
} from "@/components/ui/drawer";

export const Route = createFileRoute("/_authenticated/admin")({
  component: AdminLayout,
  errorComponent: RouteErrorBoundary,
  beforeLoad: async () => {
    // Gate the whole admin subtree — a signed-in user with none of the
    // staff-type roles is bounced before any admin data ever loads.
    // Individual pages/server functions further restrict to their own
    // narrower role set (e.g. Finance requires admin/finance/staff).
    try {
      const { roles } = await getMyStaffRoles();
      if (roles.length === 0) throw redirect({ to: "/dashboard" });
    } catch (e) {
      if (e && typeof e === "object" && "to" in e) throw e;
      throw redirect({ to: "/dashboard" });
    }
  },
});

type NavItem = { to: string; label: string; icon: typeof Inbox; exact?: boolean };

// Which roles (beyond plain "admin", which always sees everything) may open
// each nav item — mirrors the role sets each page's server functions enforce.
const NAV_ROLES: Record<string, readonly string[]> = {
  "/admin": [],
  "/admin/users": [],
  "/admin/waitlist": ["success", "support", "staff"],
  "/admin/support": ["support", "staff"],
  "/admin/success": ["success", "support", "staff"],
  "/admin/finance": ["finance", "staff"],
  "/admin/seniors": [],
  "/admin/providers": [],
  "/admin/bookings": [],
  "/admin/trust-safety": ["trust_safety", "staff"],
  "/admin/credentials": ["trust_safety", "staff"],
  "/admin/analytics": [],
  "/admin/audit": [],
  "/admin/settings": [],
};

const nav: NavItem[] = [
  { to: "/admin", label: "Queue", icon: Inbox, exact: true },
  { to: "/admin/users", label: "Users", icon: UserCog },
  { to: "/admin/waitlist", label: "Waitlist", icon: ClipboardList },
  { to: "/admin/support", label: "Support", icon: Inbox },
  { to: "/admin/success", label: "Success", icon: CheckSquare },
  { to: "/admin/finance", label: "Finance", icon: DollarSign },
  { to: "/admin/seniors", label: "Seniors", icon: Users },
  { to: "/admin/providers", label: "Providers", icon: Briefcase },
  { to: "/admin/bookings", label: "Bookings", icon: Calendar },
  { to: "/admin/trust-safety", label: "Trust & Safety", icon: ShieldAlert },
  { to: "/admin/credentials", label: "Credentials", icon: BadgeCheck },
  { to: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/admin/audit", label: "Audit log", icon: ScrollText },
  { to: "/admin/settings", label: "Settings", icon: Settings },
];

const ROLE_LABELS: Record<string, string> = {
  admin: "Admin",
  staff: "Staff",
  support: "Support",
  success: "Success",
  finance: "Finance",
  trust_safety: "Trust & Safety",
};

function AdminLayout() {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isActive = (to: string, exact?: boolean) =>
    exact ? pathname === to : pathname.startsWith(to);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchStaffRoles = useServerFn(getMyStaffRoles);
  const rolesQ = useQuery({
    queryKey: ["admin", "my-staff-roles"],
    queryFn: () => fetchStaffRoles(),
  });
  const heldRoles = new Set(rolesQ.data?.roles ?? []);
  const isAdmin = heldRoles.has("admin");

  const profileQ = useQuery({
    queryKey: ["profile", "me"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return null;
      const { data } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", u.user.id)
        .maybeSingle();
      return data;
    },
  });

  const visibleNav = nav.filter((n) => {
    if (isAdmin) return true;
    const allowed = NAV_ROLES[n.to] ?? [];
    return allowed.some((r) => heldRoles.has(r));
  });
  // Which items appear varies by staff role (as few as 1, as many as all 13
  // for a full admin) — pin the first 4 of whatever's actually visible to the
  // bottom bar and tuck any overflow behind "More" rather than hardcoding
  // paths that might not exist for a given role.
  const primaryNav = visibleNav.slice(0, 4);
  const moreNav = visibleNav.slice(4);
  const moreActive = moreNav.some((n) => isActive(n.to, n.exact));
  const primaryRoleLabel =
    ROLE_LABELS[
      ["admin", "staff", "support", "success", "finance", "trust_safety"].find((r) =>
        heldRoles.has(r),
      ) ?? ""
    ] ?? "Staff";
  const displayName = profileQ.data?.full_name ?? "…";

  const signOut = async () => {
    await supabase.auth.signOut();
    toast.success("Signed out");
    navigate({ to: "/", replace: true });
  };

  return (
    <div className="min-h-dvh bg-background lg:grid lg:grid-cols-[220px_1fr]">
      <aside className="hidden border-r border-border bg-secondary/40 lg:block">
        <div className="sticky top-0 flex h-dvh flex-col p-5">
          <Link to="/admin" className="flex items-center gap-2 font-serif text-xl font-bold">
            <span className="grid size-8 place-items-center rounded-full bg-primary text-primary-foreground">
              <Heart className="size-4" />
            </span>
            CompanionCare
          </Link>
          <p className="mt-3 rounded-lg bg-card px-3 py-2 text-xs">
            <span className="font-semibold uppercase tracking-widest text-muted-foreground">
              Console
            </span>
            <br />
            <span className="text-sm">
              {displayName} · {primaryRoleLabel}
            </span>
          </p>

          <nav className="mt-6 grid gap-1">
            {visibleNav.map((n) => {
              const active = isActive(n.to, n.exact);
              return (
                <Link
                  key={n.to}
                  to={n.to}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm ${
                    active
                      ? "bg-primary/10 font-semibold text-primary"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  }`}
                >
                  <n.icon className="size-4" />
                  {n.label}
                </Link>
              );
            })}
          </nav>

          <button
            onClick={signOut}
            className="mt-auto flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground"
          >
            <LogOut className="size-4" /> Sign out
          </button>
        </div>
      </aside>

      <div className="min-w-0">
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-border bg-background/95 px-4 py-3 backdrop-blur lg:px-6">
          {isAdmin ? (
            <>
              <form
                className="flex flex-1 items-center gap-2 rounded-lg border border-input bg-card px-3 py-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  const value = searchTerm.trim();
                  if (value) navigate({ to: "/admin/users", search: { q: value } });
                }}
              >
                <Search className="size-4 text-muted-foreground" />
                <input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search users by name, email, or city…"
                  className="w-full bg-transparent text-sm outline-none"
                />
              </form>
              <Link
                to="/admin/audit"
                aria-label="Recent activity"
                className="grid size-10 place-items-center rounded-lg hover:bg-secondary"
              >
                <Bell className="size-5" />
              </Link>
            </>
          ) : (
            <div className="flex-1" />
          )}
          <div className="flex items-center gap-2 rounded-lg border border-input bg-card px-3 py-2 text-sm">
            <UserCog className="size-4 text-muted-foreground" />
            <span className="hidden font-medium sm:inline">{displayName}</span>
            <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-primary">
              {primaryRoleLabel}
            </span>
          </div>
        </header>

        {/* Mobile bottom tabs */}
        <nav
          aria-label="Admin console"
          className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden"
        >
          <ul className="flex items-stretch justify-around">
            {primaryNav.map((n) => {
              const active = isActive(n.to, n.exact);
              return (
                <li key={n.to} className="flex-1 min-w-0">
                  <Link
                    to={n.to}
                    className={`flex min-h-14 flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-semibold ${
                      active ? "text-primary" : "text-muted-foreground"
                    }`}
                  >
                    <n.icon className="size-4" />
                    <span className="truncate">{n.label}</span>
                  </Link>
                </li>
              );
            })}
            {moreNav.length > 0 && (
              <li className="flex-1 min-w-0">
                <Drawer>
                  <DrawerTrigger asChild>
                    <button
                      type="button"
                      className={`flex min-h-14 w-full flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-semibold ${
                        moreActive ? "text-primary" : "text-muted-foreground"
                      }`}
                    >
                      <MoreHorizontal className="size-4" />
                      <span className="truncate">More</span>
                    </button>
                  </DrawerTrigger>
                  <DrawerContent>
                    <DrawerHeader>
                      <DrawerTitle>More</DrawerTitle>
                    </DrawerHeader>
                    <div className="grid gap-1 px-4 pb-[calc(env(safe-area-inset-bottom)+1rem)]">
                      {moreNav.map((n) => {
                        const active = isActive(n.to, n.exact);
                        return (
                          <DrawerClose key={n.to} asChild>
                            <Link
                              to={n.to}
                              className={`flex items-center gap-3 rounded-lg px-3 py-3 text-base ${
                                active
                                  ? "bg-primary/10 font-semibold text-primary"
                                  : "text-foreground hover:bg-secondary"
                              }`}
                            >
                              <n.icon className="size-5" />
                              <span className="flex-1">{n.label}</span>
                            </Link>
                          </DrawerClose>
                        );
                      })}
                    </div>
                  </DrawerContent>
                </Drawer>
              </li>
            )}
          </ul>
        </nav>

        <main className="mx-auto max-w-7xl px-4 pb-28 pt-5 lg:px-6 lg:pb-10">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
