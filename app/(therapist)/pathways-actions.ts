"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { pathwaySchema, type PathwayInput } from "@/lib/validations/pathways";

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

export async function createPathway(input: PathwayInput): Promise<ActionResult> {
  const parsed = pathwaySchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const { supabase, user } = await requireTherapist();

  const { data: pathway, error: pathwayError } = await supabase
    .from("pathways")
    .insert({
      title: parsed.data.title,
      category: parsed.data.category,
      description: parsed.data.description || null,
      cover_image_url: parsed.data.coverImageUrl || null,
      created_by: user.id,
    })
    .select("id")
    .single();

  if (pathwayError || !pathway) return { error: "Couldn't create the pathway. Try again." };

  const rows = parsed.data.steps.map((s, index) => ({
    pathway_id: pathway.id,
    position: index,
    title: s.title,
    content: s.content,
    reflection_prompt: s.reflectionPrompt || null,
    reflection_max_length: s.reflectionMaxLength || null,
  }));

  const { error: stepsError } = await supabase.from("pathway_steps").insert(rows);
  if (stepsError) {
    await supabase.from("pathways").delete().eq("id", pathway.id);
    return { error: "Couldn't save the steps. Try again." };
  }

  revalidatePath("/dashboard/skill-building");
  revalidatePath("/skill-building");
  return { error: null };
}

export async function setPathwayActive(id: string, isActive: boolean): Promise<ActionResult> {
  const { supabase } = await requireTherapist();
  const { error } = await supabase.from("pathways").update({ is_active: isActive }).eq("id", id);
  if (error) return { error: "Couldn't update the pathway." };

  revalidatePath("/dashboard/skill-building");
  revalidatePath("/skill-building");
  return { error: null };
}

export async function deletePathway(id: string): Promise<ActionResult> {
  const { supabase } = await requireTherapist();
  const { error } = await supabase.from("pathways").delete().eq("id", id);
  if (error) return { error: "Couldn't delete the pathway." };

  revalidatePath("/dashboard/skill-building");
  revalidatePath("/skill-building");
  return { error: null };
}
