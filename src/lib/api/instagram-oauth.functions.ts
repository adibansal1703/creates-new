import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import {
  buildInstagramAuthorizeUrl,
  completeInstagramOAuthFlow,
  validateInstagramAccessToken,
} from "@/lib/meta/graph.server";
import { signOAuthState, verifyOAuthState } from "@/lib/meta/oauth-state.server";
import { getSupabaseAdmin } from "@/lib/supabase/admin.server";
import { requireServerUser } from "@/lib/supabase/server-auth.server";

const accessTokenSchema = z.object({
  accessToken: z.string().min(1),
});

export const getInstagramOAuthUrl = createServerFn({ method: "POST" })
  .inputValidator(accessTokenSchema)
  .handler(async ({ data }) => {
    const user = await requireServerUser(data.accessToken);
    const state = await signOAuthState({ userId: user.id });
    const url = buildInstagramAuthorizeUrl({ state });
    return { url };
  });

export const completeInstagramOAuth = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      accessToken: z.string().min(1),
      code: z.string().min(1),
      state: z.string().min(1),
    }),
  )
  .handler(async ({ data }) => {
    const user = await requireServerUser(data.accessToken);
    await verifyOAuthState(data.state, user.id);

    const connection = await completeInstagramOAuthFlow(data.code);

    const admin = getSupabaseAdmin();

    const { data: saved, error } = await admin
      .from("connected_accounts")
      .upsert(
        {
          user_id: user.id,
          platform: "instagram",
          external_account_id: connection.externalAccountId,
          account_name: connection.accountName,
          access_token: connection.pageAccessToken,
          refresh_token: connection.userAccessToken,
          token_expires_at: connection.tokenExpiresAt,
          is_connected: true,
          connected_at: new Date().toISOString(),
        },
        { onConflict: "user_id,platform,external_account_id" },
      )
      .select("id, account_name, external_account_id, token_expires_at, is_connected, connected_at")
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return saved;
  });

export type InstagramConnectionStatus = {
  accountId: string;
  valid: boolean;
  expired: boolean;
  username?: string;
  error?: string;
};

export const validateInstagramConnections = createServerFn({ method: "POST" })
  .inputValidator(accessTokenSchema)
  .handler(async ({ data }) => {
    const user = await requireServerUser(data.accessToken);
    const admin = getSupabaseAdmin();

    const { data: accounts, error } = await admin
      .from("connected_accounts")
      .select("id, external_account_id, access_token, token_expires_at, is_connected")
      .eq("user_id", user.id)
      .eq("platform", "instagram")
      .eq("is_connected", true);

    if (error) {
      throw new Error(error.message);
    }

    const statuses: InstagramConnectionStatus[] = [];

    for (const account of accounts ?? []) {
      const expired =
        account.token_expires_at != null &&
        new Date(account.token_expires_at).getTime() <= Date.now();

      if (!account.external_account_id || !account.access_token) {
        statuses.push({
          accountId: account.id,
          valid: false,
          expired,
          error: "Missing Instagram credentials.",
        });
        await admin.from("connected_accounts").update({ is_connected: false }).eq("id", account.id);
        continue;
      }

      if (expired) {
        statuses.push({
          accountId: account.id,
          valid: false,
          expired: true,
          error: "Instagram access token has expired. Reconnect your account.",
        });
        await admin.from("connected_accounts").update({ is_connected: false }).eq("id", account.id);
        continue;
      }

      const validation = await validateInstagramAccessToken({
        externalAccountId: account.external_account_id,
        accessToken: account.access_token,
      });

      if (!validation.valid) {
        statuses.push({
          accountId: account.id,
          valid: false,
          expired,
          error: validation.error,
        });
        await admin.from("connected_accounts").update({ is_connected: false }).eq("id", account.id);
        continue;
      }

      statuses.push({
        accountId: account.id,
        valid: true,
        expired: false,
        username: validation.username,
      });
    }

    return statuses;
  });
