"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { bookSchema, type BookInput } from "@/lib/validations/books";

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

export async function createBook(input: BookInput): Promise<ActionResult> {
  const parsed = bookSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const { supabase, user } = await requireTherapist();

  const { error } = await supabase.from("books").insert({
    title: parsed.data.title,
    author: parsed.data.author,
    cover_image_url: parsed.data.coverImageUrl || null,
    description: parsed.data.description || null,
    why_recommended: parsed.data.whyRecommended || null,
    who_its_for: parsed.data.whoItsFor || null,
    favorite_chapters: parsed.data.favoriteChapters || null,
    amazon_url: parsed.data.amazonUrl || null,
    library_url: parsed.data.libraryUrl || null,
    worksheet_url: parsed.data.worksheetUrl || null,
    status: parsed.data.status,
    categories: parsed.data.categories,
    created_by: user.id,
  });

  if (error) return { error: "Couldn't save the book. Try again." };

  revalidatePath("/dashboard/books");
  revalidatePath("/books");
  return { error: null };
}

export async function deleteBook(bookId: string): Promise<ActionResult> {
  const { supabase } = await requireTherapist();
  const { error } = await supabase.from("books").delete().eq("id", bookId);
  if (error) return { error: "Couldn't delete the book." };

  revalidatePath("/dashboard/books");
  revalidatePath("/books");
  return { error: null };
}
