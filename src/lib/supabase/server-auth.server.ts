import type { User } from "@supabase/supabase-js";

import { getSupabaseAdmin } from "@/lib/supabase/admin.server";

export async function requireServerUser(accessToken: string): Promise<User> {
  const { data, error } = await getSupabaseAdmin().auth.getUser(accessToken);

  if (error) {
    throw new Error("You must be logged in.");
  }

  if (!data.user) {
    throw new Error("You must be logged in.");
  }

  return data.user;
}
