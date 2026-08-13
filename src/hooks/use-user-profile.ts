import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { getSupabase } from "@/lib/supabase";
import { isEmailVerified } from "@/lib/auth-session";

type UserProfile = {
  full_name: string | null;
  email: string | null;
};

export function useUserProfile() {
  const { user, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);

  const isAuthenticated = Boolean(user && isEmailVerified(user));

  useEffect(() => {
    if (!user?.id || !isEmailVerified(user)) {
      setProfile(null);
      return;
    }

    let cancelled = false;
    setLoading(true);

    getSupabase()
      .from("profiles")
      .select("full_name, email")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (!cancelled) {
          setProfile(data ?? null);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [user?.id, user?.email, user]);

  const displayName =
    profile?.full_name ||
    (user?.user_metadata?.full_name as string | undefined) ||
    user?.email?.split("@")[0] ||
    "User";

  const email = profile?.email || user?.email || "";

  const initials = displayName
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return {
    displayName,
    email,
    initials,
    isAuthenticated,
    loading: authLoading || loading,
  };
}
