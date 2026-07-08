import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().trim().email("Enter a valid email address"),
  password: z.string().min(1, "Enter your password"),
});
export type LoginInput = z.infer<typeof loginSchema>;

// Matches NIST 800-63B guidance: length over complexity theater. No forced
// special-character rules — those push people toward predictable patterns.
export const setPasswordSchema = z
  .object({
    password: z.string().min(12, "Use at least 12 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });
export type SetPasswordInput = z.infer<typeof setPasswordSchema>;

export const inviteClientSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required"),
  lastName: z.string().trim().min(1, "Last name is required"),
  email: z.string().trim().email("Enter a valid email address"),
});
export type InviteClientInput = z.infer<typeof inviteClientSchema>;

export const joinSchema = z
  .object({
    accessCode: z.string().trim().min(1, "Enter the access code"),
    firstName: z.string().trim().min(1, "First name is required"),
    lastName: z.string().trim().min(1, "Last name is required"),
    email: z.string().trim().email("Enter a valid email address"),
    password: z.string().min(12, "Use at least 12 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });
export type JoinInput = z.infer<typeof joinSchema>;

export const requestResetSchema = z.object({
  email: z.string().trim().email("Enter a valid email address"),
});
export type RequestResetInput = z.infer<typeof requestResetSchema>;
