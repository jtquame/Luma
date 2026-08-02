import { z } from "zod";

export const coachingVideoSchema = z.object({
  title: z.string().trim().min(1, "Title is required"),
  description: z.string().trim().optional(),
  videoUrl: z.string().trim().min(1, "Video URL is required"),
  thumbnailUrl: z.string().trim().optional(),
});
export type CoachingVideoInput = z.infer<typeof coachingVideoSchema>;
