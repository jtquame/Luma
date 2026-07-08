"use client";

import { useState, useTransition } from "react";
import { acceptInvitation } from "../actions";
import { setPasswordSchema } from "@/lib/validations/auth";
import { Input, Label, FieldError } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function AcceptInviteForm({ token, email }: { token: string; email: string }) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<{ password?: string; confirmPassword?: string }>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    const parsed = setPasswordSchema.safeParse({ password, confirmPassword });
    if (!parsed.success) {
      const fieldErrors: typeof errors = {};
      for (const issue of parsed.error.issues) {
        const field = issue.path[0] as "password" | "confirmPassword";
        fieldErrors[field] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }
    setErrors({});

    startTransition(async () => {
      const result = await acceptInvitation(token, parsed.data);
      if (result?.error) setFormError(result.error);
    });
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="mb-4">
        <Label>Email</Label>
        <Input value={email} disabled />
      </div>
      <div className="mb-4">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <FieldError>{errors.password}</FieldError>
      </div>
      <div className="mb-6">
        <Label htmlFor="confirmPassword">Confirm password</Label>
        <Input
          id="confirmPassword"
          type="password"
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />
        <FieldError>{errors.confirmPassword}</FieldError>
      </div>
      {formError && (
        <div className="mb-4 rounded-lg bg-danger/10 px-3.5 py-2.5 text-sm text-danger">
          {formError}
        </div>
      )}
      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? "Creating account…" : "Create account"}
      </Button>
    </form>
  );
}
