"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { termsContentSchema, type TermsContentInput } from "@/lib/validations/terms";

type ActionResult = { error: string | null };

export async function updateTerms(input: TermsContentInput): Promise<ActionResult> {
  const parsed = termsContentSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: profile } = await supabase.from("users").select("role").eq("id", user.id).single();
  if (profile?.role !== "therapist") return { error: "Not authorized" };

  // Changing the body bumps the version automatically (see the
  // terms_content_bump_version trigger), which is what forces every
  // client to re-accept even if they signed within the last 30 days.
  const { error } = await supabase.from("terms_content").update({ body: parsed.data.body }).eq("id", true);

  if (error) return { error: "Couldn't save. Try again." };

  revalidatePath("/dashboard/terms");
  return { error: null };
}
