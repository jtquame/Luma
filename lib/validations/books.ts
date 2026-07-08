import { z } from "zod";

const optionalUrl = z.string().trim().url().optional().or(z.literal(""));

export const bookSchema = z.object({
  title: z.string().trim().min(1, "Title is required"),
  author: z.string().trim().min(1, "Author is required"),
  coverImageUrl: optionalUrl,
  description: z.string().trim().optional(),
  whyRecommended: z.string().trim().optional(),
  whoItsFor: z.string().trim().optional(),
  favoriteChapters: z.string().trim().optional(),
  amazonUrl: optionalUrl,
  libraryUrl: optionalUrl,
  worksheetUrl: optionalUrl,
  status: z.enum(["recommended", "optional", "advanced"]),
  categories: z.array(z.string().trim().min(1)).default([]),
});
export type BookInput = z.infer<typeof bookSchema>;

export const BOOK_CATEGORIES = [
  "Anxiety",
  "Relationships",
  "Trauma",
  "Communication",
  "Self-esteem",
  "Parenting",
  "Mindfulness",
  "Stress",
  "Grief",
] as const;
