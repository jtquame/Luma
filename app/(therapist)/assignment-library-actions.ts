"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  assignmentTemplateSchema,
  type AssignmentTemplateInput,
} from "@/lib/validations/assignment-library";

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

export async function createAssignmentTemplate(input: AssignmentTemplateInput): Promise<ActionResult> {
  const parsed = assignmentTemplateSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const { supabase, user } = await requireTherapist();

  const { error } = await supabase.from("assignment_templates").insert({
    title: parsed.data.title,
    instructions: parsed.data.instructions,
    reflection_prompt: parsed.data.reflectionPrompt || null,
    reflection_max_length: parsed.data.reflectionMaxLength || null,
    attachment_url: parsed.data.attachmentUrl || null,
    attachment_name: parsed.data.attachmentName || null,
    attachment_type: parsed.data.attachmentType || null,
    created_by: user.id,
  });

  if (error) {
    if (error.code === "23505") return { error: "You already have a template with that title." };
    return { error: "Couldn't save the template. Try again." };
  }

  revalidatePath("/dashboard/reflections");
  return { error: null };
}

export async function deleteAssignmentTemplate(id: string): Promise<ActionResult> {
  const { supabase } = await requireTherapist();
  const { error } = await supabase.from("assignment_templates").delete().eq("id", id);
  if (error) return { error: "Couldn't delete that." };

  revalidatePath("/dashboard/reflections");
  return { error: null };
}
