export const PLATFORMS = ["linkedin", "x", "instagram", "facebook"] as const;
export type PostPlatform = (typeof PLATFORMS)[number];

export const POST_STATUSES = ["scheduled", "published", "failed", "cancelled"] as const;
export type PostStatus = (typeof POST_STATUSES)[number];

export type ScheduledPost = {
  id: string;
  user_id: string;
  platform: PostPlatform;
  content: string;
  scheduled_time: string;
  status: PostStatus;
  created_at: string;
};

export type ScheduledPostInsert = {
  platform: PostPlatform;
  content: string;
  scheduled_time: string;
};

export type ScheduledPostUpdate = Partial<ScheduledPostInsert> & {
  status?: PostStatus;
};

export const PLATFORM_LABELS: Record<PostPlatform, string> = {
  linkedin: "LinkedIn",
  x: "X",
  instagram: "Instagram",
  facebook: "Facebook",
};

export const STATUS_LABELS: Record<PostStatus, string> = {
  scheduled: "Scheduled",
  published: "Published",
  failed: "Failed",
  cancelled: "Cancelled",
};
