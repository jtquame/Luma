import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import Link from "next/link";
import { format } from "date-fns";

export default async function ClientBlogPage() {
  const supabase = await createClient();
  const { data: posts } = await supabase
    .from("blog_posts")
    .select("id, title, slug, excerpt, category, published_at")
    .eq("is_published", true)
    .order("published_at", { ascending: false });

  return (
    <div>
      <h1 className="font-display text-2xl mb-8">Blog</h1>

      {!posts || posts.length === 0 ? (
        <Card>
          <p className="text-sm text-ink-muted">Nothing published yet — check back soon.</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <Link key={post.id} href={`/blog/${post.slug}`}>
              <Card className="hover:border-primary/40 transition-colors">
                {post.category && <p className="eyebrow mb-2">{post.category}</p>}
                <h2 className="font-display text-lg mb-1">{post.title}</h2>
                {post.excerpt && (
                  <p className="text-sm text-ink-muted mb-2">{post.excerpt}</p>
                )}
                {post.published_at && (
                  <p className="text-xs text-ink-muted">
                    {format(new Date(post.published_at), "MMMM d, yyyy")}
                  </p>
                )}
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
