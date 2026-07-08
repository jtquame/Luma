import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";

const STATUS_LABEL: Record<string, string> = {
  recommended: "Recommended",
  optional: "Optional",
  advanced: "Advanced",
};

export default async function ClientBooksPage() {
  const supabase = await createClient();
  const { data: books } = await supabase
    .from("books")
    .select(
      "id, title, author, description, why_recommended, who_its_for, amazon_url, worksheet_url, status, categories, cover_image_url"
    )
    .order("created_at", { ascending: false });

  return (
    <div>
      <h1 className="font-display text-2xl mb-8">Book library</h1>

      {!books || books.length === 0 ? (
        <Card>
          <p className="text-sm text-ink-muted">No books shared yet.</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {books.map((book) => (
            <Card key={book.id} className="flex gap-4">
              {book.cover_image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={book.cover_image_url}
                  alt=""
                  className="w-16 h-24 object-cover rounded-lg shrink-0"
                />
              ) : (
                <div className="w-16 h-24 rounded-lg bg-sage/40 shrink-0" />
              )}
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="rounded-full bg-sage px-2 py-0.5 text-xs text-sage-foreground">
                    {STATUS_LABEL[book.status]}
                  </span>
                  {book.categories.map((c) => (
                    <span key={c} className="eyebrow">
                      {c}
                    </span>
                  ))}
                </div>
                <h2 className="font-display text-lg">{book.title}</h2>
                <p className="text-sm text-ink-muted mb-2">{book.author}</p>
                {book.why_recommended && (
                  <p className="text-sm text-ink mb-2">"{book.why_recommended}" — Samara</p>
                )}
                {book.amazon_url && (
                  <a
                    href={book.amazon_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-accent hover:underline"
                  >
                    View on Amazon
                  </a>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
