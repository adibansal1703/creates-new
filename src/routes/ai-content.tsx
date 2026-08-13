import { createFileRoute } from "@tanstack/react-router";
import { AIContentIdeasPage } from "@/components/dashboard/AIContentIdeasPage";

export const Route = createFileRoute("/ai-content")({
  head: () => ({ meta: [{ title: "AI Content Ideas — Creatory AI" }] }),
  component: AIContentIdeasPage,
});
