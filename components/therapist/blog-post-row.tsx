"use client";

import { useTransition } from "react";
import { setBlogPostPublished, deleteBlogPost } from "@/app/(therapist)/blog-actions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatDistanceToNow } from "date-fns";

export function BlogPostRow({
  id,
  title,
  category,
  isPublished,
  publishedAt,
  onEdit,
}: {
  id: string;
  title: string;
  category: string | null;
  isPublished: boolean;
  publishedAt: string | null;
  onEdit: () => void;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <Card className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div>
        <div className="flex items-center gap-2">
          <p className="font-medium text-ink">{title}</p>
          {!isPublished && (
            <span className="rounded-full bg-border px-2 py-0.5 text-xs text-ink-muted">
              Draft
            </span>
          )}
        </div>
        <p className="eyebrow mt-1">
          {category ?? "Uncategorized"}
          {publishedAt &&
            ` · published ${formatDistanceToNow(new Date(publishedAt), { addSuffix: true })}`}
        </p>
      </div>
      <div className="flex gap-2 flex-wrap">
        <Button variant="ghost" size="sm" onClick={onEdit}>
          Edit
        </Button>
        <Button
          variant="ghost"
          size="sm"
          disabled={isPending}
          onClick={() => startTransition(() => setBlogPostPublished(id, !isPublished))}
        >
          {isPublished ? "Unpublish" : "Publish"}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          disabled={isPending}
          onClick={() => {
            if (confirm("Delete this post? This can't be undone.")) {
              startTransition(() => deleteBlogPost(id));
            }
          }}
        >
          Delete
        </Button>
      </div>
    </Card>
  );
}
