import { getOAuthStateSecret } from "@/lib/meta/config.server";

const STATE_TTL_MS = 10 * 60 * 1000;

type OAuthStatePayload = {
  userId: string;
  nonce: string;
  exp: number;
};

function base64UrlEncode(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64UrlDecode(value: string): Uint8Array {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/");
  const padLength = (4 - (padded.length % 4)) % 4;
  const binary = atob(padded + "=".repeat(padLength));
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

async function hmacSha256(secret: string, message: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, enc.encode(message));
  return base64UrlEncode(new Uint8Array(signature));
}

function randomNonce(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return base64UrlEncode(bytes);
}

export async function signOAuthState(input: { userId: string }): Promise<string> {
  const secret = getOAuthStateSecret();
  if (!secret) {
    throw new Error("OAuth state secret is not configured.");
  }

  const payload: OAuthStatePayload = {
    userId: input.userId,
    nonce: randomNonce(),
    exp: Date.now() + STATE_TTL_MS,
  };

  const encodedPayload = base64UrlEncode(new TextEncoder().encode(JSON.stringify(payload)));
  const signature = await hmacSha256(secret, encodedPayload);
  return `${encodedPayload}.${signature}`;
}

export async function verifyOAuthState(state: string, userId: string): Promise<void> {
  const secret = getOAuthStateSecret();
  if (!secret) {
    throw new Error("OAuth state secret is not configured.");
  }

  const [encodedPayload, signature] = state.split(".");
  if (!encodedPayload || !signature) {
    throw new Error("Invalid OAuth state.");
  }

  const expectedSignature = await hmacSha256(secret, encodedPayload);
  if (signature !== expectedSignature) {
    throw new Error("Invalid OAuth state signature.");
  }

  const payload = JSON.parse(
    new TextDecoder().decode(base64UrlDecode(encodedPayload)),
  ) as OAuthStatePayload;

  if (payload.userId !== userId) {
    throw new Error("OAuth state does not match the current user.");
  }

  if (payload.exp < Date.now()) {
    throw new Error("OAuth state has expired. Please try connecting again.");
  }
}
