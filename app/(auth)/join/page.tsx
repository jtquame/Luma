"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { joinWithCode } from "../actions";
import { joinSchema } from "@/lib/validations/auth";
import { Card } from "@/components/ui/card";
import { Input, Label, FieldError } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function JoinPage() {
  const [accessCode, setAccessCode] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    const parsed = joinSchema.safeParse({
      accessCode,
      firstName,
      lastName,
      email,
      password,
      confirmPassword,
    });
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        fieldErrors[issue.path[0] as string] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }
    setErrors({});

    startTransition(async () => {
      const result = await joinWithCode(parsed.data);
      if (result?.error) setFormError(result.error);
    });
  }

  return (
    <Card>
      <h2 className="font-display text-xl mb-1">Join Luma</h2>
      <p className="text-sm text-ink-muted mb-6">
        Enter the access code your therapist gave you, then set up your account.
      </p>
      <form onSubmit={handleSubmit} noValidate>
        <div className="mb-5">
          <Label htmlFor="accessCode">Access code</Label>
          <Input
            id="accessCode"
            value={accessCode}
            onChange={(e) => setAccessCode(e.target.value)}
            autoComplete="off"
          />
          <FieldError>{errors.accessCode}</FieldError>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <Label htmlFor="firstName">First name</Label>
            <Input
              id="firstName"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
            />
            <FieldError>{errors.firstName}</FieldError>
          </div>
          <div>
            <Label htmlFor="lastName">Last name</Label>
            <Input id="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} />
            <FieldError>{errors.lastName}</FieldError>
          </div>
        </div>

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
      <p className="mt-6 text-center text-sm text-ink-muted">
        Already have an account? <Link href="/login" className="text-accent hover:underline">Sign in</Link>
      </p>
    </Card>
  );
}
