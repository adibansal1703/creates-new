import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/posts/new")({
  beforeLoad: () => {
    throw redirect({ to: "/dashboard/publishing" });
  },
});
