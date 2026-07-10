"use client";

import { useState } from "react";
import { BlogEditor } from "./blog-editor";
import { BlogPostRow } from "./blog-post-row";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface Post {
  id: string;
  title: string;
  excerpt: string | null;
  category: string | null;
  cover_image_url: string | null;
  body: string;
  is_published: boolean;
  published_at: string | null;
}

export function BlogManager({ posts }: { posts: Post[] }) {
  const [showEditor, setShowEditor] = useState(false);
  const [editingPost, setEditingPost] = useState<Post | null>(null);

  function handleDone() {
    setShowEditor(false);
    setEditingPost(null);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-ink-muted">Clients can't comment, post, or react.</p>
        {!showEditor && (
          <Button onClick={() => setShowEditor(true)}>
            <Plus size={16} strokeWidth={1.75} />
            New post
          </Button>
        )}
      </div>

      {showEditor && (
        <BlogEditor onDone={handleDone} existingPost={editingPost ?? undefined} />
      )}

      {posts.length === 0 ? (
        <p className="text-sm text-ink-muted">No posts yet.</p>
      ) : (
        <div className="space-y-3">
          {posts.map((p) => (
            <BlogPostRow
              key={p.id}
              id={p.id}
              title={p.title}
              category={p.category}
              isPublished={p.is_published}
              publishedAt={p.published_at}
              onEdit={() => {
                setEditingPost(p);
                setShowEditor(true);
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
