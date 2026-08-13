import { z } from "zod";
import { PLATFORMS } from "@/lib/types/database";
import { combineDateAndTime } from "@/lib/scheduled-post-utils";

export const postScheduleSchema = z
  .object({
    platform: z.enum(PLATFORMS, { required_error: "Select a platform" }),
    content: z
      .string()
      .min(1, "Post content is required")
      .max(5000, "Post content must be under 5000 characters"),
    scheduleDate: z.string().min(1, "Select a schedule date"),
    scheduleTime: z.string().min(1, "Select a schedule time"),
  })
  .superRefine((data, ctx) => {
    const scheduled = combineDateAndTime(data.scheduleDate, data.scheduleTime);
    if (Number.isNaN(scheduled.getTime())) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Invalid date or time",
        path: ["scheduleDate"],
      });
      return;
    }
    if (scheduled.getTime() <= Date.now()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Scheduled time must be in the future",
        path: ["scheduleTime"],
      });
    }
  });

export type PostScheduleFormValues = z.infer<typeof postScheduleSchema>;

export function toScheduledTimeIso(values: PostScheduleFormValues): string {
  return combineDateAndTime(values.scheduleDate, values.scheduleTime).toISOString();
}
