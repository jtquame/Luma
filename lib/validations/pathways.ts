import { z } from "zod";

export const pathwayStepSchema = z.object({
  title: z.string().trim().min(1, "Step title is required"),
  content: z.string().trim().min(1, "Add content for this step"),
  reflectionPrompt: z.string().trim().optional(),
  reflectionMaxLength: z.number().int().min(10).max(1000).optional(),
});
export type PathwayStepInput = z.infer<typeof pathwayStepSchema>;

export const pathwaySchema = z.object({
  title: z.string().trim().min(1, "Title is required"),
  category: z.string().trim().min(1, "Pick or enter a category"),
  description: z.string().trim().optional(),
  coverImageUrl: z.string().trim().optional(),
  steps: z.array(pathwayStepSchema).min(1, "Add at least one step"),
});
export type PathwayInput = z.infer<typeof pathwaySchema>;

export const PATHWAY_CATEGORIES = [
  "Anxiety",
  "Breakups",
  "Grief",
  "Self-esteem",
  "Stress",
  "Communication",
  "Boundaries",
  "Trauma",
] as const;

export const completeStepSchema = z.object({
  stepId: z.string().uuid(),
  reflectionResponse: z.string().trim().optional(),
});
export type CompleteStepInput = z.infer<typeof completeStepSchema>;
