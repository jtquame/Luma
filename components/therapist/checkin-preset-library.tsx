"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addPresetTemplate } from "@/app/(therapist)/templates-actions";
import { CHECKIN_PRESETS } from "@/lib/checkin-presets";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X, Check } from "lucide-react";

export function CheckInPresetLibrary({ onDone }: { onDone: () => void }) {
  const router = useRouter();
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleAdd(presetId: string) {
    setPendingId(presetId);
    startTransition(async () => {
      const result = await addPresetTemplate(presetId);
      if (!result.error) {
        setAddedIds((prev) => new Set(prev).add(presetId));
        router.refresh();
      }
      setPendingId(null);
    });
  }

  return (
    <Card className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="font-display text-lg">Check-in library</h2>
          <p className="text-sm text-ink-muted mt-0.5">
            Add ready-made check-ins — each one follows its cadence automatically
            once added, no further setup needed.
          </p>
        </div>
        <button onClick={onDone} className="text-ink-muted hover:text-ink" aria-label="Close">
          <X size={18} />
        </button>
      </div>

      <div className="space-y-3">
        {CHECKIN_PRESETS.map((preset) => {
          const added = addedIds.has(preset.id);
          return (
            <div
              key={preset.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border border-border px-4 py-3"
            >
              <div>
                <p className="font-medium text-ink text-sm">{preset.title}</p>
                <p className="text-sm text-ink-muted">{preset.description}</p>
                <p className="eyebrow mt-1 capitalize">
                  {preset.frequency} · {preset.questions.length} question
                  {preset.questions.length === 1 ? "" : "s"}
                </p>
              </div>
              {added ? (
                <span className="flex items-center gap-1.5 text-sm text-primary shrink-0">
                  <Check size={15} /> Added
                </span>
              ) : (
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={isPending && pendingId === preset.id}
                  onClick={() => handleAdd(preset.id)}
                  className="shrink-0"
                >
                  {isPending && pendingId === preset.id ? "Adding…" : "Add"}
                </Button>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
}
