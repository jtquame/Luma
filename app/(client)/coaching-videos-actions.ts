"use server";

import { createClient } from "@/lib/supabase/server";

export async function recordVideoView(videoId: string): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("coaching_video_views")
    .insert({ video_id: videoId, client_id: user.id });

  if (error) return { error: "Couldn't log that view." };
  return { error: null };
}
