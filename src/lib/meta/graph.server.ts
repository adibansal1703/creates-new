import { getMetaConfig } from "@/lib/meta/config.server";

const INSTAGRAM_SCOPES = [
  "instagram_basic",
  "instagram_content_publish",
  "pages_show_list",
  "pages_read_engagement",
].join(",");

type TokenResponse = {
  access_token: string;
  token_type?: string;
  expires_in?: number;
};

type InstagramBusinessAccount = {
  id: string;
  username?: string;
};

type FacebookPage = {
  id: string;
  name: string;
  access_token: string;
  instagram_business_account?: InstagramBusinessAccount | null;
};

type InstagramAccountConnection = {
  externalAccountId: string;
  accountName: string;
  pageId: string;
  pageName: string;
  pageAccessToken: string;
  userAccessToken: string;
  tokenExpiresAt: string | null;
};

async function parseGraphResponse<T>(response: Response): Promise<T> {
  const body = (await response.json()) as T & { error?: { message?: string; type?: string } };

  if (!response.ok || body.error) {
    throw new Error(body.error?.message ?? `Meta Graph API request failed (${response.status}).`);
  }

  return body;
}

export function buildInstagramAuthorizeUrl(input: { state: string }): string {
  const config = getMetaConfig();
  const path = `${config.oauthBaseUrl}/${config.graphVersion}/dialog/oauth`;
  const params = new URLSearchParams({
    client_id: config.appId,
    redirect_uri: config.redirectUri,
    state: input.state,
    scope: INSTAGRAM_SCOPES,
    response_type: "code",
  });

  const url = `${path}?${params.toString()}`;

  return url;
}

export async function exchangeCodeForShortLivedToken(code: string): Promise<TokenResponse> {
  const config = getMetaConfig();
  const params = new URLSearchParams({
    client_id: config.appId,
    client_secret: config.appSecret,
    redirect_uri: config.redirectUri,
    code,
  });

  const response = await fetch(
    `${config.apiBaseUrl}/${config.graphVersion}/oauth/access_token?${params.toString()}`,
  );

  return parseGraphResponse<TokenResponse>(response);
}

export async function exchangeForLongLivedUserToken(
  shortLivedToken: string,
): Promise<TokenResponse> {
  const config = getMetaConfig();
  const params = new URLSearchParams({
    grant_type: "fb_exchange_token",
    client_id: config.appId,
    client_secret: config.appSecret,
    fb_exchange_token: shortLivedToken,
  });

  const response = await fetch(
    `${config.apiBaseUrl}/${config.graphVersion}/oauth/access_token?${params.toString()}`,
  );

  return parseGraphResponse<TokenResponse>(response);
}

async function fetchFacebookPages(
  userAccessToken: string,
  endpoint: "me/accounts" | "me/assigned_pages",
): Promise<FacebookPage[]> {
  const config = getMetaConfig();
  const params = new URLSearchParams({
    fields: "id,name,access_token,instagram_business_account{id,username}",
    access_token: userAccessToken,
  });

  const response = await fetch(
    `${config.apiBaseUrl}/${config.graphVersion}/${endpoint}?${params.toString()}`,
  );
  const body = await parseGraphResponse<{ data?: FacebookPage[] }>(response);
  return body.data ?? [];
}

function mapPagesToInstagramConnections(
  pages: FacebookPage[],
  userAccessToken: string,
): InstagramAccountConnection[] {
  const connections: InstagramAccountConnection[] = [];

  for (const page of pages) {
    const instagramAccount = page.instagram_business_account;
    if (!instagramAccount?.id) continue;

    const username = instagramAccount.username ?? instagramAccount.id;
    connections.push({
      externalAccountId: instagramAccount.id,
      accountName: username.startsWith("@") ? username : `@${username}`,
      pageId: page.id,
      pageName: page.name,
      pageAccessToken: page.access_token,
      userAccessToken,
      tokenExpiresAt: null,
    });
  }

  return connections;
}

function buildInstagramDiscoveryError(pages: FacebookPage[]): string {
  if (pages.length === 0) {
    return [
      "No Facebook Pages were returned for your account.",
      "During login, grant access to all Pages when Facebook asks.",
      "If your Page is in Meta Business Manager, ensure your Facebook account is an Admin of that Page.",
      "The Facebook account you use must be an Admin of the Page linked to Instagram.",
    ].join(" ");
  }

  const pageNames = pages.map((page) => page.name).join(", ");
  return [
    `Found ${pages.length} Facebook Page(s) (${pageNames}), but none have a linked Instagram Business or Creator account.`,
    "In Instagram: Settings → Account type → switch to Professional (Business or Creator).",
    "Then link it to your Facebook Page: Instagram → Settings → Linked accounts → Facebook.",
    "Or in Meta Business Suite: connect the Instagram profile to the Page, then try again.",
  ].join(" ");
}

export async function fetchInstagramBusinessAccounts(
  userAccessToken: string,
): Promise<InstagramAccountConnection[]> {
  const ownedPages = await fetchFacebookPages(userAccessToken, "me/accounts");
  let connections = mapPagesToInstagramConnections(ownedPages, userAccessToken);

  if (connections.length > 0) {
    return connections;
  }

  const assignedPages = await fetchFacebookPages(userAccessToken, "me/assigned_pages");
  connections = mapPagesToInstagramConnections(assignedPages, userAccessToken);

  if (connections.length > 0) {
    return connections;
  }

  const allPages = [...ownedPages, ...assignedPages];
  throw new Error(buildInstagramDiscoveryError(allPages));
}

export function tokenExpiresAtFromResponse(token: TokenResponse): string | null {
  if (!token.expires_in) return null;
  return new Date(Date.now() + token.expires_in * 1000).toISOString();
}

export async function validateInstagramAccessToken(input: {
  externalAccountId: string;
  accessToken: string;
}): Promise<{ valid: boolean; username?: string; error?: string }> {
  const config = getMetaConfig();
  const params = new URLSearchParams({
    fields: "id,username",
    access_token: input.accessToken,
  });

  try {
    const response = await fetch(
      `${config.apiBaseUrl}/${config.graphVersion}/${input.externalAccountId}?${params.toString()}`,
    );
    const body = await parseGraphResponse<{ id: string; username?: string }>(response);
    return { valid: true, username: body.username };
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : "Instagram token validation failed.",
    };
  }
}

export async function completeInstagramOAuthFlow(
  code: string,
): Promise<InstagramAccountConnection> {
  const shortLived = await exchangeCodeForShortLivedToken(code);
  const longLived = await exchangeForLongLivedUserToken(shortLived.access_token);
  const tokenExpiresAt = tokenExpiresAtFromResponse(longLived);
  const connections = await fetchInstagramBusinessAccounts(longLived.access_token);

  const primary = connections[0];
  return {
    ...primary,
    userAccessToken: longLived.access_token,
    tokenExpiresAt,
  };
}
