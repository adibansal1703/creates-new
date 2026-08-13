export const PLATFORMS = ["instagram", "facebook", "linkedin", "x", "youtube"] as const;
export type PostPlatform = (typeof PLATFORMS)[number];

export const POST_STATUSES = ["draft", "scheduled", "published", "failed"] as const;
export type PostStatus = (typeof POST_STATUSES)[number];

export const PLATFORM_LABELS: Record<PostPlatform, string> = {
  instagram: "Instagram",
  facebook: "Facebook",
  linkedin: "LinkedIn",
  x: "X",
  youtube: "YouTube",
};

export const STATUS_LABELS: Record<PostStatus, string> = {
  draft: "Draft",
  scheduled: "Scheduled",
  published: "Published",
  failed: "Failed",
};

export type Profile = {
  id: string;
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
  timezone: string;
  created_at: string;
  updated_at: string;
};

export type ConnectedAccount = {
  id: string;
  user_id: string;
  platform: PostPlatform;
  account_name: string;
  external_account_id: string | null;
  token_expires_at: string | null;
  is_connected: boolean;
  connected_at: string;
  created_at: string;
};

export type ContentPayload = Partial<Record<PostPlatform, Record<string, string | null>>>;

export type ScheduledPost = {
  id: string;
  user_id: string;
  platform: PostPlatform;
  content: string;
  content_payload: ContentPayload;
  scheduled_time: string;
  timezone: string;
  status: PostStatus;
  published_at: string | null;
  error_message: string | null;
  created_at: string;
};

export type PublishedPost = {
  id: string;
  user_id: string;
  platform: PostPlatform;
  content: string;
  content_payload: ContentPayload;
  published_at: string;
  status: PostStatus;
  external_post_id: string | null;
  scheduled_post_id: string | null;
  created_at: string;
};

export type Draft = {
  id: string;
  user_id: string;
  platforms: PostPlatform[];
  content_payload: ContentPayload;
  created_at: string;
  updated_at: string;
};

export type DashboardStats = {
  connectedPlatforms: number;
  scheduledPosts: number;
  publishedPosts: number;
  draftPosts: number;
};
