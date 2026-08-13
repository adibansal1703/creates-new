import process from "node:process";

function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function trimTrailingSlash(url: string): string {
  return url.replace(/\/$/, "");
}

export function getServerAppUrl(): string {
  return trimTrailingSlash(requireEnv("APP_URL"));
}

export function getAuthCallbackUrl(): string {
  return `${getServerAppUrl()}/auth/callback`;
}

export function getMetaRedirectUri(): string {
  return `${getServerAppUrl()}/auth/instagram/callback`;
}

export function getApiBaseUrl(): string {
  return trimTrailingSlash(requireEnv("API_BASE_URL"));
}

export function getMetaOAuthBaseUrl(): string {
  return trimTrailingSlash(requireEnv("META_OAUTH_BASE_URL"));
}

export function getMetaGraphVersion(): string {
  return requireEnv("META_GRAPH_VERSION");
}

export function getMetaAppId(): string {
  return requireEnv("META_APP_ID");
}

export function getMetaAppSecret(): string {
  return requireEnv("META_APP_SECRET");
}

export function getOAuthStateSecret(): string {
  return process.env.OAUTH_STATE_SECRET?.trim() || getMetaAppSecret();
}

export function getSupabaseUrl(): string {
  return requireEnv("SUPABASE_URL");
}

export function getSupabaseAnonKey(): string {
  return requireEnv("SUPABASE_ANON_KEY");
}

export function getSupabaseServiceRoleKey(): string {
  return requireEnv("SUPABASE_SERVICE_ROLE_KEY");
}

export function getGeminiApiKey(): string {
  return requireEnv("GEMINI_API_KEY");
}
