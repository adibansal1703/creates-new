export type PostType = "Reel" | "Carousel" | "Single Image";

export type ContentGoal = "Engagement" | "Reach" | "Leads" | "Authority" | "Community Building";

export type Emotion =
  | "Default"
  | "Happy"
  | "Funny"
  | "Inspirational"
  | "Motivational"
  | "Emotional"
  | "Romantic"
  | "Sad"
  | "Educational"
  | "Professional"
  | "Urgent"
  | "Storytelling";

export interface ContentIdea {
  postType: PostType;
  contentGoal: ContentGoal;
  title: string;
  visualConcept: string;
  hook: string;
  talkingPoints: string[];
  emotion: Emotion;
}

export interface GeneratedCaption {
  caption: string;
  cta: string;
  hashtags: string[];
}

export interface AIContentIdeasRequest {
  niche: string;
  targetAudience: string;
  goal: string;
  emotion: Emotion;
}

export interface AIContentIdeasResponse {
  ideas: ContentIdea[];
}

export interface AICaptionRequest {
  title: string;
  hook: string;
  postType: PostType;
  contentGoal: ContentGoal;
  talkingPoints: string[];
  niche: string;
  targetAudience: string;
  goal: string;
  emotion: Emotion;
}

export interface AICaptionResponse {
  caption: string;
  cta: string;
  hashtags: string[];
}

export interface AIContentIdeaRecord {
  id: string;
  user_id: string;
  niche: string;
  target_audience: string;
  goal: string;
  emotion: string;
  generated_content_json: AIContentIdeasResponse;
  created_at: string;
}
