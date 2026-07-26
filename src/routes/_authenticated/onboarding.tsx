import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { Heart } from "lucide-react";
import { RouteErrorBoundary } from "@/components/carematch";

export const Route = createFileRoute("/_authenticated/onboarding")({
  component: OnboardingLayout,
  errorComponent: RouteErrorBoundary,
});

function OnboardingLayout() {
  return (
    <div className="min-h-dvh bg-background">
      <header className="mx-auto flex max-w-3xl items-center justify-between px-6 py-6">
        <Link to="/" className="flex items-center gap-2 font-serif text-2xl font-bold">
          <span className="grid size-9 place-items-center rounded-full bg-primary text-primary-foreground">
            <Heart className="size-4" />
          </span>
          CareMatch
        </Link>
        <span className="text-xs uppercase tracking-widest text-muted-foreground">
          Getting set up
        </span>
      </header>
      <main className="mx-auto max-w-2xl px-6 pb-24">
        <Outlet />
      </main>
    </div>
  );
}
