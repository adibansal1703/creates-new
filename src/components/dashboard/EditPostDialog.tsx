import { useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PostScheduleForm } from "@/components/dashboard/PostScheduleForm";
import { useUpdateScheduledPost } from "@/hooks/use-scheduled-posts";
import { splitScheduledTime } from "@/lib/scheduled-post-utils";
import type { PostPlatform, ScheduledPost } from "@/lib/types/database";
import { toScheduledTimeIso, type PostScheduleFormValues } from "@/lib/validations/post-schedule";

type EditPostDialogProps = {
  post: ScheduledPost | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function EditPostDialog({ post, open, onOpenChange }: EditPostDialogProps) {
  const updatePost = useUpdateScheduledPost();
  const [formKey, setFormKey] = useState(0);

  const handleOpenChange = (next: boolean) => {
    if (next && post) setFormKey((k) => k + 1);
    onOpenChange(next);
  };

  if (!post) return null;

  const { date, time } = splitScheduledTime(post.scheduled_time);

  const handleSubmit = async (values: PostScheduleFormValues) => {
    try {
      const platform = values.platform as PostPlatform;
      await updatePost.mutateAsync({
        id: post.id,
        input: {
          platform,
          contentPayload: {
            ...post.content_payload,
            [platform]: { content: values.content },
          },
          scheduledTime: toScheduledTimeIso(values),
          timezone: post.timezone,
          status: "scheduled",
        },
      });
      toast.success("Post updated");
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update post");
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="glass border-border/60 max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit scheduled post</DialogTitle>
          <DialogDescription>Update content, platform, or reschedule this post.</DialogDescription>
        </DialogHeader>
        <PostScheduleForm
          key={`${post.id}-${formKey}`}
          defaultValues={{
            platform: post.platform,
            content: post.content,
            scheduleDate: date,
            scheduleTime: time,
          }}
          submitLabel="Save changes"
          submittingLabel="Saving…"
          onSubmit={handleSubmit}
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
