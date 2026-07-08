"use client";

import { useState, useTransition } from "react";
import { inviteClient } from "@/app/(therapist)/actions";
import { inviteClientSchema } from "@/lib/validations/auth";
import { Input, Label, FieldError } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { UserPlus, X } from "lucide-react";

export function InviteClientForm() {
  const [open, setOpen] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  function reset() {
    setFirstName("");
    setLastName("");
    setEmail("");
    setErrors({});
    setFormError(null);
    setSuccess(false);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    setSuccess(false);

    const parsed = inviteClientSchema.safeParse({ firstName, lastName, email });
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
      const result = await inviteClient(parsed.data);
      if (result.error) {
        setFormError(result.error);
      } else {
        setSuccess(true);
        setFirstName("");
        setLastName("");
        setEmail("");
      }
    });
  }

  if (!open) {
    return (
      <Button onClick={() => setOpen(true)}>
        <UserPlus size={16} strokeWidth={1.75} />
        Invite client
      </Button>
    );
  }

  return (
    <Card className="w-96">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display text-lg">Invite a client</h3>
        <button
          onClick={() => {
            setOpen(false);
            reset();
          }}
          className="text-ink-muted hover:text-ink"
          aria-label="Close"
        >
          <X size={18} />
        </button>
      </div>

      {success ? (
        <div>
          <p className="text-sm text-ink mb-4">
            Invitation sent. They'll get an email with a link to set up their
            account — it expires in 7 days.
          </p>
          <Button variant="secondary" onClick={reset} className="w-full">
            Invite another
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} noValidate>
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
              <Input
                id="lastName"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
              <FieldError>{errors.lastName}</FieldError>
            </div>
          </div>
          <div className="mb-4">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <FieldError>{errors.email}</FieldError>
          </div>
          {formError && (
            <div className="mb-4 rounded-lg bg-danger/10 px-3.5 py-2.5 text-sm text-danger">
              {formError}
            </div>
          )}
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? "Sending…" : "Send invitation"}
          </Button>
        </form>
      )}
    </Card>
  );
}
