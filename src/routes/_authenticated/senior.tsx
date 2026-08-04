import { createFileRoute, Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  Bell,
  Heart,
  LogOut,
  Home,
  Users,
  MessageCircle,
  LifeBuoy,
  User,
  Calendar,
  ClipboardList,
  Wallet,
  MoreHorizontal,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { SeniorPreferencesProvider } from "@/hooks/use-senior-preferences";
import { UnreadMessagesBadge, SupportWidget, IncomingRequestsBadge } from "@/components/carematch";
import {
  Drawer,
  DrawerTrigger,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerClose,
} from "@/components/ui/drawer";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/senior")({
  component: () => (
    <SeniorPreferencesProvider>
      <SeniorLayout />
    </SeniorPreferencesProvider>
  ),
});

function SeniorLayout() {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const signOut = async () => {
    await supabase.auth.signOut();
    toast.success("Signed out");
    navigate({ to: "/", replace: true });
  };

  const tabs: { to: string; label: string; icon: typeof Home; exact?: boolean; external?: boolean }[] = [
    { to: "/senior", label: "Home", icon: Home, exact: true },
    { to: "/senior/visits", label: "Visits", icon: Calendar },
    { to: "/senior/care-plan", label: "Care plan", icon: ClipboardList },
    { to: "/senior/money", label: "Money", icon: Wallet },
    { to: "/senior/people", label: "People", icon: Users },
    { to: "/senior/messages", label: "Messages", icon: MessageCircle },
    { to: "/senior/help", label: "Help", icon: LifeBuoy },
  ];

  // The bottom tab bar is the only nav on this portal, shown at every screen
  // size — seniors need it dead simple, not a 7-wide scrolling row. Pin the 4
  // most time-sensitive destinations; everything else lives behind "More".
  const MOBILE_PRIMARY_PATHS = ["/senior", "/senior/visits", "/senior/care-plan", "/senior/messages"];
  const primaryTabs = MOBILE_PRIMARY_PATHS.map((p) => tabs.find((t) => t.to === p)!);
  const moreTabs = tabs.filter((t) => !MOBILE_PRIMARY_PATHS.includes(t.to));
  const isActive = (to: string, exact?: boolean) => (exact ? pathname === to : pathname.startsWith(to));
  const moreActive = moreTabs.some((t) => isActive(t.to, t.exact));

  return (
    <div className="min-h-dvh bg-background">
      <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-md items-center justify-between px-5 py-4 lg:max-w-xl">
          <Link to="/senior" className="flex items-center gap-2 font-serif text-xl font-bold">
            <span className="grid size-8 place-items-center rounded-full bg-primary text-primary-foreground">
              <Heart className="size-4" />
            </span>
            CompanionCare
          </Link>
          <div className="flex items-center gap-1">
            <Link
              to="/senior/messages"
              aria-label="Notifications"
              className="relative grid size-11 place-items-center rounded-full hover:bg-secondary"
            >
              <Bell className="size-5" />
              <UnreadMessagesBadge variant="dot" className="absolute right-2 top-2" />
            </Link>
            <Link
              to="/senior/profile"
              aria-label="Profile & settings"
              className="grid size-11 place-items-center rounded-full hover:bg-secondary"
            >
              <User className="size-5" />
            </Link>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Sign out"
              className="size-11"
              onClick={signOut}
            >
              <LogOut className="size-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-md px-5 pb-32 pt-4 lg:max-w-xl">
        <Outlet />
      </main>

      <SupportWidget portal="senior" />


      <nav
        aria-label="Senior portal sections"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur"
      >
        <ul className="mx-auto flex max-w-md items-stretch lg:max-w-xl">
          {primaryTabs.map(({ to, label, icon: Icon, exact, external }) => {
            const active = !external && isActive(to, exact);
            const className = `flex min-h-16 flex-1 flex-col items-center justify-center gap-1 px-2 py-2 text-xs font-semibold ${
              active ? "text-primary" : "text-muted-foreground"
            }`;
            return (
              <li key={to} className="flex-1">
                {external ? (
                  <a href={to} className={className} aria-label={label}>
                    <Icon className="size-6" />
                    {label}
                  </a>
                ) : (
                  <Link to={to} className={className}>
                    <span className="relative">
                      <Icon className="size-6" />
                      {to === "/senior/messages" && (
                        <UnreadMessagesBadge className="absolute -right-2 -top-1" />
                      )}
                      {to === "/senior" && exact && (
                        <IncomingRequestsBadge className="absolute -right-2 -top-1" />
                      )}
                    </span>
                    {label}
                  </Link>
                )}
              </li>
            );
          })}
          <li className="flex-1">
            <Drawer>
              <DrawerTrigger asChild>
                <button
                  type="button"
                  className={`flex min-h-16 w-full flex-col items-center justify-center gap-1 px-2 py-2 text-xs font-semibold ${
                    moreActive ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  <MoreHorizontal className="size-6" />
                  More
                </button>
              </DrawerTrigger>
              <DrawerContent>
                <DrawerHeader>
                  <DrawerTitle>More</DrawerTitle>
                </DrawerHeader>
                <div className="grid gap-1 px-4 pb-[calc(env(safe-area-inset-bottom)+1rem)]">
                  {moreTabs.map(({ to, label, icon: Icon, exact, external }) => {
                    const active = !external && isActive(to, exact);
                    const className = `flex items-center gap-3 rounded-lg px-3 py-3 text-base ${
                      active ? "bg-primary/10 font-semibold text-primary" : "text-foreground hover:bg-secondary"
                    }`;
                    return (
                      <DrawerClose key={to} asChild>
                        {external ? (
                          <a href={to} className={className}>
                            <Icon className="size-5" />
                            <span className="flex-1">{label}</span>
                          </a>
                        ) : (
                          <Link to={to} className={className}>
                            <Icon className="size-5" />
                            <span className="flex-1">{label}</span>
                          </Link>
                        )}
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
  );
}

