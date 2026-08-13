import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createScheduledPost,
  deleteScheduledPost,
  fetchScheduledPosts,
  scheduleMultiple,
  updateScheduledPost,
} from "@/lib/api/scheduled-posts";
import type { ContentPayload, PostPlatform } from "@/lib/types/database";

export const scheduledPostsQueryKey = ["scheduled-posts"] as const;

export function useScheduledPosts() {
  return useQuery({
    queryKey: scheduledPostsQueryKey,
    queryFn: fetchScheduledPosts,
  });
}

export function useCreateScheduledPost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createScheduledPost,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: scheduledPostsQueryKey }),
  });
}

export function useScheduleMultiple() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: scheduleMultiple,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: scheduledPostsQueryKey });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      queryClient.invalidateQueries({ queryKey: ["recent-scheduled"] });
    },
  });
}

export function useUpdateScheduledPost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Parameters<typeof updateScheduledPost>[1] }) =>
      updateScheduledPost(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: scheduledPostsQueryKey });
      queryClient.invalidateQueries({ queryKey: ["recent-scheduled"] });
    },
  });
}

export function useDeleteScheduledPost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteScheduledPost,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: scheduledPostsQueryKey });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
    },
  });
}

export type LegacyScheduleInput = {
  platform: PostPlatform;
  content: string;
  scheduled_time: string;
  timezone?: string;
  content_payload?: ContentPayload;
};
