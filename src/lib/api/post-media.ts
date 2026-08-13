import { supabase } from "@/lib/supabase";

export async function uploadPostMedia(file: File): Promise<string> {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error("You must be logged in to upload media.");
  }

  if (!file.type.startsWith("image/")) {
    throw new Error("Instagram publishing currently supports image uploads only.");
  }

  const safeName = file.name.replace(/[^\w.-]+/g, "_");
  const filePath = `${user.id}/${Date.now()}-${safeName}`;

  const { error: uploadError } = await supabase.storage.from("post-media").upload(filePath, file, {
    upsert: false,
    contentType: file.type,
  });

  if (uploadError) {
    throw new Error(uploadError.message);
  }

  const { data } = supabase.storage.from("post-media").getPublicUrl(filePath);
  return data.publicUrl;
}
