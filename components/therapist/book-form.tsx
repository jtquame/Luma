"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createBook } from "@/app/(therapist)/books-actions";
import { bookSchema, BOOK_CATEGORIES } from "@/lib/validations/books";
import { Card } from "@/components/ui/card";
import { Input, Label, FieldError } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ImageUploader } from "./image-uploader";
import { X } from "lucide-react";

export function BookForm({ onDone }: { onDone: () => void }) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [coverImageUrl, setCoverImageUrl] = useState("");
  const [description, setDescription] = useState("");
  const [whyRecommended, setWhyRecommended] = useState("");
  const [whoItsFor, setWhoItsFor] = useState("");
  const [amazonUrl, setAmazonUrl] = useState("");
  const [status, setStatus] = useState<"recommended" | "optional" | "advanced">("recommended");
  const [categories, setCategories] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function toggleCategory(cat: string) {
    setCategories((cs) => (cs.includes(cat) ? cs.filter((c) => c !== cat) : [...cs, cat]));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const parsed = bookSchema.safeParse({
      title,
      author,
      coverImageUrl,
      description,
      whyRecommended,
      whoItsFor,
      amazonUrl,
      status,
      categories,
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Check the form for errors");
      return;
    }

    startTransition(async () => {
      const result = await createBook(parsed.data);
      if (result.error) {
        setError(result.error);
      } else {
        router.refresh();
        onDone();
      }
    });
  }

  return (
    <Card className="mb-8">
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-display text-lg">Add a book</h2>
        <button onClick={onDone} className="text-ink-muted hover:text-ink" aria-label="Close">
          <X size={18} />
        </button>
      </div>

      <form onSubmit={handleSubmit} noValidate>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
          <div>
            <Label htmlFor="title">Title</Label>
            <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="author">Author</Label>
            <Input id="author" value={author} onChange={(e) => setAuthor(e.target.value)} />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
          <ImageUploader
            label="Cover image"
            value={coverImageUrl}
            onChange={setCoverImageUrl}
            folder="books"
          />
          <div>
            <Label htmlFor="amazon">Amazon link</Label>
            <Input id="amazon" value={amazonUrl} onChange={(e) => setAmazonUrl(e.target.value)} />
          </div>
        </div>

        <div className="mb-4">
          <Label htmlFor="description">Description</Label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className="w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm"
          />
        </div>
        <div className="mb-4">
          <Label htmlFor="why">Why I recommend this</Label>
          <textarea
            id="why"
            value={whyRecommended}
            onChange={(e) => setWhyRecommended(e.target.value)}
            rows={2}
            className="w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm"
          />
        </div>
        <div className="mb-4">
          <Label htmlFor="whoFor">Who this is for</Label>
          <Input id="whoFor" value={whoItsFor} onChange={(e) => setWhoItsFor(e.target.value)} />
        </div>

        <div className="mb-4">
          <Label>Status</Label>
          <div className="flex gap-2">
            {(["recommended", "optional", "advanced"] as const).map((s) => (
              <button
                type="button"
                key={s}
                onClick={() => setStatus(s)}
                className={`rounded-lg px-3 py-1.5 text-sm border capitalize ${
                  status === s
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-border text-ink-muted"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-6">
          <Label>Categories</Label>
          <div className="flex flex-wrap gap-2">
            {BOOK_CATEGORIES.map((cat) => (
              <button
                type="button"
                key={cat}
                onClick={() => toggleCategory(cat)}
                className={`rounded-full px-3 py-1 text-xs border ${
                  categories.includes(cat)
                    ? "bg-sage text-sage-foreground border-sage"
                    : "border-border text-ink-muted"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-danger/10 px-3.5 py-2.5 text-sm text-danger">
            {error}
          </div>
        )}

        <Button type="submit" disabled={isPending}>
          {isPending ? "Saving…" : "Add to library"}
        </Button>
      </form>
    </Card>
  );
}
