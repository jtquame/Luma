"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createBlogPost } from "@/app/(therapist)/blog-actions";
import { blogPostSchema } from "@/lib/validations/blog";
import { Card } from "@/components/ui/card";
import { Input, Label, FieldError } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

export function BlogEditor({ onDone }: { onDone: () => void }) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [category, setCategory] = useState("");
  const [coverImageUrl, setCoverImageUrl] = useState("");
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(isPublished: boolean) {
    setError(null);
    const parsed = blogPostSchema.safeParse({
      title,
      excerpt,
      category,
      coverImageUrl,
      body,
      isPublished,
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Check the form for errors");
      return;
    }
    startTransition(async () => {
      const result = await createBlogPost(parsed.data);
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
        <h2 className="font-display text-lg">New post</h2>
        <button onClick={onDone} className="text-ink-muted hover:text-ink" aria-label="Close">
          <X size={18} />
        </button>
      </div>

      <div className="mb-4">
        <Label htmlFor="title">Title</Label>
        <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} />
      </div>
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div>
          <Label htmlFor="category">Category</Label>
          <Input
            id="category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="Anxiety, Relationships…"
          />
        </div>
        <div>
          <Label htmlFor="cover">Cover image URL (optional)</Label>
          <Input
            id="cover"
            value={coverImageUrl}
            onChange={(e) => setCoverImageUrl(e.target.value)}
          />
        </div>
      </div>
      <div className="mb-4">
        <Label htmlFor="excerpt">Excerpt (optional)</Label>
        <Input id="excerpt" value={excerpt} onChange={(e) => setExcerpt(e.target.value)} />
      </div>
      <div className="mb-6">
        <Label htmlFor="body">Post</Label>
        <textarea
          id="body"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={10}
          className="w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        />
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-danger/10 px-3.5 py-2.5 text-sm text-danger">
          {error}
        </div>
      )}

      <div className="flex gap-2">
        <Button onClick={() => handleSubmit(true)} disabled={isPending}>
          {isPending ? "Publishing…" : "Publish"}
        </Button>
        <Button variant="secondary" onClick={() => handleSubmit(false)} disabled={isPending}>
          Save as draft
        </Button>
      </div>
    </Card>
  );
}
