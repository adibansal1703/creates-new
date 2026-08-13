import { supabase } from "@/lib/supabase";

export async function checkEmailExists(email: string): Promise<boolean> {
  const { data, error } = await supabase.rpc("email_exists", {
    email_input: email.trim(),
  });

  if (error) {
    console.error("email_exists RPC:", error.message);
    return false;
  }

  return Boolean(data);
}
