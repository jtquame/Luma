"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  currentlyReadingSchema,
  webinarSchema,
  supportGroupSchema,
  announcementSchema,
  type CurrentlyReadingInput,
  type WebinarInput,
  type SupportGroupInput,
  type AnnouncementInput,
} from "@/lib/validations/content";
import { settingsSchema, type SettingsInput } from "@/lib/validations/settings";

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

export async function updateCurrentlyReading(input: CurrentlyReadingInput): Promise<ActionResult> {
  const parsed = currentlyReadingSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const { supabase } = await requireTherapist();

  const { error } = await supabase
    .from("currently_reading")
    .update({
      book_title: parsed.data.bookTitle,
      author: parsed.data.author || null,
      cover_image_url: parsed.data.coverImageUrl || null,
      progress_note: parsed.data.progressNote || null,
      why_reading: parsed.data.whyReading || null,
      learning_note: parsed.data.learningNote || null,
      favorite_quote: parsed.data.favoriteQuote || null,
      recommended_chapter: parsed.data.recommendedChapter || null,
    })
    .eq("id", true);

  if (error) return { error: "Couldn't save. Try again." };

  revalidatePath("/dashboard/settings");
  revalidatePath("/home");
  return { error: null };
}

export async function createWebinar(input: WebinarInput): Promise<ActionResult> {
  const parsed = webinarSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const { supabase, user } = await requireTherapist();

  const { error } = await supabase.from("webinars").insert({
    title: parsed.data.title,
    description: parsed.data.description || null,
    speaker: parsed.data.speaker || null,
    video_url: parsed.data.videoUrl || null,
    thumbnail_url: parsed.data.thumbnailUrl || null,
    length_minutes: parsed.data.lengthMinutes || null,
    slides_url: parsed.data.slidesUrl || null,
    worksheet_url: parsed.data.worksheetUrl || null,
    scheduled_at: parsed.data.scheduledAt || null,
    registration_url: parsed.data.registrationUrl || null,
    created_by: user.id,
  });

  if (error) return { error: "Couldn't save the webinar. Try again." };

  revalidatePath("/dashboard/webinars");
  revalidatePath("/webinars");
  return { error: null };
}

export async function updateWebinar(id: string, input: WebinarInput): Promise<ActionResult> {
  const parsed = webinarSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const { supabase } = await requireTherapist();

  const { error } = await supabase
    .from("webinars")
    .update({
      title: parsed.data.title,
      description: parsed.data.description || null,
      speaker: parsed.data.speaker || null,
      video_url: parsed.data.videoUrl || null,
      thumbnail_url: parsed.data.thumbnailUrl || null,
      length_minutes: parsed.data.lengthMinutes || null,
      slides_url: parsed.data.slidesUrl || null,
      worksheet_url: parsed.data.worksheetUrl || null,
      scheduled_at: parsed.data.scheduledAt || null,
      registration_url: parsed.data.registrationUrl || null,
    })
    .eq("id", id);

  if (error) return { error: "Couldn't update the webinar. Try again." };

  revalidatePath("/dashboard/webinars");
  revalidatePath("/webinars");
  return { error: null };
}

export async function deleteWebinar(id: string): Promise<ActionResult> {
  const { supabase } = await requireTherapist();
  const { error } = await supabase.from("webinars").delete().eq("id", id);
  if (error) return { error: "Couldn't delete the webinar." };

  revalidatePath("/dashboard/webinars");
  revalidatePath("/webinars");
  return { error: null };
}

export async function createSupportGroup(input: SupportGroupInput): Promise<ActionResult> {
  const parsed = supportGroupSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const { supabase, user } = await requireTherapist();

  const { error } = await supabase.from("support_groups").insert({
    title: parsed.data.title,
    description: parsed.data.description || null,
    who_should_attend: parsed.data.whoShouldAttend || null,
    meets_at: parsed.data.meetsAt || null,
    location: parsed.data.location || null,
    virtual_link: parsed.data.virtualLink || null,
    is_recurring: parsed.data.isRecurring,
    created_by: user.id,
  });

  if (error) return { error: "Couldn't save the support group. Try again." };

  revalidatePath("/dashboard/support-groups");
  revalidatePath("/support-groups");
  return { error: null };
}

export async function deleteSupportGroup(id: string): Promise<ActionResult> {
  const { supabase } = await requireTherapist();
  const { error } = await supabase.from("support_groups").delete().eq("id", id);
  if (error) return { error: "Couldn't delete that." };

  revalidatePath("/dashboard/support-groups");
  revalidatePath("/support-groups");
  return { error: null };
}

export async function createAnnouncement(input: AnnouncementInput): Promise<ActionResult> {
  const parsed = announcementSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const { supabase, user } = await requireTherapist();

  const { error } = await supabase.from("announcements").insert({
    title: parsed.data.title,
    body: parsed.data.body,
    expires_at: parsed.data.expiresAt || null,
    created_by: user.id,
  });

  if (error) return { error: "Couldn't post the announcement." };

  revalidatePath("/dashboard/announcements");
  revalidatePath("/announcements");
  revalidatePath("/home");
  return { error: null };
}

export async function deleteAnnouncement(id: string): Promise<ActionResult> {
  const { supabase } = await requireTherapist();
  const { error } = await supabase.from("announcements").delete().eq("id", id);
  if (error) return { error: "Couldn't delete that." };

  revalidatePath("/dashboard/announcements");
  revalidatePath("/announcements");
  return { error: null };
}

export async function updateSettings(input: SettingsInput): Promise<ActionResult> {
  const parsed = settingsSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const { supabase } = await requireTherapist();

  const { error } = await supabase
    .from("settings")
    .update({
      practice_name: parsed.data.practiceName,
      welcome_message: parsed.data.welcomeMessage || "Glad you're here.",
      session_timeout_minutes: parsed.data.sessionTimeoutMinutes,
    })
    .eq("id", true);

  if (error) return { error: "Couldn't save settings." };

  revalidatePath("/dashboard/settings");
  revalidatePath("/home");
  return { error: null };
}
