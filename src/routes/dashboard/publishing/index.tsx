import { createFileRoute } from "@tanstack/react-router";
import { PublishingWizard } from "@/components/dashboard/publishing/PublishingWizard";

export const Route = createFileRoute("/dashboard/publishing/")({
  head: () => ({ meta: [{ title: "Multi-Platform Publishing — Creatory AI" }] }),
  component: PublishingWizard,
});
