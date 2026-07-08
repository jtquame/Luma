"use client";

import { useTransition } from "react";
import { setTemplateActive } from "@/app/(therapist)/templates-actions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export function TemplateRow({
  id,
  title,
  description,
  isActive,
  questionCount,
  responseCount,
}: {
  id: string;
  title: string;
  description: string | null;
  isActive: boolean;
  questionCount: number;
  responseCount: number;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <Card className="flex items-center justify-between">
      <div>
        <div className="flex items-center gap-2">
          <p className="font-medium text-ink">{title}</p>
          {!isActive && (
            <span className="rounded-full bg-border px-2 py-0.5 text-xs text-ink-muted">
              Archived
            </span>
          )}
        </div>
        {description && <p className="text-sm text-ink-muted mt-0.5">{description}</p>}
        <p className="eyebrow mt-2">
          {questionCount} question{questionCount === 1 ? "" : "s"} · {responseCount} response
          {responseCount === 1 ? "" : "s"}
        </p>
      </div>
      <Button
        variant="ghost"
        size="sm"
        disabled={isPending}
        onClick={() => startTransition(() => setTemplateActive(id, !isActive))}
      >
        {isActive ? "Archive" : "Reactivate"}
      </Button>
    </Card>
  );
}
