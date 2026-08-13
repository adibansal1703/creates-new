import type { User } from "@supabase/supabase-js";
import { getSupabase } from "@/lib/supabase";

/** Create/update profile — never blocks signup if table is missing. */
export async function ensureUserProfile(user: User): Promise<boolean> {
  const supabase = getSupabase();
  const { error } = await supabase.from("profiles").upsert(
    {
      id: user.id,
      email: user.email ?? null,
      full_name: (user.user_metadata?.full_name as string | undefined) ?? null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "id" },
  );

  if (error) {
    console.warn("Profile upsert skipped:", error.message);
    return false;
  }

  return true;
}

function isPkceVerifierError(message: string): boolean {
  const lower = message.toLowerCase();
  return lower.includes("code verifier") || lower.includes("pkce");
}

export type AuthCallbackResult = {
  session: Awaited<
    ReturnType<ReturnType<typeof getSupabase>["auth"]["getSession"]>
  >["data"]["session"];
  verified: boolean;
  /** Email likely confirmed but session could not be restored (e.g. link opened in another browser). */
  emailConfirmedNoSession?: boolean;
};

/** Handle Supabase email verification / magic-link redirects (PKCE + hash). */
export async function completeAuthFromUrl(): Promise<AuthCallbackResult> {
  const supabase = getSupabase();
  const searchParams = new URLSearchParams(window.location.search);
  const code = searchParams.get("code");
  const authError = searchParams.get("error_description") ?? searchParams.get("error");

  if (authError) {
    throw new Error(authError);
  }

  // Session may already exist if detectSessionInUrl ran
  const {
    data: { session: initialSession },
  } = await supabase.auth.getSession();

  if (initialSession?.user && isEmailVerified(initialSession.user)) {
    await ensureUserProfile(initialSession.user);
    return { session: initialSession, verified: true };
  }

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      if (isPkceVerifierError(error.message)) {
        return {
          session: null,
          verified: false,
          emailConfirmedNoSession: true,
        };
      }
      throw new Error(error.message);
    }
  } else if (window.location.hash.includes("access_token")) {
    await new Promise((resolve) => setTimeout(resolve, 300));
  }

  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError) {
    throw new Error(sessionError.message);
  }

  if (session?.user) {
    await ensureUserProfile(session.user);
    return { session, verified: isEmailVerified(session.user) };
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError && !isPkceVerifierError(userError.message)) {
    throw new Error(userError.message);
  }

  if (user) {
    await ensureUserProfile(user);
    const {
      data: { session: refreshed },
    } = await supabase.auth.getSession();
    return { session: refreshed, verified: isEmailVerified(user) };
  }

  return { session: null, verified: false };
}

export function isEmailVerified(user: User | null | undefined): boolean {
  return Boolean(user?.email_confirmed_at);
}
