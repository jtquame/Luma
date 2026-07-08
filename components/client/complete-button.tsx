"use client";

import { useTransition } from "react";
import { markWebinarComplete } from "@/app/(client)/webinars-actions";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

export function CompleteButton({ webinarId, isComplete }: { webinarId: string; isComplete: boolean }) {
  const [isPending, startTransition] = useTransition();

  if (isComplete) {
    return (
      <span className="flex items-center gap-1.5 text-sm text-primary">
        <Check size={15} /> Watched
      </span>
    );
  }

  return (
    <Button
      variant="secondary"
      size="sm"
      disabled={isPending}
      onClick={() => startTransition(() => markWebinarComplete(webinarId))}
    >
      Mark as watched
    </Button>
  );
}
