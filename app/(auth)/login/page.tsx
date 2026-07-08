"use client";

import { useState, useTransition } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { login } from "../actions";
import { loginSchema } from "@/lib/validations/auth";
import { Card } from "@/components/ui/card";
import { Input, Label, FieldError } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  const searchParams = useSearchParams();
  const deactivated = searchParams.get("deactivated");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    const parsed = loginSchema.safeParse({ email, password });
    if (!parsed.success) {
      const fieldErrors: typeof errors = {};
      for (const issue of parsed.error.issues) {
        const field = issue.path[0] as "email" | "password";
        fieldErrors[field] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }
    setErrors({});

    startTransition(async () => {
      const result = await login(parsed.data);
      if (result?.error) setFormError(result.error);
    });
  }

  return (
    <Card>
      {deactivated && (
        <div className="mb-4 rounded-lg bg-danger/10 px-3.5 py-2.5 text-sm text-danger">
          That account has been deactivated.
        </div>
      )}
      {formError && (
        <div className="mb-4 rounded-lg bg-danger/10 px-3.5 py-2.5 text-sm text-danger">
          {formError}
        </div>
      )}
      <form onSubmit={handleSubmit} noValidate>
        <div className="mb-4">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <FieldError>{errors.email}</FieldError>
        </div>
        <div className="mb-6">
          <div className="flex items-center justify-between mb-1.5">
            <Label htmlFor="password" className="mb-0">
              Password
            </Label>
            <Link href="/reset-password" className="text-sm text-accent hover:underline">
              Forgot password?
            </Link>
          </div>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <FieldError>{errors.password}</FieldError>
        </div>
        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending ? "Signing in…" : "Sign in"}
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-ink-muted">
        New client?{" "}
        <Link href="/join" className="text-accent hover:underline">
          Join with your access code
        </Link>
      </p>
    </Card>
  );
}
