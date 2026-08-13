import type { ContentPayload, PostPlatform } from "@/lib/types/database";

export function buildContentPayload(
  platforms: PostPlatform[],
  fields: Record<string, string>,
): ContentPayload {
  const payload: ContentPayload = {};

  for (const platform of platforms) {
    switch (platform) {
      case "instagram":
        payload.instagram = {
          caption: fields[`${platform}_caption`] ?? "",
          hashtags: fields[`${platform}_hashtags`] ?? "",
          location: fields[`${platform}_location`] ?? "",
          tagged_accounts: fields[`${platform}_tagged_accounts`] ?? "",
          media_url: fields[`${platform}_media`] ?? null,
        };
        break;
      case "youtube":
        payload.youtube = {
          title: fields[`${platform}_title`] ?? "",
          description: fields[`${platform}_description`] ?? "",
          tags: fields[`${platform}_tags`] ?? "",
          video_url: fields[`${platform}_media`] ?? null,
        };
        break;
      default:
        payload[platform] = {
          content: fields[`${platform}_content`] ?? "",
          media_url: fields[`${platform}_media`] ?? null,
        };
        break;
    }
  }

  return payload;
}

export function buildInstagramCaption(payload: ContentPayload): string {
  const ig = payload.instagram;
  if (!ig) return "";
  return [ig.caption, ig.hashtags, ig.location, ig.tagged_accounts]
    .filter(Boolean)
    .join("\n\n")
    .trim();
}

export function resolvePublicMediaUrl(mediaUrl: string | null | undefined): string | null {
  if (!mediaUrl?.trim()) return null;
  const value = mediaUrl.trim();
  if (value.startsWith("http://") || value.startsWith("https://")) {
    return value;
  }
  return null;
}

export const PUBLISHING_SESSION_KEY = "creatory_publishing_draft";

export type PublishingSession = {
  platforms: PostPlatform[];
  contentPayload: ContentPayload;
};
