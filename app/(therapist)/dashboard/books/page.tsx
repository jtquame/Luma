import { createClient } from "@/lib/supabase/server";
import { BookManager } from "@/components/therapist/book-manager";

export default async function TherapistBooksPage() {
  const supabase = await createClient();
  const { data: books } = await supabase
    .from("books")
    .select("id, title, author, status, categories")
    .order("created_at", { ascending: false });

  return (
    <div>
      <h1 className="font-display text-2xl mb-1">Book library</h1>
      <p className="text-sm text-ink-muted mb-8">Curate book recommendations by category.</p>
      <BookManager books={books ?? []} />
    </div>
  );
}
