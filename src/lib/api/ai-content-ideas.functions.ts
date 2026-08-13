import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import {
  generateAndSaveContentIdeas,
  generateCaptionForIdea,
} from "@/lib/api/ai-content-ideas.server";
import { requireServerUser } from "@/lib/supabase/server-auth.server";
import type { Emotion } from "@/lib/types/ai";

const generateIdeasSchema = z.object({
  accessToken: z.string().min(1),
  niche: z.string().min(1),
  targetAudience: z.string().min(1),
  goal: z.string().min(1),
  emotion: z.enum([
    "Default",
    "Happy",
    "Funny",
    "Inspirational",
    "Motivational",
    "Emotional",
    "Romantic",
    "Sad",
    "Educational",
    "Professional",
    "Urgent",
    "Storytelling",
  ]),
});

const generateCaptionSchema = z.object({
  accessToken: z.string().min(1),
  title: z.string().min(1),
  hook: z.string().min(1),
  postType: z.enum(["Reel", "Carousel", "Single Image"]),
  contentGoal: z.enum(["Engagement", "Reach", "Leads", "Authority", "Community Building"]),
  talkingPoints: z.array(z.string()),
  niche: z.string().min(1),
  targetAudience: z.string().min(1),
  goal: z.string().min(1),
  emotion: z.enum([
    "Default",
    "Happy",
    "Funny",
    "Inspirational",
    "Motivational",
    "Emotional",
    "Romantic",
    "Sad",
    "Educational",
    "Professional",
    "Urgent",
    "Storytelling",
  ]),
});

export const generateContentIdeas = createServerFn({ method: "POST" })
  .inputValidator(generateIdeasSchema)
  .handler(async ({ data }) => {
    const user = await requireServerUser(data.accessToken);
    const response = await generateAndSaveContentIdeas({
      userId: user.id,
      niche: data.niche,
      targetAudience: data.targetAudience,
      goal: data.goal,
      emotion: data.emotion,
    });
    return response;
  });

export const generateCaption = createServerFn({ method: "POST" })
  .inputValidator(generateCaptionSchema)
  .handler(async ({ data }) => {
    await requireServerUser(data.accessToken);
    const response = await generateCaptionForIdea({
      title: data.title,
      hook: data.hook,
      postType: data.postType,
      contentGoal: data.contentGoal,
      talkingPoints: data.talkingPoints,
      niche: data.niche,
      targetAudience: data.targetAudience,
      goal: data.goal,
      emotion: data.emotion,
    });
    return response;
  });
