function trimTrailingSlash(url: string): string {
  return url.replace(/\/$/, "");
}

function readClientEnv(name: string): string | undefined {
  const value = import.meta.env[name];
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

export function getAppUrl(): string {
  const value = readClientEnv("APP_URL");
  if (!value) {
    throw new Error("Missing required environment variable: APP_URL");
  }
  return trimTrailingSlash(value);
}

export function getAuthCallbackUrl(): string {
  return `${getAppUrl()}/auth/callback`;
}

export function getSupabaseUrl(): string {
  const value = readClientEnv("SUPABASE_URL");
  if (!value) {
    throw new Error("Missing required environment variable: SUPABASE_URL");
  }
  return value;
}

export function getSupabaseAnonKey(): string {
  const value = readClientEnv("SUPABASE_ANON_KEY");
  if (!value) {
    throw new Error("Missing required environment variable: SUPABASE_ANON_KEY");
  }
  return value;
}

export function isClientEnvConfigured(): boolean {
  return Boolean(
    readClientEnv("APP_URL") && readClientEnv("SUPABASE_URL") && readClientEnv("SUPABASE_ANON_KEY"),
  );
}
