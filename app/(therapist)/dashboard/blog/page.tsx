import { createClient } from "@/lib/supabase/server";
import { BlogManager } from "@/components/therapist/blog-manager";

export default async function TherapistBlogPage() {
  const supabase = await createClient();
  const { data: posts } = await supabase
    .from("blog_posts")
    .select("id, title, category, is_published, published_at")
    .order("created_at", { ascending: false });

  return (
    <div>
      <h1 className="font-display text-2xl mb-1">Blog</h1>
      <p className="text-sm text-ink-muted mb-8">Write and publish posts for your clients.</p>
      <BlogManager posts={posts ?? []} />
    </div>
  );
}
