import { z } from "zod";

const optionalUrl = z.string().trim().url().optional().or(z.literal(""));

export const currentlyReadingSchema = z.object({
  bookTitle: z.string().trim().min(1, "Add a book title"),
  author: z.string().trim().optional(),
  coverImageUrl: optionalUrl,
  progressNote: z.string().trim().max(120).optional(),
  whyReading: z.string().trim().optional(),
  learningNote: z.string().trim().optional(),
  favoriteQuote: z.string().trim().max(400).optional(),
  recommendedChapter: z.string().trim().optional(),
});
export type CurrentlyReadingInput = z.infer<typeof currentlyReadingSchema>;

export const webinarSchema = z.object({
  title: z.string().trim().min(1, "Title is required"),
  description: z.string().trim().optional(),
  speaker: z.string().trim().optional(),
  videoUrl: optionalUrl,
  thumbnailUrl: optionalUrl,
  lengthMinutes: z.number().int().positive().optional(),
  slidesUrl: optionalUrl,
  worksheetUrl: optionalUrl,
  scheduledAt: z.string().optional(),
  registrationUrl: optionalUrl,
});
export type WebinarInput = z.infer<typeof webinarSchema>;

export const supportGroupSchema = z.object({
  title: z.string().trim().min(1, "Title is required"),
  description: z.string().trim().optional(),
  whoShouldAttend: z.string().trim().optional(),
  meetsAt: z.string().optional(),
  location: z.string().trim().optional(),
  virtualLink: optionalUrl,
  isRecurring: z.boolean().default(false),
});
export type SupportGroupInput = z.infer<typeof supportGroupSchema>;

export const announcementSchema = z.object({
  title: z.string().trim().min(1, "Title is required"),
  body: z.string().trim().min(1, "Write something"),
  expiresAt: z.string().optional(),
});
export type AnnouncementInput = z.infer<typeof announcementSchema>;
