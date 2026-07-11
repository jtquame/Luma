"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setPathwayActive, deletePathway } from "@/app/(therapist)/pathways-actions";
import { PathwayBuilder } from "./pathway-builder";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";

interface Pathway {
  id: string;
  title: string;
  category: string;
  is_active: boolean;
  stepCount: number;
  enrollmentCount: number;
}

export function PathwayManager({ pathways }: { pathways: Pathway[] }) {
  const [showBuilder, setShowBuilder] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-ink-muted max-w-md">
          Self-serve, topic-based programs — clients browse and start whichever
          pathway they want. Steps unlock one at a time as they complete each one.
        </p>
        {!showBuilder && (
          <Button onClick={() => setShowBuilder(true)}>
            <Plus size={16} strokeWidth={1.75} /> New pathway
          </Button>
        )}
      </div>

      {showBuilder && <PathwayBuilder onDone={() => setShowBuilder(false)} />}

      {pathways.length === 0 ? (
        <p className="text-sm text-ink-muted">No pathways yet.</p>
      ) : (
        <div className="space-y-3">
          {pathways.map((p) => (
            <Card key={p.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-medium text-ink">{p.title}</p>
                  {!p.is_active && (
                    <span className="rounded-full bg-border px-2 py-0.5 text-xs text-ink-muted">
                      Archived
                    </span>
                  )}
                </div>
                <p className="eyebrow mt-1">
                  {p.category} · {p.stepCount} step{p.stepCount === 1 ? "" : "s"} ·{" "}
                  {p.enrollmentCount} client{p.enrollmentCount === 1 ? "" : "s"} started
                </p>
              </div>
              <div className="flex gap-2 flex-wrap">
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={isPending}
                  onClick={() =>
                    startTransition(async () => {
                      await setPathwayActive(p.id, !p.is_active);
                      router.refresh();
                    })
                  }
                >
                  {p.is_active ? "Archive" : "Reactivate"}
                </Button>
                <button
                  disabled={isPending}
                  onClick={() => {
                    if (confirm("Delete this pathway? This can't be undone."))
                      startTransition(() => deletePathway(p.id));
                  }}
                  className="text-ink-muted hover:text-danger p-2"
                  aria-label="Delete pathway"
                >
                  <Trash2 size={17} />
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
