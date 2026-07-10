"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const schema = z.object({
  templateId: z.string().uuid(),
  frequency: z.enum(["daily", "weekly", "biweekly", "monthly"]),
});

export async function setCheckInPreference(
  input: z.infer<typeof schema>
): Promise<{ error: string | null }> {
  const parsed = schema.safeParse(input);
  if (!parsed.success) return { error: "Invalid input" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase.from("client_template_preferences").upsert({
    client_id: user.id,
    template_id: parsed.data.templateId,
    frequency: parsed.data.frequency,
  });

  if (error) return { error: "Couldn't save your preference. Try again." };

  revalidatePath("/check-in");
  revalidatePath("/home");
  return { error: null };
}
