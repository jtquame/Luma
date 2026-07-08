import { z } from "zod";

export const blogPostSchema = z.object({
  title: z.string().trim().min(1, "Title is required"),
  excerpt: z.string().trim().max(240).optional(),
  body: z.string().trim().min(1, "Write something before publishing"),
  category: z.string().trim().optional(),
  coverImageUrl: z.string().trim().url().optional().or(z.literal("")),
  isPublished: z.boolean().default(false),
});
export type BlogPostInput = z.infer<typeof blogPostSchema>;

export function slugify(title: string) {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);
}
