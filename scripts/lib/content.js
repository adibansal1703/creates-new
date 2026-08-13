export function buildInstagramCaption(contentPayload) {
  const ig = contentPayload?.instagram;
  if (!ig) return "";
  return [ig.caption, ig.hashtags, ig.location, ig.tagged_accounts]
    .filter(Boolean)
    .join("\n\n")
    .trim();
}

export function resolvePublicMediaUrl(mediaUrl) {
  if (!mediaUrl?.trim()) return null;
  const value = mediaUrl.trim();
  if (value.startsWith("http://") || value.startsWith("https://")) {
    return value;
  }
  return null;
}
