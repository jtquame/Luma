"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { coachingVideoSchema, type CoachingVideoInput } from "@/lib/validations/coaching-videos";

type ActionResult = { error: string | null };

async function requireTherapist() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: profile } = await supabase.from("users").select("role").eq("id", user.id).single();
  if (profile?.role !== "therapist") throw new Error("Not authorized");
  return { supabase, user };
}

export async function createCoachingVideo(input: CoachingVideoInput): Promise<ActionResult> {
  const parsed = coachingVideoSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const { supabase, user } = await requireTherapist();

  const { error } = await supabase.from("coaching_videos").insert({
    title: parsed.data.title,
    description: parsed.data.description || null,
    video_url: parsed.data.videoUrl,
    thumbnail_url: parsed.data.thumbnailUrl || null,
    created_by: user.id,
  });

  if (error) return { error: "Couldn't save the video. Try again." };

  revalidatePath("/dashboard/coaching-videos");
  revalidatePath("/coaching-videos");
  return { error: null };
}

export async function updateCoachingVideo(
  id: string,
  input: CoachingVideoInput
): Promise<ActionResult> {
  const parsed = coachingVideoSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const { supabase } = await requireTherapist();

  const { error } = await supabase
    .from("coaching_videos")
    .update({
      title: parsed.data.title,
      description: parsed.data.description || null,
      video_url: parsed.data.videoUrl,
      thumbnail_url: parsed.data.thumbnailUrl || null,
    })
    .eq("id", id);

  if (error) return { error: "Couldn't update the video. Try again." };

  revalidatePath("/dashboard/coaching-videos");
  revalidatePath("/coaching-videos");
  return { error: null };
}

export async function deleteCoachingVideo(id: string): Promise<ActionResult> {
  const { supabase } = await requireTherapist();
  const { error } = await supabase.from("coaching_videos").delete().eq("id", id);
  if (error) return { error: "Couldn't delete that. Try again." };

  revalidatePath("/dashboard/coaching-videos");
  revalidatePath("/coaching-videos");
  return { error: null };
}
