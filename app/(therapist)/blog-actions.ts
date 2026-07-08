"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { blogPostSchema, slugify, type BlogPostInput } from "@/lib/validations/blog";

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

export async function createBlogPost(input: BlogPostInput): Promise<ActionResult> {
  const parsed = blogPostSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const { supabase, user } = await requireTherapist();

  let slug = slugify(parsed.data.title);
  const { data: existing } = await supabase.from("blog_posts").select("id").eq("slug", slug);
  if (existing && existing.length > 0) slug = `${slug}-${Date.now().toString(36)}`;

  const { error } = await supabase.from("blog_posts").insert({
    title: parsed.data.title,
    slug,
    excerpt: parsed.data.excerpt || null,
    body: parsed.data.body,
    category: parsed.data.category || null,
    cover_image_url: parsed.data.coverImageUrl || null,
    is_published: parsed.data.isPublished,
    published_at: parsed.data.isPublished ? new Date().toISOString() : null,
    created_by: user.id,
  });

  if (error) return { error: "Couldn't save the post. Try again." };

  await supabase.from("audit_log").insert({
    actor_id: user.id,
    action: parsed.data.isPublished ? "blog_post.published" : "blog_post.drafted",
    target_type: "blog_post",
    metadata: { title: parsed.data.title },
  });

  revalidatePath("/dashboard/blog");
  revalidatePath("/blog");
  return { error: null };
}

export async function setBlogPostPublished(
  postId: string,
  isPublished: boolean
): Promise<ActionResult> {
  const { supabase } = await requireTherapist();

  const { error } = await supabase
    .from("blog_posts")
    .update({
      is_published: isPublished,
      published_at: isPublished ? new Date().toISOString() : null,
    })
    .eq("id", postId);

  if (error) return { error: "Couldn't update the post." };

  revalidatePath("/dashboard/blog");
  revalidatePath("/blog");
  return { error: null };
}

export async function deleteBlogPost(postId: string): Promise<ActionResult> {
  const { supabase } = await requireTherapist();
  const { error } = await supabase.from("blog_posts").delete().eq("id", postId);
  if (error) return { error: "Couldn't delete the post." };

  revalidatePath("/dashboard/blog");
  revalidatePath("/blog");
  return { error: null };
}
