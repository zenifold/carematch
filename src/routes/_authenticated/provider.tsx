import { createFileRoute, Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  Heart,
  LogOut,
  Home,
  Briefcase,
  CalendarDays,
  DollarSign,
  MessageSquare,
  UserCircle2,
  Bell,
  TrendingUp,
  Users,
  LifeBuoy,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { UnreadMessagesBadge, PendingJobsBadge, SupportWidget } from "@/components/carematch";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/provider")({
  component: ProviderLayout,
});

const nav: { to: string; label: string; icon: typeof Home; exact?: boolean }[] = [
  { to: "/provider", label: "Today", icon: Home, exact: true },
  { to: "/provider/jobs", label: "Jobs", icon: Briefcase },
  { to: "/provider/schedule", label: "Schedule", icon: CalendarDays },
  { to: "/provider/clients", label: "Clients", icon: Users },
  { to: "/provider/earnings", label: "Earnings", icon: DollarSign },
  { to: "/provider/grow", label: "Grow", icon: TrendingUp },
  { to: "/provider/messages", label: "Messages", icon: MessageSquare },
  { to: "/provider/profile", label: "Profile", icon: UserCircle2 },
  { to: "/provider/help", label: "Help", icon: LifeBuoy },
];


function ProviderLayout() {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isActive = (to: string, exact?: boolean) => (exact ? pathname === to : pathname.startsWith(to));

  const signOut = async () => {
    await supabase.auth.signOut();
    toast.success("Signed out");
    navigate({ to: "/", replace: true });
  };

  return (
    <div className="min-h-dvh bg-background lg:grid lg:grid-cols-[240px_1fr]">
      <aside className="hidden border-r border-border bg-secondary/40 lg:block">
        <div className="sticky top-0 flex h-dvh flex-col p-5">
          <Link to="/provider" className="flex items-center gap-2 font-serif text-xl font-bold">
            <span className="grid size-8 place-items-center rounded-full bg-primary text-primary-foreground">
              <Heart className="size-4" />
            </span>
            CareMatch
          </Link>
          <p className="mt-3 rounded-lg bg-card px-3 py-2 text-xs">
            <span className="font-semibold uppercase tracking-widest text-muted-foreground">Portal</span>
            <br />
            <span className="text-sm">Provider</span>
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
                  <span className="flex-1">{n.label}</span>
                  {n.to === "/provider/messages" && <UnreadMessagesBadge />}
                  {n.to === "/provider/jobs" && <PendingJobsBadge />}
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
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-border bg-background/95 px-4 py-3 backdrop-blur lg:px-6">
          <div className="flex-1">
            <p className="text-xs uppercase tracking-widest text-muted-foreground">Provider portal</p>
            <p className="text-sm font-semibold">Elena Martinez · Silver tier</p>
          </div>
          <Link
            to="/provider/messages"
            aria-label="Notifications"
            className="relative grid size-10 place-items-center rounded-lg hover:bg-secondary"
          >
            <Bell className="size-5" />
            <UnreadMessagesBadge variant="dot" className="absolute right-2 top-2" />
          </Link>
          <button
            onClick={signOut}
            aria-label="Sign out"
            className="grid size-10 place-items-center rounded-lg hover:bg-secondary lg:hidden"
          >
            <LogOut className="size-5" />
          </button>
        </header>

        <nav
          aria-label="Provider portal"
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
                    <span className="relative">
                      <n.icon className="size-4" />
                      {n.to === "/provider/messages" && (
                        <UnreadMessagesBadge className="absolute -right-2 -top-1" />
                      )}
                      {n.to === "/provider/jobs" && (
                        <PendingJobsBadge className="absolute -right-2 -top-1" />
                      )}
                    </span>
                    <span className="truncate">{n.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <main className="mx-auto max-w-6xl px-4 pb-28 pt-5 lg:px-6 lg:pb-10">
          <Outlet />
        </main>
        <SupportWidget portal="provider" />

      </div>
    </div>
  );
}
