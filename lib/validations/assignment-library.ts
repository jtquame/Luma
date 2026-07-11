import { z } from "zod";

export const assignmentTemplateSchema = z.object({
  title: z.string().trim().min(1, "Title is required"),
  instructions: z.string().trim().min(1, "Add instructions"),
  reflectionPrompt: z.string().trim().optional(),
  reflectionMaxLength: z.number().int().min(10).max(1000).optional(),
  attachmentUrl: z.string().trim().optional(),
  attachmentName: z.string().trim().optional(),
  attachmentType: z.enum(["image", "document"]).optional(),
});
export type AssignmentTemplateInput = z.infer<typeof assignmentTemplateSchema>;
