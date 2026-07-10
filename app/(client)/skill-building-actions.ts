"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  completeAssignmentSchema,
  type CompleteAssignmentInput,
} from "@/lib/validations/assignments";

type ActionResult = { error: string | null };

export async function completeAssignment(input: CompleteAssignmentInput): Promise<ActionResult> {
  const parsed = completeAssignmentSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("assignments")
    .update({
      status: "completed",
      reflection_response: parsed.data.reflectionResponse || null,
      completed_at: new Date().toISOString(),
    })
    .eq("id", parsed.data.assignmentId)
    .eq("client_id", user.id);

  if (error) return { error: "Couldn't save that. Try again." };

  revalidatePath("/skill-building");
  revalidatePath("/home");
  return { error: null };
}
