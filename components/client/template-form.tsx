"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { submitResponse, setResponseShared } from "@/app/(client)/actions";
import { QuestionField } from "./question-field";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { QuestionType, QuestionConfig, AnswerValue } from "@/lib/supabase/types";

interface Question {
  id: string;
  type: QuestionType;
  label: string;
  config: QuestionConfig;
  is_required: boolean;
}

export function TemplateForm({
  templateId,
  title,
  description,
  questions,
  headerExtra,
}: {
  templateId: string;
  title: string;
  description: string | null;
  questions: Question[];
  headerExtra?: React.ReactNode;
}) {
  const router = useRouter();
  const [answers, setAnswers] = useState<Record<string, AnswerValue>>({});
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [submittedResponseId, setSubmittedResponseId] = useState<string | null>(null);
  const [sharingChoiceMade, setSharingChoiceMade] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const missing = questions.find((q) => q.is_required && answers[q.id] === undefined);
    if (missing) {
      setError("Please answer every question.");
      return;
    }

    startTransition(async () => {
      const result = await submitResponse({
        templateId,
        answers: Object.entries(answers).map(([questionId, value]) => ({
          questionId,
          value,
        })),
      });
      if (result.error) {
        setError(result.error);
      } else {
        setDone(true);
        setSubmittedResponseId(result.responseId ?? null);
      }
    });
  }

  function handleShareChoice(shared: boolean) {
    if (!submittedResponseId) {
      setSharingChoiceMade(true);
      router.refresh();
      return;
    }
    startTransition(async () => {
      await setResponseShared(submittedResponseId, shared);
      setSharingChoiceMade(true);
      router.refresh();
    });
  }

  if (done) {
    if (!sharingChoiceMade) {
      return (
        <Card>
          <p className="font-medium text-ink mb-1">Thanks — that's saved.</p>
          <p className="text-sm text-ink-muted mb-4">
            Samara will see that you completed this either way. Want her to
            see your actual answers too, or keep those just for yourself?
          </p>
          <div className="flex gap-2">
            <Button size="sm" onClick={() => handleShareChoice(true)} disabled={isPending}>
              Share my answers
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => handleShareChoice(false)}
              disabled={isPending}
            >
              Keep answers private
            </Button>
          </div>
        </Card>
      );
    }

    return (
      <Card>
        <p className="font-medium text-ink mb-1">Got it.</p>
        <p className="text-sm text-ink-muted">Thanks for letting me know.</p>
      </Card>
    );
  }

  return (
    <Card>
      <h3 className="font-display text-lg mb-1">{title}</h3>
      {description && <p className="text-sm text-ink-muted mb-2">{description}</p>}
      {headerExtra && <div className="mb-4">{headerExtra}</div>}

      <form onSubmit={handleSubmit} noValidate className="space-y-6">
        {questions.map((q) => (
          <div key={q.id}>
            <p className="text-sm font-medium text-ink mb-2">
              {q.label}
              {!q.is_required && <span className="text-ink-muted font-normal"> (optional)</span>}
            </p>
            <QuestionField
              type={q.type}
              config={q.config}
              value={answers[q.id]}
              onChange={(value) => setAnswers((a) => ({ ...a, [q.id]: value }))}
            />
          </div>
        ))}

        {error && (
          <div className="rounded-lg bg-danger/10 px-3.5 py-2.5 text-sm text-danger">{error}</div>
        )}

        <Button type="submit" disabled={isPending}>
          {isPending ? "Submitting…" : "Submit"}
        </Button>
      </form>
    </Card>
  );
}
