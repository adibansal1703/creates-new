import { supabase } from "@/lib/supabase";
import type { ContentPayload, Draft, PostPlatform } from "@/lib/types/database";

async function requireUserId(): Promise<string> {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) throw new Error("You must be logged in.");
  return user.id;
}

export async function fetchDrafts(): Promise<Draft[]> {
  const userId = await requireUserId();
  const { data, error } = await supabase
    .from("drafts")
    .select("*")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as Draft[];
}

export async function saveDraft(input: {
  platforms: PostPlatform[];
  contentPayload: ContentPayload;
  draftId?: string;
}): Promise<Draft> {
  const userId = await requireUserId();
  const payload = {
    user_id: userId,
    platforms: input.platforms,
    content_payload: input.contentPayload,
    updated_at: new Date().toISOString(),
  };

  if (input.draftId) {
    const { data, error } = await supabase
      .from("drafts")
      .update(payload)
      .eq("id", input.draftId)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data as Draft;
  }

  const { data, error } = await supabase
    .from("drafts")
    .insert([{ ...payload, created_at: new Date().toISOString() }])
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as Draft;
}
