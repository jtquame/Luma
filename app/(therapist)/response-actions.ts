"use server";

import { createClient } from "@/lib/supabase/server";

export interface ResponseDetailItem {
  question: string;
  answer: string;
}

export async function getResponseDetail(
  responseId: string
): Promise<{ items: ResponseDetailItem[]; error: string | null }> {
  const supabase = await createClient();

  // RLS on response_answers only returns rows if the response has been
  // shared (or it's the client's own) — if it wasn't shared, this comes
  // back empty rather than erroring, which is exactly the signal we want.
  const { data: answers, error } = await supabase
    .from("response_answers")
    .select("value, question_label")
    .eq("response_id", responseId);

  if (error) return { items: [], error: "Couldn't load that response." };

  if (!answers || answers.length === 0) {
    return { items: [], error: "not_shared" };
  }

  const items = answers.map((a) => {
    const value = a.value;
    const answerText = Array.isArray(value)
      ? value.join(", ")
      : typeof value === "boolean"
        ? value
          ? "Yes"
          : "No"
        : String(value);
    return { question: a.question_label ?? "Question", answer: answerText };
  });

  return { items, error: null };
}
