"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { templateSchema, type TemplateInput } from "@/lib/validations/templates";
import type { QuestionConfig } from "@/lib/supabase/types";

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
