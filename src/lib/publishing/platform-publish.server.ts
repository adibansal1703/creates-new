import { publishInstagramPost } from "@/lib/meta/publish.server";
import type { ContentPayload, PostPlatform } from "@/lib/types/database";

export type PlatformPublishInput = {
  platform: PostPlatform;
  contentPayload: ContentPayload;
  accessToken: string | null;
  externalAccountId: string | null;
};

export async function publishToPlatform(input: PlatformPublishInput): Promise<string> {
  if (input.platform === "instagram") {
    if (!input.externalAccountId || !input.accessToken) {
      throw new Error("Connect your Instagram account before publishing.");
    }

    return publishInstagramPost({
      externalAccountId: input.externalAccountId,
      accessToken: input.accessToken,
      contentPayload: input.contentPayload,
    });
  }

  throw new Error(
    `${input.platform} publishing is not implemented yet. Instagram is supported today.`,
  );
}
