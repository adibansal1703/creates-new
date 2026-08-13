import {
  getApiBaseUrl,
  getMetaAppId,
  getMetaAppSecret,
  getMetaGraphVersion,
  getMetaOAuthBaseUrl,
  getMetaRedirectUri,
  getOAuthStateSecret,
} from "@/lib/env.server";

export type MetaConfig = {
  appId: string;
  appSecret: string;
  redirectUri: string;
  graphVersion: string;
  apiBaseUrl: string;
  oauthBaseUrl: string;
};

export function getMetaConfig(): MetaConfig {
  return {
    appId: getMetaAppId(),
    appSecret: getMetaAppSecret(),
    redirectUri: getMetaRedirectUri(),
    graphVersion: getMetaGraphVersion(),
    apiBaseUrl: getApiBaseUrl(),
    oauthBaseUrl: getMetaOAuthBaseUrl(),
  };
}

export { getOAuthStateSecret };
