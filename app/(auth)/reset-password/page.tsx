"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { requestPasswordReset } from "../actions";
import { requestResetSchema } from "@/lib/validations/auth";
import { Card } from "@/components/ui/card";
import { Input, Label, FieldError } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function ResetPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = requestResetSchema.safeParse({ email });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Enter a valid email");
      return;
    }
    setError(null);
    startTransition(async () => {
      await requestPasswordReset(parsed.data);
      setSent(true);
    });
  }

  if (sent) {
    return (
      <Card>
        <h2 className="font-display text-xl mb-2">Check your email</h2>
        <p className="text-sm text-ink-muted">
          If an account exists for {email}, a reset link is on its way.
        </p>
        <Link href="/login" className="mt-6 inline-block text-sm text-accent hover:underline">
          Back to sign in
        </Link>
      </Card>
    );
  }

  return (
    <Card>
      <h2 className="font-display text-xl mb-1">Reset your password</h2>
      <p className="text-sm text-ink-muted mb-6">
        We'll email you a link to set a new one.
      </p>
      <form onSubmit={handleSubmit} noValidate>
        <div className="mb-6">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <FieldError>{error ?? undefined}</FieldError>
        </div>
        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending ? "Sending…" : "Send reset link"}
        </Button>
      </form>
    </Card>
  );
}
