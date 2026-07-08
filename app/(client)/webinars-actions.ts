"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function markWebinarComplete(webinarId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("webinar_completions")
    .insert({ webinar_id: webinarId, client_id: user.id });

  if (error && error.code !== "23505") {
    // 23505 = already marked complete, treat as a no-op success.
    return { error: "Couldn't update that." };
  }

  revalidatePath("/webinars");
  return { error: null };
}
