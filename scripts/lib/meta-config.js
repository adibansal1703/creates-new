function requireEnv(name) {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export function getMetaConfig() {
  return {
    appId: requireEnv("META_APP_ID"),
    appSecret: requireEnv("META_APP_SECRET"),
    graphVersion: requireEnv("META_GRAPH_VERSION"),
    apiBaseUrl: requireEnv("API_BASE_URL").replace(/\/$/, ""),
  };
}
