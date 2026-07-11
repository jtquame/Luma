"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { submitResponseSchema, type SubmitResponseInput } from "@/lib/validations/templates";
import type { QuestionConfig, AnswerValue } from "@/lib/supabase/types";

type ActionResult = { error: string | null };
type SubmitResult = { error: string | null; responseId?: string };

function validateAnswer(
  type: string,
  config: QuestionConfig,
  value: AnswerValue
): string | null {
  switch (type) {
    case "single_choice":
      if (typeof value !== "string" || !config.options?.includes(value)) {
        return "Invalid selection";
      }
      return null;
    case "multi_choice":
      if (
        !Array.isArray(value) ||
        !value.every((v) => typeof v === "string" && config.options?.includes(v))
      ) {
        return "Invalid selection";
      }
      return null;
    case "scale":
    case "slider": {
      const min = config.min ?? (type === "scale" ? 1 : 0);
      const max = config.max ?? (type === "scale" ? 5 : 100);
      if (typeof value !== "number" || value < min || value > max) {
        return "Value out of range";
      }
      return null;
    }
    case "yes_no":
      if (typeof value !== "boolean") return "Invalid answer";
      return null;
    case "short_reflection": {
      const maxLength = config.max_length ?? 250;
      if (typeof value !== "string" || value.length > maxLength) {
        return `Keep it under ${maxLength} characters`;
      }
      return null;
    }
    default:
      return "Unknown question type";
  }
}

export async function submitResponse(input: SubmitResponseInput): Promise<SubmitResult> {
  const parsed = submitResponseSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: questions, error: questionsError } = await supabase
    .from("template_questions")
    .select("id, type, label, config, is_required")
    .eq("template_id", parsed.data.templateId);

  if (questionsError || !questions) {
    return { error: "Couldn't load that check-in. Try again." };
  }

  const answersByQuestion = new Map(parsed.data.answers.map((a) => [a.questionId, a.value]));

  for (const q of questions) {
    const answer = answersByQuestion.get(q.id);
    if (answer === undefined) {
      if (q.is_required) return { error: "Please answer every question." };
      continue;
    }
    const validationError = validateAnswer(q.type, q.config as QuestionConfig, answer);
    if (validationError) return { error: validationError };
  }

  const { data: response, error: responseError } = await supabase
    .from("responses")
    .insert({ template_id: parsed.data.templateId, client_id: user.id })
    .select("id")
    .single();

  if (responseError || !response) {
    // Most likely the "one check-in per day" unique constraint.
    if (responseError?.code === "23505") {
      return { error: "You've already completed this today." };
    }
    return { error: "Couldn't submit your response. Try again." };
  }

  const questionLabelById = new Map((questions ?? []).map((q) => [q.id, q.label]));

  const rows = parsed.data.answers.map((a) => ({
    response_id: response.id,
    question_id: a.questionId,
    question_label: questionLabelById.get(a.questionId) ?? "Question",
    value: a.value,
  }));

  const { error: answersError } = await supabase.from("response_answers").insert(rows);
  if (answersError) {
    return { error: "Couldn't save your answers. Try again." };
  }

  revalidatePath("/check-in");
  revalidatePath("/home");
  return { error: null, responseId: response.id };
}

export async function setResponseShared(
  responseId: string,
  shared: boolean
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("responses")
    .update({ shared_with_therapist: shared })
    .eq("id", responseId)
    .eq("client_id", user.id);

  if (error) return { error: "Couldn't save that. Try again." };

  revalidatePath("/check-in");
  return { error: null };
}
