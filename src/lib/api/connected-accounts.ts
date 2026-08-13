import { supabase } from "@/lib/supabase";
import {
  getInstagramOAuthUrl,
  validateInstagramConnections,
  type InstagramConnectionStatus,
} from "@/lib/api/instagram-oauth.functions";
import type { ConnectedAccount, PostPlatform } from "@/lib/types/database";

async function requireUserId(): Promise<string> {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) throw new Error("You must be logged in.");
  return user.id;
}

async function requireAccessToken(): Promise<string> {
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();
  if (error || !session?.access_token) throw new Error("You must be logged in.");
  return session.access_token;
}

export async function fetchConnectedAccounts(): Promise<ConnectedAccount[]> {
  const userId = await requireUserId();
  const { data, error } = await supabase
    .from("connected_accounts")
    .select(
      "id, user_id, platform, account_name, external_account_id, token_expires_at, is_connected, connected_at, created_at",
    )
    .eq("user_id", userId)
    .eq("is_connected", true)
    .order("platform", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []) as ConnectedAccount[];
}

export async function connectAccount(input: {
  platform: PostPlatform;
  accountName: string;
  externalAccountId?: string;
}): Promise<ConnectedAccount> {
  if (input.platform === "instagram") {
    throw new Error("Connect Instagram using the OAuth button.");
  }

  const userId = await requireUserId();

  const { data, error } = await supabase
    .from("connected_accounts")
    .insert([
      {
        user_id: userId,
        platform: input.platform,
        account_name: input.accountName,
        external_account_id: input.externalAccountId ?? null,
        is_connected: true,
        connected_at: new Date().toISOString(),
      },
    ])
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as ConnectedAccount;
}

export async function disconnectAccount(accountId: string): Promise<void> {
  await requireUserId();
  const { error } = await supabase
    .from("connected_accounts")
    .update({ is_connected: false })
    .eq("id", accountId);

  if (error) throw new Error(error.message);
}

export async function hasConnectedAccount(): Promise<boolean> {
  const accounts = await fetchConnectedAccounts();
  return accounts.some((a) => a.is_connected);
}

export async function startInstagramOAuth(): Promise<void> {
  const accessToken = await requireAccessToken();
  const { url } = await getInstagramOAuthUrl({ data: { accessToken } });

  window.location.assign(url);
}

export async function validateInstagramConnectionStatuses(): Promise<InstagramConnectionStatus[]> {
  const accessToken = await requireAccessToken();
  return validateInstagramConnections({ data: { accessToken } });
}

export function isInstagramTokenExpired(account: ConnectedAccount): boolean {
  if (account.platform !== "instagram" || !account.token_expires_at) return false;
  return new Date(account.token_expires_at).getTime() <= Date.now();
}

export function getConnectionStatusLabel(account: ConnectedAccount): string {
  if (!account.is_connected) return "Disconnected";
  if (account.platform === "instagram" && isInstagramTokenExpired(account)) {
    return "Token expired";
  }
  return "Connected";
}
