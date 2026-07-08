import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { ArrowLeft } from "lucide-react";

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: post } = await supabase
    .from("blog_posts")
    .select("title, body, category, published_at, cover_image_url")
    .eq("slug", slug)
    .eq("is_published", true)
    .single();

  if (!post) notFound();

  return (
    <article>
      <Link
        href="/blog"
        className="inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink mb-6"
      >
        <ArrowLeft size={15} /> Back to blog
      </Link>

      {post.category && <p className="eyebrow mb-2">{post.category}</p>}
      <h1 className="font-display text-3xl mb-2">{post.title}</h1>
      {post.published_at && (
        <p className="text-sm text-ink-muted mb-8">
          {format(new Date(post.published_at), "MMMM d, yyyy")}
        </p>
      )}

      {post.cover_image_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={post.cover_image_url}
          alt=""
          className="w-full rounded-2xl mb-8 object-cover"
        />
      )}

      <div className="prose prose-sm max-w-none text-ink whitespace-pre-wrap leading-relaxed">
        {post.body}
      </div>
    </article>
  );
}
