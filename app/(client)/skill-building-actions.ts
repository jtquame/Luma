"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { completeStepSchema, type CompleteStepInput } from "@/lib/validations/pathways";

type ActionResult = { error: string | null };

export async function startPathway(pathwayId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("pathway_enrollments")
    .insert({ client_id: user.id, pathway_id: pathwayId });

  // 23505 = already enrolled — treat as a no-op success.
  if (error && error.code !== "23505") {
    return { error: "Couldn't start this pathway. Try again." };
  }

  revalidatePath(`/skill-building/${pathwayId}`);
  revalidatePath("/skill-building");
  return { error: null };
}

export async function completeStep(input: CompleteStepInput): Promise<ActionResult> {
  const parsed = completeStepSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  // Re-verify sequential order server-side — never trust that the client
  // only shows the "current" step; a direct API call could try to skip
  // ahead.
  const { data: step } = await supabase
    .from("pathway_steps")
    .select("id, pathway_id, position")
    .eq("id", parsed.data.stepId)
    .single();

  if (!step) return { error: "Step not found." };

  if (step.position > 0) {
    const { data: priorSteps } = await supabase
      .from("pathway_steps")
      .select("id")
      .eq("pathway_id", step.pathway_id)
      .lt("position", step.position);

    const priorIds = (priorSteps ?? []).map((s) => s.id);
    if (priorIds.length > 0) {
      const { count } = await supabase
        .from("pathway_step_completions")
        .select("*", { count: "exact", head: true })
        .eq("client_id", user.id)
        .in("step_id", priorIds);

      if ((count ?? 0) < priorIds.length) {
        return { error: "Complete the earlier steps first." };
      }
    }
  }

  const { error } = await supabase.from("pathway_step_completions").insert({
    client_id: user.id,
    step_id: parsed.data.stepId,
    reflection_response: parsed.data.reflectionResponse || null,
  });

  if (error && error.code !== "23505") {
    return { error: "Couldn't save your progress. Try again." };
  }

  // If that was the last step, mark the pathway itself complete.
  const { data: allSteps } = await supabase
    .from("pathway_steps")
    .select("id")
    .eq("pathway_id", step.pathway_id);

  const allStepIds = (allSteps ?? []).map((s) => s.id);
  const totalSteps = allStepIds.length;

  const { count: completedSteps } = await supabase
    .from("pathway_step_completions")
    .select("*", { count: "exact", head: true })
    .eq("client_id", user.id)
    .in("step_id", allStepIds);

  if (completedSteps !== null && completedSteps >= totalSteps) {
    await supabase
      .from("pathway_enrollments")
      .update({ completed_at: new Date().toISOString() })
      .eq("client_id", user.id)
      .eq("pathway_id", step.pathway_id);
  }

  revalidatePath(`/skill-building/${step.pathway_id}`);
  revalidatePath("/skill-building");
  return { error: null };
}
