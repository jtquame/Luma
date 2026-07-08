import { z } from "zod";

export const settingsSchema = z.object({
  practiceName: z.string().trim().min(1, "Practice name is required"),
  welcomeMessage: z.string().trim().max(200).optional(),
  sessionTimeoutMinutes: z.number().int().min(5).max(240),
});
export type SettingsInput = z.infer<typeof settingsSchema>;
