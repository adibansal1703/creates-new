import { createFileRoute, Outlet } from "@tanstack/react-router";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { requireAuthenticatedUser } from "@/lib/auth-route-guards";

export const Route = createFileRoute("/dashboard")({
  ssr: false,
  beforeLoad: async () => {
    await requireAuthenticatedUser();
  },
  component: DashboardLayout,
});

function DashboardLayout() {
  return (
    <DashboardShell>
      <Outlet />
    </DashboardShell>
  );
}
