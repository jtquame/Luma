"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateTerms } from "@/app/(therapist)/terms-actions";
import { termsContentSchema } from "@/lib/validations/terms";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function TermsEditor({ body, version }: { body: string; version: number }) {
  const router = useRouter();
  const [text, setText] = useState(body);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();

  const changed = text.trim() !== body.trim();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaved(false);
    const parsed = termsContentSchema.safeParse({ body: text });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Check the text");
      return;
    }
    startTransition(async () => {
      const result = await updateTerms(parsed.data);
      if (result.error) setError(result.error);
      else {
        setSaved(true);
        router.refresh();
      }
    });
  }

  return (
    <Card>
      <div className="flex items-center justify-between mb-1">
        <h2 className="font-display text-lg">Current terms</h2>
        <span className="eyebrow">Version {version}</span>
      </div>
      <p className="text-sm text-ink-muted mb-4">
        Clients must re-accept this every 30 days. Changing the text here bumps the
        version and forces everyone to re-accept immediately, even if they signed recently.
      </p>
      <form onSubmit={handleSubmit}>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={12}
          className="w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm mb-4"
        />
        {changed && (
          <div className="mb-4 rounded-lg bg-accent/10 px-3.5 py-2.5 text-sm text-ink">
            Saving this will require every client to re-accept before their next visit.
          </div>
        )}
        {error && (
          <div className="mb-4 rounded-lg bg-danger/10 px-3.5 py-2.5 text-sm text-danger">
            {error}
          </div>
        )}
        <Button type="submit" disabled={isPending || !changed}>
          {isPending ? "Saving…" : saved ? "Saved" : "Save changes"}
        </Button>
      </form>
    </Card>
  );
}
