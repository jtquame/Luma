"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { completeStep } from "@/app/(client)/skill-building-actions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Lock } from "lucide-react";

interface Step {
  id: string;
  position: number;
  title: string;
  content: string;
  reflection_prompt: string | null;
  reflection_max_length: number | null;
}

interface Completion {
  step_id: string;
  reflection_response: string | null;
}

export function PathwayStepList({ steps, completions }: { steps: Step[]; completions: Completion[] }) {
  const router = useRouter();
  const completedIds = new Set(completions.map((c) => c.step_id));
  const firstIncompleteIndex = steps.findIndex((s) => !completedIds.has(s.id));

  return (
    <div className="space-y-4">
      {steps.map((step, index) => {
        const isCompleted = completedIds.has(step.id);
        const isCurrent = index === firstIncompleteIndex;
        const isLocked = !isCompleted && !isCurrent;
        const completion = completions.find((c) => c.step_id === step.id);

        return (
          <StepCard
            key={step.id}
            step={step}
            index={index}
            isCompleted={isCompleted}
            isCurrent={isCurrent}
            isLocked={isLocked}
            savedResponse={completion?.reflection_response ?? null}
            onCompleted={() => router.refresh()}
          />
        );
      })}
    </div>
  );
}

function StepCard({
  step,
  index,
  isCompleted,
  isCurrent,
  isLocked,
  savedResponse,
  onCompleted,
}: {
  step: Step;
  index: number;
  isCompleted: boolean;
  isCurrent: boolean;
  isLocked: boolean;
  savedResponse: string | null;
  onCompleted: () => void;
}) {
  const [response, setResponse] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const maxLength = step.reflection_max_length ?? 300;

  function handleComplete() {
    setError(null);
    startTransition(async () => {
      const result = await completeStep({
        stepId: step.id,
        reflectionResponse: response || undefined,
      });
      if (result.error) setError(result.error);
      else onCompleted();
    });
  }

  return (
    <Card className={isLocked ? "opacity-50" : ""}>
      <div className="flex items-center gap-2 mb-2">
        <span
          className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium shrink-0 ${
            isCompleted
              ? "bg-primary text-primary-foreground"
              : isCurrent
                ? "border border-primary text-primary"
                : "bg-border text-ink-muted"
          }`}
        >
          {isCompleted ? <Check size={13} /> : isLocked ? <Lock size={11} /> : index + 1}
        </span>
        <h3 className="font-display text-lg">{step.title}</h3>
      </div>

      {isLocked ? (
        <p className="text-sm text-ink-muted ml-8">Complete the earlier steps to unlock this.</p>
      ) : (
        <div className="ml-8">
          <p className="text-sm text-ink whitespace-pre-wrap mb-4">{step.content}</p>

          {step.reflection_prompt && (
            <div className="mb-4">
              <p className="text-sm font-medium text-ink mb-2">{step.reflection_prompt}</p>
              {isCompleted ? (
                <p className="text-sm text-ink-muted italic">
                  {savedResponse || "No response given."}
                </p>
              ) : (
                <div>
                  <textarea
                    value={response}
                    maxLength={maxLength}
                    onChange={(e) => setResponse(e.target.value)}
                    rows={3}
                    className="w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm"
                  />
                  <p className="text-xs text-ink-muted mt-1 text-right">
                    {response.length}/{maxLength}
                  </p>
                </div>
              )}
            </div>
          )}

          {error && <p className="text-sm text-danger mb-3">{error}</p>}

          {!isCompleted && (
            <Button size="sm" onClick={handleComplete} disabled={isPending}>
              {isPending ? "Saving…" : "Mark complete"}
            </Button>
          )}
        </div>
      )}
    </Card>
  );
}
