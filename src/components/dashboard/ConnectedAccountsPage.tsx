import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, Plus, Unlink } from "lucide-react";
import { PlatformBadge } from "@/components/dashboard/PlatformBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  connectAccount,
  disconnectAccount,
  fetchConnectedAccounts,
  getConnectionStatusLabel,
  isInstagramTokenExpired,
  startInstagramOAuth,
  validateInstagramConnectionStatuses,
} from "@/lib/api/connected-accounts";
import { PLATFORMS, PLATFORM_LABELS, type PostPlatform } from "@/lib/types/database";

export function ConnectedAccountsPage() {
  const queryClient = useQueryClient();
  const [connecting, setConnecting] = useState<PostPlatform | null>(null);
  const [accountName, setAccountName] = useState("");
  const [startingInstagramOAuth, setStartingInstagramOAuth] = useState(false);

  const {
    data: accounts,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["connected-accounts"],
    queryFn: fetchConnectedAccounts,
  });

  const validationQuery = useQuery({
    queryKey: ["instagram-connection-validation"],
    queryFn: validateInstagramConnectionStatuses,
    enabled: Boolean(accounts?.some((account) => account.platform === "instagram")),
    staleTime: 60_000,
  });

  useEffect(() => {
    if (!validationQuery.data) return;

    const invalid = validationQuery.data.filter((status) => !status.valid);
    if (invalid.length > 0) {
      queryClient.invalidateQueries({ queryKey: ["connected-accounts"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
    }
  }, [validationQuery.data, queryClient]);

  const connectMutation = useMutation({
    mutationFn: connectAccount,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["connected-accounts"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      toast.success("Account connected");
      setConnecting(null);
      setAccountName("");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const disconnectMutation = useMutation({
    mutationFn: disconnectAccount,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["connected-accounts"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      queryClient.invalidateQueries({ queryKey: ["instagram-connection-validation"] });
      toast.success("Account disconnected");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const groupedPlatforms = useMemo(
    () =>
      PLATFORMS.map((platform) => ({
        platform,
        accounts: accounts?.filter((account) => account.platform === platform) ?? [],
      })),
    [accounts],
  );

  const totalConnected = accounts?.filter((account) => account.is_connected).length ?? 0;

  const handleConnectClick = async (platform: PostPlatform) => {
    if (platform === "instagram") {
      setStartingInstagramOAuth(true);
      try {
        await startInstagramOAuth();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Unable to start Instagram OAuth.");
        setStartingInstagramOAuth(false);
      }
      return;
    }

    setConnecting(platform);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Connected Accounts</h1>
        <p className="mt-1 text-muted-foreground">
          Link one or more social profiles and manage connected accounts across platforms.
        </p>
      </div>

      {isError && (
        <div className="rounded-lg p-4 text-sm text-destructive border border-destructive/30 bg-card shadow-subtle">
          Failed to load accounts.{" "}
          <button className="underline" onClick={() => refetch()}>
            Retry
          </button>
        </div>
      )}

      {!isLoading && totalConnected === 0 && (
        <div className="rounded-lg p-6 border border-border bg-card shadow-subtle text-sm text-muted-foreground">
          <p className="font-medium">No connected accounts yet.</p>
          <p className="mt-2">
            Use the plus button on any platform card below to add your first account.
          </p>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {groupedPlatforms.map(({ platform, accounts }) => (
          <Card key={platform} className="shadow-subtle">
            <CardHeader className="flex items-start justify-between gap-3 pb-3">
              <div>
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {PLATFORM_LABELS[platform]}
                </CardTitle>
                <p className="mt-1 text-xs text-muted-foreground">
                  {accounts.length} linked account{accounts.length === 1 ? "" : "s"}
                </p>
              </div>
              <Button
                size="sm"
                disabled={platform === "instagram" && startingInstagramOAuth}
                onClick={() => handleConnectClick(platform)}
              >
                {platform === "instagram" && startingInstagramOAuth ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Plus className="size-4" />
                )}
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {isLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-full" />
                </div>
              ) : accounts.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  {platform === "instagram"
                    ? "Connect your Instagram Business account through Meta OAuth to publish and schedule."
                    : `Connect your ${PLATFORM_LABELS[platform]} account to publish and schedule.`}
                </p>
              ) : (
                <div className="space-y-3">
                  {accounts.map((account) => {
                    const validation = validationQuery.data?.find(
                      (status) => status.accountId === account.id,
                    );

                    return (
                      <div
                        key={account.id}
                        className="rounded-sm border border-border bg-secondary/50 p-4"
                      >
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div className="space-y-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <PlatformBadge platform={platform} />
                              <p className="font-medium truncate">{account.account_name}</p>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              Status: {getConnectionStatusLabel(account)}
                            </p>
                            {platform === "instagram" &&
                              validation &&
                              !validation.valid &&
                              validation.error && (
                                <p className="text-xs text-destructive">{validation.error}</p>
                              )}
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            className="shrink-0"
                            disabled={disconnectMutation.isPending}
                            onClick={() => disconnectMutation.mutate(account.id)}
                          >
                            <Unlink className="size-4" />
                            Disconnect
                          </Button>
                        </div>
                        <div className="mt-3 text-xs text-muted-foreground space-y-1">
                          <p>Account ID: {account.external_account_id ?? "—"}</p>
                          {platform === "instagram" && account.token_expires_at && (
                            <p>
                              Token expires: {new Date(account.token_expires_at).toLocaleString()}
                              {isInstagramTokenExpired(account) ? " (expired)" : ""}
                            </p>
                          )}
                          <p>Connected at: {new Date(account.connected_at).toLocaleString()}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={connecting !== null} onOpenChange={(open) => !open && setConnecting(null)}>
        <DialogContent className="bg-card border-border shadow-medium max-w-lg">
          <DialogHeader>
            <DialogTitle>
              Connect {connecting ? PLATFORM_LABELS[connecting] : "account"}
            </DialogTitle>
            <DialogDescription>
              Add a profile name for this platform. OAuth support for this platform is coming soon.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="accountName">Account name</Label>
              <Input
                id="accountName"
                placeholder="@yourhandle"
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
              />
            </div>
            <Button
              className="w-full"
              disabled={!accountName.trim() || connectMutation.isPending || !connecting}
              onClick={() =>
                connecting &&
                connectMutation.mutate({
                  platform: connecting,
                  accountName: accountName.trim(),
                })
              }
            >
              {connectMutation.isPending ? "Connecting…" : "Save connection"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
