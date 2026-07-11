"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { templateSchema, type TemplateInput } from "@/lib/validations/templates";
import type { QuestionConfig } from "@/lib/supabase/types";
import { CHECKIN_PRESETS } from "@/lib/checkin-presets";

type ActionResult = { error: string | null };

async function requireTherapist() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "therapist") throw new Error("Not authorized");
  return { supabase, user };
}

export async function createTemplate(input: TemplateInput): Promise<ActionResult> {
  const parsed = templateSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const { supabase, user } = await requireTherapist();

  const { data: template, error: templateError } = await supabase
    .from("templates")
    .insert({
      kind: parsed.data.kind,
      title: parsed.data.title,
      description: parsed.data.description || null,
      frequency: parsed.data.kind === "check_in" ? parsed.data.frequency ?? "daily" : null,
      created_by: user.id,
    })
    .select("id")
    .single();

  if (templateError || !template) {
    return { error: "Couldn't create the template. Try again." };
  }

  const rows = parsed.data.questions.map((q, index) => {
    const config: QuestionConfig = {};
    if (q.options) config.options = q.options;
    if (q.min !== undefined) config.min = q.min;
    if (q.max !== undefined) config.max = q.max;
    if (q.maxLength !== undefined) config.max_length = q.maxLength;

    return {
      template_id: template.id,
      position: index,
      type: q.type,
      label: q.label,
      config,
      is_required: q.isRequired,
    };
  });

  const { error: questionsError } = await supabase.from("template_questions").insert(rows);
  if (questionsError) {
    // Clean up the orphaned template rather than leaving a broken shell.
    await supabase.from("templates").delete().eq("id", template.id);
    return { error: "Couldn't save the questions. Try again." };
  }

  await supabase.from("audit_log").insert({
    actor_id: user.id,
    action: "template.created",
    target_type: "template",
    target_id: template.id,
    metadata: { kind: parsed.data.kind, title: parsed.data.title },
  });

  revalidatePath("/dashboard/prompts");
  return { error: null };
}

export async function setTemplateActive(
  templateId: string,
  isActive: boolean
): Promise<ActionResult> {
  const { supabase, user } = await requireTherapist();

  const { error } = await supabase
    .from("templates")
    .update({ is_active: isActive })
    .eq("id", templateId);

  if (error) return { error: "Couldn't update the template." };

  await supabase.from("audit_log").insert({
    actor_id: user.id,
    action: isActive ? "template.activated" : "template.archived",
    target_type: "template",
    target_id: templateId,
  });

  revalidatePath("/dashboard/prompts");
  return { error: null };
}

export async function deleteTemplate(templateId: string): Promise<ActionResult> {
  const { supabase, user } = await requireTherapist();

  const { error } = await supabase.from("templates").delete().eq("id", templateId);
  if (error) return { error: "Couldn't delete that. Try again." };

  await supabase.from("audit_log").insert({
    actor_id: user.id,
    action: "template.deleted",
    target_type: "template",
    target_id: templateId,
  });

  revalidatePath("/dashboard/prompts");
  return { error: null };
}

export async function markResponseReviewed(responseId: string): Promise<ActionResult> {
  const { supabase, user } = await requireTherapist();

  const { error } = await supabase
    .from("responses")
    .update({ reviewed_at: new Date().toISOString(), reviewed_by: user.id })
    .eq("id", responseId);

  if (error) return { error: "Couldn't mark that reviewed." };

  revalidatePath("/dashboard/prompts");
  return { error: null };
}

export async function addPresetTemplate(presetId: string): Promise<ActionResult> {
  const preset = CHECKIN_PRESETS.find((p) => p.id === presetId);
  if (!preset) return { error: "Unknown preset." };

  return createTemplate({
    kind: "check_in",
    title: preset.title,
    description: preset.description,
    frequency: preset.frequency,
    questions: preset.questions,
  });
}

export async function createLibraryCheckIn(input: TemplateInput): Promise<ActionResult> {
  const parsed = templateSchema.safeParse({ ...input, kind: "check_in" });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const { supabase, user } = await requireTherapist();

  const { error } = await supabase.from("checkin_library").insert({
    title: parsed.data.title,
    description: parsed.data.description || null,
    frequency: parsed.data.frequency ?? "daily",
    questions: parsed.data.questions,
    created_by: user.id,
  });

  if (error) return { error: "Couldn't save to the library. Try again." };

  revalidatePath("/dashboard/prompts");
  return { error: null };
}

export async function deleteLibraryCheckIn(id: string): Promise<ActionResult> {
  const { supabase } = await requireTherapist();
  const { error } = await supabase.from("checkin_library").delete().eq("id", id);
  if (error) return { error: "Couldn't delete that." };

  revalidatePath("/dashboard/prompts");
  return { error: null };
}

export async function addLibraryCheckInToLive(libraryId: string): Promise<ActionResult> {
  const { supabase } = await requireTherapist();

  const { data: item } = await supabase
    .from("checkin_library")
    .select("title, description, frequency, questions")
    .eq("id", libraryId)
    .single();

  if (!item) return { error: "Couldn't find that library item." };

  return createTemplate({
    kind: "check_in",
    title: item.title,
    description: item.description ?? undefined,
    frequency: item.frequency,
    questions: item.questions as TemplateInput["questions"],
  });
}

export async function setClientCheckInAssignment(
  clientId: string,
  templateId: string,
  assigned: boolean
): Promise<ActionResult> {
  const { supabase } = await requireTherapist();

  if (assigned) {
    const { error } = await supabase
      .from("client_checkin_assignments")
      .insert({ client_id: clientId, template_id: templateId });
    if (error && error.code !== "23505") return { error: "Couldn't assign that check-in." };
  } else {
    const { error } = await supabase
      .from("client_checkin_assignments")
      .delete()
      .eq("client_id", clientId)
      .eq("template_id", templateId);
    if (error) return { error: "Couldn't unassign that check-in." };
  }

  revalidatePath("/dashboard/prompts");
  revalidatePath("/check-in");
  revalidatePath("/home");
  return { error: null };
}
