import { createFileRoute } from "@tanstack/react-router";
import { SettingsPage } from "@/components/dashboard/SettingsPage";

export const Route = createFileRoute("/dashboard/settings")({
  head: () => ({ meta: [{ title: "Settings — Creatory AI" }] }),
  component: SettingsPage,
});
