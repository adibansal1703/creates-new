import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { summarizeContent } from "@/lib/api/published-posts";
import { publishToPlatform } from "@/lib/publishing/platform-publish.server";
import { getSupabaseAdmin } from "@/lib/supabase/admin.server";
import { requireServerUser } from "@/lib/supabase/server-auth.server";
import { PLATFORMS, type ContentPayload, type PostPlatform } from "@/lib/types/database";
const accessTokenSchema = z.object({
  accessToken: z.string().min(1),
});

const publishNowSchema = accessTokenSchema.extend({
  platforms: z.array(z.enum(PLATFORMS)).min(1),
  contentPayload: z.record(z.string(), z.unknown()),
});

async function getConnectedAccount(userId: string, platform: PostPlatform) {
  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from("connected_accounts")
    .select("external_account_id, access_token, token_expires_at, is_connected")
    .eq("user_id", userId)
    .eq("platform", platform)
    .eq("is_connected", true)
    .order("connected_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    throw new Error(`Connect your ${platform} account before publishing.`);
  }

  if (data.token_expires_at != null && new Date(data.token_expires_at).getTime() <= Date.now()) {
    throw new Error(`Your ${platform} access token has expired. Reconnect the account.`);
  }

  return data;
}

export const publishPostsNow = createServerFn({ method: "POST" })
  .inputValidator(publishNowSchema)
  .handler(async ({ data }) => {
    const user = await requireServerUser(data.accessToken);
    const admin = getSupabaseAdmin();
    const contentPayload = data.contentPayload as ContentPayload;
    const publishedIds: string[] = [];

    for (const platform of data.platforms) {
      const account = await getConnectedAccount(user.id, platform);
      const content = summarizeContent(platform, contentPayload);

      const externalPostId = await publishToPlatform({
        platform,
        contentPayload,
        accessToken: account.access_token,
        externalAccountId: account.external_account_id,
      });

      const { error } = await admin.from("published_posts").insert({
        user_id: user.id,
        platform,
        content,
        content_payload: contentPayload,
        status: "published",
        published_at: new Date().toISOString(),
        external_post_id: externalPostId,
      });

      if (error) {
        throw new Error(error.message);
      }

      publishedIds.push(externalPostId);

      const { error: notificationError } = await admin.from("notification_queue").insert({
        user_id: user.id,
        type: "post_published",
        payload: {
          platform,
          content_preview: content.slice(0, 120),
          published_at: new Date().toISOString(),
          external_post_id: externalPostId,
        },
      });

      if (notificationError) {
        console.error("[publish] Failed to enqueue notification:", notificationError.message);
      }
    }

    return { publishedCount: data.platforms.length, externalPostIds: publishedIds };
  });
