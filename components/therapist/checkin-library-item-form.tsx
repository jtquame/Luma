"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createLibraryCheckIn } from "@/app/(therapist)/templates-actions";
import { templateSchema, type QuestionInput } from "@/lib/validations/templates";
import { Card } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, X } from "lucide-react";

const QUESTION_TYPE_LABELS: Record<QuestionInput["type"], string> = {
  single_choice: "Single choice",
  multi_choice: "Checkboxes",
  scale: "Rating scale (1–5)",
  slider: "Slider",
  yes_no: "Yes / no",
  short_reflection: "Short reflection (optional text)",
};

function blankQuestion(): QuestionInput {
  return { type: "single_choice", label: "", isRequired: true, options: ["", ""] };
}

export function CheckInLibraryItemForm({ onDone }: { onDone: () => void }) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [frequency, setFrequency] = useState<"daily" | "weekly" | "biweekly" | "monthly">("daily");
  const [questions, setQuestions] = useState<QuestionInput[]>([blankQuestion()]);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function updateQuestion(index: number, patch: Partial<QuestionInput>) {
    setQuestions((qs) => qs.map((q, i) => (i === index ? { ...q, ...patch } : q)));
  }

  function updateOption(qIndex: number, oIndex: number, value: string) {
    setQuestions((qs) =>
      qs.map((q, i) => {
        if (i !== qIndex || !q.options) return q;
        const options = [...q.options];
        options[oIndex] = value;
        return { ...q, options };
      })
    );
  }

  function handleTypeChange(index: number, type: QuestionInput["type"]) {
    const defaults: Partial<QuestionInput> = { type };
    if (type === "single_choice" || type === "multi_choice") defaults.options = ["", ""];
    if (type === "scale") {
      defaults.min = 1;
      defaults.max = 5;
    }
    if (type === "slider") {
      defaults.min = 0;
      defaults.max = 100;
    }
    if (type === "short_reflection") defaults.maxLength = 250;
    updateQuestion(index, defaults);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const parsed = templateSchema.safeParse({
      kind: "check_in",
      title,
      description,
      frequency,
      questions,
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Check the form for errors");
      return;
    }

    startTransition(async () => {
      const result = await createLibraryCheckIn(parsed.data);
      if (result.error) setError(result.error);
      else {
        router.refresh();
        onDone();
      }
    });
  }

  return (
    <Card className="mb-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display text-lg">Create a check-in for your library</h3>
        <button onClick={onDone} className="text-ink-muted hover:text-ink" aria-label="Close">
          <X size={18} />
        </button>
      </div>

      <form onSubmit={handleSubmit} noValidate>
        <div className="mb-4">
          <Label htmlFor="ltitle">Title</Label>
          <Input id="ltitle" value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div className="mb-4">
          <Label htmlFor="ldesc">Description</Label>
          <Input id="ldesc" value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
        <div className="mb-5">
          <Label>Default frequency</Label>
          <div className="flex gap-2">
            {(["daily", "weekly", "biweekly", "monthly"] as const).map((f) => (
              <button
                type="button"
                key={f}
                onClick={() => setFrequency(f)}
                className={`rounded-lg px-3 py-1.5 text-sm border capitalize ${
                  frequency === f
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-border text-ink-muted"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-5 mb-5">
          {questions.map((q, qIndex) => (
            <div key={qIndex} className="rounded-lg border border-border p-4">
              <div className="flex flex-col sm:flex-row items-start gap-3 mb-3">
                <div className="flex-1 w-full">
                  <Label>Question</Label>
                  <Input
                    value={q.label}
                    onChange={(e) => updateQuestion(qIndex, { label: e.target.value })}
                  />
                </div>
                <div className="w-full sm:w-48">
                  <Label>Type</Label>
                  <select
                    value={q.type}
                    onChange={(e) =>
                      handleTypeChange(qIndex, e.target.value as QuestionInput["type"])
                    }
                    className="h-11 w-full rounded-lg border border-border bg-surface px-3 text-sm"
                  >
                    {Object.entries(QUESTION_TYPE_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
                {questions.length > 1 && (
                  <button
                    type="button"
                    onClick={() => setQuestions((qs) => qs.filter((_, i) => i !== qIndex))}
                    className="sm:mt-6 text-ink-muted hover:text-danger self-end sm:self-auto"
                    aria-label="Remove question"
                  >
                    <Trash2 size={17} />
                  </button>
                )}
              </div>

              {(q.type === "single_choice" || q.type === "multi_choice") && (
                <div className="space-y-2">
                  {(q.options ?? []).map((opt, oIndex) => (
                    <Input
                      key={oIndex}
                      value={opt}
                      onChange={(e) => updateOption(qIndex, oIndex, e.target.value)}
                      placeholder={`Option ${oIndex + 1}`}
                      className="h-9"
                    />
                  ))}
                  <button
                    type="button"
                    onClick={() =>
                      setQuestions((qs) =>
                        qs.map((qq, i) =>
                          i === qIndex ? { ...qq, options: [...(qq.options ?? []), ""] } : qq
                        )
                      )
                    }
                    className="text-sm text-accent hover:underline"
                  >
                    + Add option
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={() => setQuestions((qs) => [...qs, blankQuestion()])}
          className="mb-5 flex items-center gap-1.5 text-sm text-accent hover:underline"
        >
          <Plus size={15} /> Add question
        </button>

        {error && (
          <div className="mb-4 rounded-lg bg-danger/10 px-3.5 py-2.5 text-sm text-danger">
            {error}
          </div>
        )}

        <Button type="submit" disabled={isPending}>
          {isPending ? "Saving…" : "Save to library"}
        </Button>
      </form>
    </Card>
  );
}
