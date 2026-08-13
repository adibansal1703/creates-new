import { supabase } from "@/lib/supabase";
import type { DashboardStats, PublishedPost, ScheduledPost } from "@/lib/types/database";

async function requireUserId(): Promise<string> {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) throw new Error("You must be logged in.");
  return user.id;
}

export async function fetchDashboardStats(): Promise<DashboardStats> {
  const userId = await requireUserId();

  const [connected, scheduled, published, drafts] = await Promise.all([
    supabase
      .from("connected_accounts")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("is_connected", true),
    supabase
      .from("scheduled_posts")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("status", "scheduled"),
    supabase
      .from("published_posts")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId),
    supabase.from("drafts").select("id", { count: "exact", head: true }).eq("user_id", userId),
  ]);

  return {
    connectedPlatforms: connected.count ?? 0,
    scheduledPosts: scheduled.count ?? 0,
    publishedPosts: published.count ?? 0,
    draftPosts: drafts.count ?? 0,
  };
}

export async function fetchRecentScheduled(limit = 5): Promise<ScheduledPost[]> {
  const userId = await requireUserId();
  const { data, error } = await supabase
    .from("scheduled_posts")
    .select("*")
    .eq("user_id", userId)
    .order("scheduled_time", { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);
  return (data ?? []) as ScheduledPost[];
}

export async function fetchRecentPublished(limit = 5): Promise<PublishedPost[]> {
  const userId = await requireUserId();
  const { data, error } = await supabase
    .from("published_posts")
    .select("*")
    .eq("user_id", userId)
    .order("published_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);
  return (data ?? []) as PublishedPost[];
}
