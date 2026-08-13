import { createFileRoute } from "@tanstack/react-router";
import { DashboardHome } from "@/components/dashboard/DashboardHome";

export const Route = createFileRoute("/dashboard/")({
  head: () => ({ meta: [{ title: "Dashboard — Creatory AI" }] }),
  component: DashboardHome,
});
