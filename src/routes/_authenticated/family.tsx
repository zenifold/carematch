import { createFileRoute, Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  Heart,
  LogOut,
  LayoutDashboard,
  Calendar,
  ClipboardList,
  Wallet,
  MessageCircle,
  Settings as SettingsIcon,
  User,
  Users,
  LifeBuoy,
  MoreHorizontal,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { UnreadMessagesBadge, UpcomingVisitsBadge, SupportWidget } from "@/components/carematch";
import {
  Drawer,
  DrawerTrigger,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerClose,
} from "@/components/ui/drawer";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/family")({
  component: FamilyLayout,
});

const nav: { to: string; label: string; icon: typeof LayoutDashboard; exact?: boolean }[] = [
  { to: "/family", label: "Overview", icon: LayoutDashboard, exact: true },
  { to: "/family/visits", label: "Visits", icon: Calendar },
  { to: "/family/care-plan", label: "Care plan", icon: ClipboardList },
  { to: "/family/people", label: "People", icon: Users },
  { to: "/family/budget", label: "Budget", icon: Wallet },
  { to: "/family/messages", label: "Messages", icon: MessageCircle },
  { to: "/family/help", label: "Help", icon: LifeBuoy },
  { to: "/family/settings", label: "Settings", icon: SettingsIcon },
];

// The bottom tab bar only has room for a handful of destinations before it
// needs a scrollbar users won't notice. Pin the 4 most time-sensitive,
// day-to-day actions there; everything else lives behind "More".
const MOBILE_PRIMARY_PATHS = ["/family", "/family/visits", "/family/care-plan", "/family/messages"];

function FamilyLayout() {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const signOut = async () => {
    await supabase.auth.signOut();
    toast.success("Signed out");
    navigate({ to: "/", replace: true });
  };

  const isActive = (to: string, exact?: boolean) =>
    exact ? pathname === to : pathname.startsWith(to);

  const mobilePrimaryNav = MOBILE_PRIMARY_PATHS.map((p) => nav.find((n) => n.to === p)!);
  const mobileMoreNav = nav.filter((n) => !MOBILE_PRIMARY_PATHS.includes(n.to));
  const moreActive = mobileMoreNav.some((n) => isActive(n.to, n.exact));

  return (
    <div className="min-h-dvh bg-background lg:grid lg:grid-cols-[240px_1fr]">
      {/* Desktop sidebar */}
      <aside className="hidden border-r border-border bg-secondary/30 lg:block">
        <div className="sticky top-0 flex h-dvh flex-col p-6">
          <Link to="/family" className="flex items-center gap-2 font-serif text-2xl font-bold">
            <span className="grid size-9 place-items-center rounded-full bg-primary text-primary-foreground">
              <Heart className="size-4" />
            </span>
            CompanionCare
          </Link>
          <p className="mt-4 rounded-xl bg-card px-3 py-2 text-xs">
            <span className="font-semibold uppercase tracking-widest text-muted-foreground">
              Family
            </span>
            <br />
            <span className="text-sm">Martha's care</span>
          </p>

          <nav className="mt-8 grid gap-1">
            {nav.map((n) => {
              const active = isActive(n.to, n.exact);
              return (
                <Link
                  key={n.to}
                  to={n.to}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-base ${
                    active
                      ? "bg-primary/10 font-semibold text-primary"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  }`}
                >
                  <n.icon className="size-5" />
                  <span className="flex-1">{n.label}</span>
                  {n.to === "/family/messages" && <UnreadMessagesBadge />}
                  {n.to === "/family/visits" && <UpcomingVisitsBadge />}
                </Link>
              );
            })}
          </nav>

          <button
            onClick={signOut}
            className="mt-auto flex items-center gap-3 rounded-xl px-3 py-2.5 text-base text-muted-foreground hover:bg-secondary hover:text-foreground"
          >
            <LogOut className="size-5" /> Sign out
          </button>
        </div>
      </aside>

      <div className="min-w-0">
        {/* Mobile top */}
        <header className="flex items-center justify-between border-b border-border bg-background/95 px-5 py-4 backdrop-blur lg:hidden">
          <Link to="/family" className="flex items-center gap-2 font-serif text-xl font-bold">
            <span className="grid size-8 place-items-center rounded-full bg-primary text-primary-foreground">
              <Heart className="size-4" />
            </span>
            CompanionCare
          </Link>
          <div className="flex items-center gap-1">
            <Link
              to="/family/settings"
              aria-label="Settings"
              className="grid size-11 place-items-center rounded-full hover:bg-secondary"
            >
              <User className="size-5" />
            </Link>
            <Button variant="ghost" size="icon" aria-label="Sign out" className="size-11" onClick={signOut}>
              <LogOut className="size-5" />
            </Button>
          </div>
        </header>

        <main className="mx-auto max-w-6xl px-5 pb-28 pt-6 lg:px-10 lg:py-12 lg:pb-12">
          <Outlet />
        </main>

        <SupportWidget portal="family" />


        {/* Mobile bottom tabs */}
        <nav
          aria-label="Family portal sections"
          className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden"
        >
          <ul className="flex items-stretch justify-around">
            {mobilePrimaryNav.map((n) => {
              const active = isActive(n.to, n.exact);
              return (
                <li key={n.to} className="flex-1 min-w-0">
                  <Link
                    to={n.to}
                    className={`flex min-h-16 flex-col items-center justify-center gap-1 py-2 text-[11px] font-semibold ${
                      active ? "text-primary" : "text-muted-foreground"
                    }`}
                  >
                    <span className="relative">
                      <n.icon className="size-5" />
                      {n.to === "/family/messages" && (
                        <UnreadMessagesBadge className="absolute -right-2 -top-1" />
                      )}
                      {n.to === "/family/visits" && (
                        <UpcomingVisitsBadge className="absolute -right-2 -top-1" />
                      )}
                    </span>
                    <span className="truncate">{n.label}</span>
                  </Link>
                </li>
              );
            })}
            <li className="flex-1 min-w-0">
              <Drawer>
                <DrawerTrigger asChild>
                  <button
                    type="button"
                    className={`flex min-h-16 w-full flex-col items-center justify-center gap-1 py-2 text-[11px] font-semibold ${
                      moreActive ? "text-primary" : "text-muted-foreground"
                    }`}
                  >
                    <MoreHorizontal className="size-5" />
                    <span className="truncate">More</span>
                  </button>
                </DrawerTrigger>
                <DrawerContent>
                  <DrawerHeader>
                    <DrawerTitle>More</DrawerTitle>
                  </DrawerHeader>
                  <div className="grid gap-1 px-4 pb-[calc(env(safe-area-inset-bottom)+1rem)]">
                    {mobileMoreNav.map((n) => {
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
          </ul>
        </nav>
      </div>
    </div>
  );
}
