"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  addPresetTemplate,
  addLibraryCheckInToLive,
  deleteLibraryCheckIn,
} from "@/app/(therapist)/templates-actions";
import { CHECKIN_PRESETS } from "@/lib/checkin-presets";
import { CheckInLibraryItemForm } from "./checkin-library-item-form";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X, Check, Plus, Trash2 } from "lucide-react";

export interface CustomLibraryItem {
  id: string;
  title: string;
  description: string | null;
  frequency: string;
  questions: unknown;
}

export function CheckInPresetLibrary({
  onDone,
  customItems,
}: {
  onDone: () => void;
  customItems: CustomLibraryItem[];
}) {
  const router = useRouter();
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleAddPreset(presetId: string) {
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

  function handleAddCustom(itemId: string) {
    setPendingId(itemId);
    startTransition(async () => {
      const result = await addLibraryCheckInToLive(itemId);
      if (!result.error) {
        setAddedIds((prev) => new Set(prev).add(itemId));
        router.refresh();
      }
      setPendingId(null);
    });
  }

  function questionCount(questions: unknown): number {
    return Array.isArray(questions) ? questions.length : 0;
  }

  return (
    <Card className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="font-display text-lg">Check-in library</h2>
          <p className="text-sm text-ink-muted mt-0.5">
            Add ready-made check-ins, or build and save your own here to reuse
            later. Adding one makes it live — no further setup needed.
          </p>
        </div>
        <button onClick={onDone} className="text-ink-muted hover:text-ink" aria-label="Close">
          <X size={18} />
        </button>
      </div>

      {!showCreateForm && (
        <Button size="sm" variant="secondary" onClick={() => setShowCreateForm(true)} className="mb-4">
          <Plus size={15} /> Create your own
        </Button>
      )}
      {showCreateForm && <CheckInLibraryItemForm onDone={() => setShowCreateForm(false)} />}

      {customItems.length > 0 && (
        <div className="mb-6">
          <p className="eyebrow mb-2">Your saved check-ins</p>
          <div className="space-y-3">
            {customItems.map((item) => {
              const added = addedIds.has(item.id);
              return (
                <div
                  key={item.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border border-border px-4 py-3"
                >
                  <div>
                    <p className="font-medium text-ink text-sm">{item.title}</p>
                    {item.description && (
                      <p className="text-sm text-ink-muted">{item.description}</p>
                    )}
                    <p className="eyebrow mt-1 capitalize">
                      {item.frequency} · {questionCount(item.questions)} question
                      {questionCount(item.questions) === 1 ? "" : "s"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {added ? (
                      <span className="flex items-center gap-1.5 text-sm text-primary">
                        <Check size={15} /> Added
                      </span>
                    ) : (
                      <Button
                        size="sm"
                        variant="secondary"
                        disabled={isPending && pendingId === item.id}
                        onClick={() => handleAddCustom(item.id)}
                      >
                        {isPending && pendingId === item.id ? "Adding…" : "Add"}
                      </Button>
                    )}
                    <button
                      disabled={isPending}
                      onClick={() => {
                        if (confirm("Remove this from your library?"))
                          startTransition(() => deleteLibraryCheckIn(item.id));
                      }}
                      className="text-ink-muted hover:text-danger"
                      aria-label="Delete from library"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <p className="eyebrow mb-2">Starter templates</p>
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
                  onClick={() => handleAddPreset(preset.id)}
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
