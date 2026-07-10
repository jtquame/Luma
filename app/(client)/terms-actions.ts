"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function acceptTerms(): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: terms } = await supabase.from("terms_content").select("version").single();
  if (!terms) return { error: "Couldn't load terms. Try again." };

  const { error } = await supabase
    .from("terms_acceptances")
    .insert({ client_id: user.id, version: terms.version });

  if (error) return { error: "Couldn't save your acceptance. Try again." };

  redirect("/home");
}
