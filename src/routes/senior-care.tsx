import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/senior-care")({
  component: () => <Outlet />,
});
