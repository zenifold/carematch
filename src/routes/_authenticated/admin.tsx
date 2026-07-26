import { createFileRoute, Link, Outlet, redirect, useNavigate, useRouterState } from "@tanstack/react-router";
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
} from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { checkIsAdmin } from "@/lib/admin.functions";
import { RouteErrorBoundary } from "@/components/carematch";

export const Route = createFileRoute("/_authenticated/admin")({
  component: AdminLayout,
  errorComponent: RouteErrorBoundary,
  beforeLoad: async () => {
    // Gate the whole admin subtree — a non-admin who guesses the URL is
    // bounced before any admin data ever loads.
    try {
      const { isAdmin } = await checkIsAdmin();
      if (!isAdmin) throw redirect({ to: "/dashboard" });
    } catch (e) {
      if (e && typeof e === "object" && "to" in e) throw e;
      throw redirect({ to: "/dashboard" });
    }
  },
});

const nav: { to: string; label: string; icon: typeof Inbox; exact?: boolean }[] = [
  { to: "/admin", label: "Queue", icon: Inbox, exact: true },
  { to: "/admin/users", label: "Users", icon: UserCog },
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



function AdminLayout() {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isActive = (to: string, exact?: boolean) => (exact ? pathname === to : pathname.startsWith(to));

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
            CareMatch
          </Link>
          <p className="mt-3 rounded-lg bg-card px-3 py-2 text-xs">
            <span className="font-semibold uppercase tracking-widest text-muted-foreground">Console</span>
            <br />
            <span className="text-sm">Concierge · Agent</span>
          </p>

          <nav className="mt-6 grid gap-1">
            {nav.map((n) => {
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
          <div className="flex flex-1 items-center gap-2 rounded-lg border border-input bg-card px-3 py-2">
            <Search className="size-4 text-muted-foreground" />
            <input
              placeholder="Search seniors, providers, bookings, IDs…"
              className="w-full bg-transparent text-sm outline-none"
            />
            <kbd className="hidden rounded border border-input px-1.5 py-0.5 text-[10px] text-muted-foreground lg:inline">⌘K</kbd>
          </div>
          <button
            aria-label="Alerts"
            className="relative grid size-10 place-items-center rounded-lg hover:bg-secondary"
          >
            <Bell className="size-5" />
            <span className="absolute right-2 top-2 size-2 rounded-full bg-destructive" />
          </button>
          <div className="flex items-center gap-2 rounded-lg border border-input bg-card px-3 py-2 text-sm">
            <UserCog className="size-4 text-muted-foreground" />
            <span className="hidden font-medium sm:inline">Agent · Priya K.</span>
            <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-primary">
              Tier 2
            </span>
          </div>
        </header>

        {/* Mobile bottom tabs */}
        <nav
          aria-label="Admin console"
          className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden"
        >
          <ul className="flex items-stretch justify-around overflow-x-auto">
            {nav.map((n) => {
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
          </ul>
        </nav>

        <main className="mx-auto max-w-7xl px-4 pb-28 pt-5 lg:px-6 lg:pb-10">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
