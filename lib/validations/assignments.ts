import { z } from "zod";

export const assignmentSchema = z.object({
  clientId: z.string().uuid("Pick a client"),
  title: z.string().trim().min(1, "Title is required"),
  instructions: z.string().trim().min(1, "Add instructions"),
  reflectionPrompt: z.string().trim().optional(),
  reflectionMaxLength: z.number().int().min(10).max(1000).optional(),
  attachmentUrl: z.string().trim().optional(),
  attachmentName: z.string().trim().optional(),
  attachmentType: z.enum(["image", "document"]).optional(),
});
export type AssignmentInput = z.infer<typeof assignmentSchema>;

export const completeAssignmentSchema = z.object({
  assignmentId: z.string().uuid(),
  reflectionResponse: z.string().trim().optional(),
});
export type CompleteAssignmentInput = z.infer<typeof completeAssignmentSchema>;
