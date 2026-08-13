import { createFileRoute } from "@tanstack/react-router";
import { ConnectedAccountsPage } from "@/components/dashboard/ConnectedAccountsPage";
import { Alert, AlertDescription } from "@/components/ui/alert";

export const Route = createFileRoute("/dashboard/accounts")({
  validateSearch: (search: Record<string, unknown>) => ({
    reason: (search.reason as string) || undefined,
    instagram: (search.instagram as string) || undefined,
  }),
  head: () => ({ meta: [{ title: "Connected Accounts — Creatory AI" }] }),
  component: AccountsRoute,
});

function AccountsRoute() {
  const { reason, instagram } = Route.useSearch();

  return (
    <div className="space-y-4">
      {reason === "connect_required" && (
        <Alert className="border-primary/40 bg-primary/10">
          <AlertDescription>
            Please connect at least one social media account before creating content.
          </AlertDescription>
        </Alert>
      )}
      {instagram === "connected" && (
        <Alert className="border-emerald-500/40 bg-emerald-500/10">
          <AlertDescription>Instagram account connected successfully.</AlertDescription>
        </Alert>
      )}
      <ConnectedAccountsPage />
    </div>
  );
}
