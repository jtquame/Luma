import { z } from "zod";

export const termsContentSchema = z.object({
  body: z.string().trim().min(1, "Terms text can't be empty"),
});
export type TermsContentInput = z.infer<typeof termsContentSchema>;
