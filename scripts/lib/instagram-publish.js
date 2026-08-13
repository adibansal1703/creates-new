import { buildInstagramCaption, resolvePublicMediaUrl } from "./content.js";
import { getMetaConfig } from "./meta-config.js";

async function parseGraphResponse(response) {
  const body = await response.json();
  if (!response.ok || body.error) {
    throw new Error(body.error?.message ?? `Meta Graph API request failed (${response.status}).`);
  }
  return body;
}

async function waitForInstagramMediaContainer({ containerId, accessToken, config }) {
  for (let attempt = 0; attempt < 15; attempt += 1) {
    const params = new URLSearchParams({
      fields: "status_code",
      access_token: accessToken,
    });

    const response = await fetch(
      `${config.apiBaseUrl}/${config.graphVersion}/${containerId}?${params.toString()}`,
    );
    const body = await parseGraphResponse(response);

    if (body.status_code === "FINISHED") {
      return;
    }

    if (body.status_code === "ERROR") {
      throw new Error("Instagram could not process the uploaded media.");
    }

    await new Promise((resolve) => setTimeout(resolve, 2000));
  }

  throw new Error("Instagram media processing timed out. Try again in a moment.");
}

export async function publishInstagramPost({ externalAccountId, accessToken, contentPayload }) {
  console.log("[publishInstagramPost] contentPayload:", JSON.stringify(contentPayload, null, 2));

  if (!contentPayload?.instagram) {
    throw new Error("Instagram content payload is missing from the post data.");
  }

  const mediaUrl = contentPayload.instagram.media_url;
  console.log("[publishInstagramPost] Raw media_url from payload:", mediaUrl);

  const imageUrl = resolvePublicMediaUrl(mediaUrl);
  console.log("[publishInstagramPost] Resolved imageUrl:", imageUrl);

  if (!imageUrl) {
    if (!mediaUrl) {
      throw new Error(
        "No image URL found in the post data. Please upload an image before scheduling or publishing.",
      );
    }
    throw new Error(
      `Invalid image URL format: "${mediaUrl}". Image URL must start with http:// or https://`,
    );
  }

  const caption = buildInstagramCaption(contentPayload);
  const config = getMetaConfig();

  const createParams = new URLSearchParams({
    image_url: imageUrl,
    caption,
    access_token: accessToken,
  });

  const createResponse = await fetch(
    `${config.apiBaseUrl}/${config.graphVersion}/${externalAccountId}/media?${createParams.toString()}`,
    { method: "POST" },
  );
  const created = await parseGraphResponse(createResponse);

  await waitForInstagramMediaContainer({
    containerId: created.id,
    accessToken,
    config,
  });

  const publishParams = new URLSearchParams({
    creation_id: created.id,
    access_token: accessToken,
  });

  const publishResponse = await fetch(
    `${config.apiBaseUrl}/${config.graphVersion}/${externalAccountId}/media_publish?${publishParams.toString()}`,
    { method: "POST" },
  );
  const published = await parseGraphResponse(publishResponse);

  if (!published.id) {
    throw new Error("Instagram did not return a published media ID.");
  }

  return published.id;
}

export async function publishScheduledPost(post) {
  if (post.platform === "instagram") {
    if (!post.external_account_id || !post.access_token) {
      throw new Error("Instagram account is not connected for this scheduled post.");
    }

    return publishInstagramPost({
      externalAccountId: post.external_account_id,
      accessToken: post.access_token,
      contentPayload: post.content_payload ?? {},
    });
  }

  throw new Error(
    `${post.platform} publishing is not implemented yet. Instagram is supported today.`,
  );
}
