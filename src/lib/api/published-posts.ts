import { publishPostsNow } from "@/lib/api/publish-posts.functions";
import { buildInstagramCaption } from "@/lib/publishing/content-summary";
import { supabase } from "@/lib/supabase";
import type { ContentPayload, PostPlatform } from "@/lib/types/database";

async function requireAccessToken(): Promise<string> {
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();
  if (error || !session?.access_token) throw new Error("You must be logged in.");
  return session.access_token;
}

export function summarizeContent(platform: PostPlatform, payload: ContentPayload): string {
  const p = payload[platform];
  if (!p) return "";
  if (platform === "youtube") {
    return [p.title, p.description, p.tags].filter(Boolean).join("\n\n");
  }
  if (platform === "instagram") {
    return buildInstagramCaption(payload);
  }
  return (p.content as string) || (p.caption as string) || "";
}

export async function publishNow(input: {
  platform: PostPlatform;
  contentPayload: ContentPayload;
}): Promise<void> {
  const accessToken = await requireAccessToken();
  await publishPostsNow({
    data: {
      accessToken,
      platforms: [input.platform],
      contentPayload: input.contentPayload,
    },
  });
}

export async function publishMultiple(
  platforms: PostPlatform[],
  payload: ContentPayload,
): Promise<void> {
  const accessToken = await requireAccessToken();
  await publishPostsNow({
    data: {
      accessToken,
      platforms,
      contentPayload: payload,
    },
  });
}
