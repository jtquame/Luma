import { z } from "zod";

export const questionTypeSchema = z.enum([
  "single_choice",
  "multi_choice",
  "scale",
  "slider",
  "yes_no",
  "short_reflection",
]);

export const questionSchema = z
  .object({
    type: questionTypeSchema,
    label: z.string().trim().min(1, "Question text is required"),
    isRequired: z.boolean().default(true),
    options: z.array(z.string().trim().min(1)).optional(),
    min: z.number().optional(),
    max: z.number().optional(),
    maxLength: z.number().optional(),
  })
  .superRefine((q, ctx) => {
    if (["single_choice", "multi_choice"].includes(q.type)) {
      if (!q.options || q.options.length < 2) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Add at least two options",
          path: ["options"],
        });
      }
    }
    if (q.type === "short_reflection") {
      if (!q.maxLength || q.maxLength < 10 || q.maxLength > 500) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Set a max length between 10 and 500 characters",
          path: ["maxLength"],
        });
      }
    }
  });
export type QuestionInput = z.infer<typeof questionSchema>;

export const templateSchema = z.object({
  kind: z.enum(["check_in", "prompt"]),
  title: z.string().trim().min(1, "Title is required"),
  description: z.string().trim().max(300).optional(),
  frequency: z.enum(["daily", "weekly", "biweekly", "monthly"]).optional(),
  questions: z.array(questionSchema).min(1, "Add at least one question"),
});
export type TemplateInput = z.infer<typeof templateSchema>;

// Answer values vary by question type, so we validate loosely here and rely
// on the question's own config (min/max, max_length, option list) for the
// real constraint check, done server-side against the stored template.
export const answerValueSchema = z.union([
  z.string(),
  z.array(z.string()),
  z.number(),
  z.boolean(),
]);

export const submitResponseSchema = z.object({
  templateId: z.string().uuid(),
  answers: z.array(
    z.object({
      questionId: z.string().uuid(),
      value: answerValueSchema,
    })
  ),
});
export type SubmitResponseInput = z.infer<typeof submitResponseSchema>;
