import { generateCaption, generateContentIdeas } from "@/lib/ai/gemini.server";
import { getSupabaseAdmin } from "@/lib/supabase/admin.server";
import type {
  AIContentIdeasRequest,
  AIContentIdeasResponse,
  AICaptionRequest,
  AICaptionResponse,
  AIContentIdeaRecord,
} from "@/lib/types/ai";

export async function fetchAIContentIdeas(userId: string): Promise<AIContentIdeaRecord[]> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("ai_content_ideas")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as AIContentIdeaRecord[];
}

export async function generateAndSaveContentIdeas(
  request: AIContentIdeasRequest & { userId: string },
): Promise<AIContentIdeasResponse> {
  const { userId, ...aiRequest } = request;

  // Generate ideas using Gemini
  const response = await generateContentIdeas(aiRequest);

  // Save to database using admin client (bypasses RLS)
  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from("ai_content_ideas").insert({
    user_id: userId,
    niche: request.niche,
    target_audience: request.targetAudience,
    goal: request.goal,
    emotion: request.emotion,
    generated_content_json: response,
  });

  if (error) throw new Error(error.message);

  return response;
}

export async function generateCaptionForIdea(
  request: AICaptionRequest,
): Promise<AICaptionResponse> {
  return generateCaption(request);
}

export async function deleteAIContentIdea(userId: string, id: string): Promise<void> {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from("ai_content_ideas")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);
  if (error) throw new Error(error.message);
}
