import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/senior/messages")({
  component: () => <Outlet />,
});
