"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { assignmentSchema, type AssignmentInput } from "@/lib/validations/assignments";
import { sendAssignmentEmail } from "@/lib/email/resend";

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

export async function createAssignment(input: AssignmentInput): Promise<ActionResult> {
  const parsed = assignmentSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const { supabase, user } = await requireTherapist();

  const { data: client } = await supabase
    .from("users")
    .select("first_name, email")
    .eq("id", parsed.data.clientId)
    .eq("role", "client")
    .single();

  if (!client) return { error: "Couldn't find that client." };

  const { error } = await supabase.from("assignments").insert({
    client_id: parsed.data.clientId,
    title: parsed.data.title,
    instructions: parsed.data.instructions,
    reflection_prompt: parsed.data.reflectionPrompt || null,
    reflection_max_length: parsed.data.reflectionMaxLength || null,
    created_by: user.id,
  });

  if (error) return { error: "Couldn't create the assignment. Try again." };

  // Best-effort — assignment is created either way. If email isn't
  // configured (no RESEND_API_KEY) or fails, the client will still see it
  // next time they open the app.
  try {
    await sendAssignmentEmail({
      to: client.email,
      firstName: client.first_name,
      title: parsed.data.title,
    });
  } catch {
    // Swallow — see comment above.
  }

  revalidatePath("/dashboard/skill-building");
  revalidatePath("/skill-building");
  return { error: null };
}

export async function deleteAssignment(id: string): Promise<ActionResult> {
  const { supabase } = await requireTherapist();
  const { error } = await supabase.from("assignments").delete().eq("id", id);
  if (error) return { error: "Couldn't delete that." };

  revalidatePath("/dashboard/skill-building");
  return { error: null };
}
