"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { setPasswordSchema } from "@/lib/validations/auth";
import { Card } from "@/components/ui/card";
import { Input, Label, FieldError } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function ConfirmResetPage() {
  const router = useRouter();
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
      // This page is reached via the Supabase reset-password email link,
      // which already establishes a recovery session client-side — so we
      // just update the password directly through the browser client.
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
      if (error) {
        setFormError("Couldn't update your password. Request a new reset link.");
        return;
      }
      router.push("/login");
    });
  }

  return (
    <Card>
      <h2 className="font-display text-xl mb-1">Set a new password</h2>
      <p className="text-sm text-ink-muted mb-6">
        Choose something you haven't used before.
      </p>
      <form onSubmit={handleSubmit} noValidate>
        <div className="mb-4">
          <Label htmlFor="password">New password</Label>
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
          <Label htmlFor="confirmPassword">Confirm new password</Label>
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
          {isPending ? "Updating…" : "Update password"}
        </Button>
      </form>
    </Card>
  );
}
