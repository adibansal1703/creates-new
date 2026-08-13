import { getMetaConfig } from "@/lib/meta/config.server";
import { buildInstagramCaption, resolvePublicMediaUrl } from "@/lib/publishing/content-summary";
import type { ContentPayload } from "@/lib/types/database";

type GraphErrorBody = {
  error?: { message?: string };
  id?: string;
  status_code?: string;
};

async function parseGraphResponse<T>(response: Response): Promise<T> {
  const body = (await response.json()) as T & GraphErrorBody;

  if (!response.ok || body.error) {
    throw new Error(body.error?.message ?? `Meta Graph API request failed (${response.status}).`);
  }

  return body;
}

async function waitForInstagramMediaContainer(input: {
  containerId: string;
  accessToken: string;
}): Promise<void> {
  const config = getMetaConfig();

  for (let attempt = 0; attempt < 15; attempt += 1) {
    const params = new URLSearchParams({
      fields: "status_code",
      access_token: input.accessToken,
    });

    const response = await fetch(
      `${config.apiBaseUrl}/${config.graphVersion}/${input.containerId}?${params.toString()}`,
    );
    const body = await parseGraphResponse<{ status_code?: string }>(response);

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

export async function publishInstagramPost(input: {
  externalAccountId: string;
  accessToken: string;
  contentPayload: ContentPayload;
}): Promise<string> {
  const imageUrl = resolvePublicMediaUrl(input.contentPayload.instagram?.media_url);
  if (!imageUrl) {
    throw new Error(
      "Instagram posts require a publicly accessible image URL. Upload an image first.",
    );
  }

  const caption = buildInstagramCaption(input.contentPayload);
  const config = getMetaConfig();

  const createParams = new URLSearchParams({
    image_url: imageUrl,
    caption,
    access_token: input.accessToken,
  });

  const createResponse = await fetch(
    `${config.apiBaseUrl}/${config.graphVersion}/${input.externalAccountId}/media?${createParams.toString()}`,
    { method: "POST" },
  );
  const created = await parseGraphResponse<{ id: string }>(createResponse);

  await waitForInstagramMediaContainer({
    containerId: created.id,
    accessToken: input.accessToken,
  });

  const publishParams = new URLSearchParams({
    creation_id: created.id,
    access_token: input.accessToken,
  });

  const publishResponse = await fetch(
    `${config.apiBaseUrl}/${config.graphVersion}/${input.externalAccountId}/media_publish?${publishParams.toString()}`,
    { method: "POST" },
  );
  const published = await parseGraphResponse<{ id: string }>(publishResponse);

  if (!published.id) {
    throw new Error("Instagram did not return a published media ID.");
  }

  return published.id;
}
