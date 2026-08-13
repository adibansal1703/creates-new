import { supabase } from "@/lib/supabase";

type NotificationType =
  | "welcome"
  | "email_verification"
  | "post_scheduled"
  | "post_published"
  | "email_changed"
  | "password_changed"
  | "account_deletion_requested";

export async function enqueueNotification(
  type: NotificationType,
  payload: Record<string, unknown>,
): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { error } = await supabase.from("notification_queue").insert({
    user_id: user.id,
    type,
    payload,
  });

  if (error) {
    console.error("Failed to enqueue notification:", error.message);
  }
}
