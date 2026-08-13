import { redirect } from "@tanstack/react-router";
import { ensureUserProfile, isEmailVerified } from "@/lib/auth-session";
import { supabase } from "@/lib/supabase";

export async function requireAuthenticatedUser() {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw redirect({ to: "/login" });
  }

  if (!isEmailVerified(user)) {
    throw redirect({
      to: "/signup",
      search: { pending: "1" },
    });
  }

  await ensureUserProfile(user);
  return user;
}

export async function redirectIfAuthenticated() {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (session?.user && isEmailVerified(session.user)) {
    throw redirect({ to: "/dashboard" });
  }
}
