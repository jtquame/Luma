"use client";

import { useState, useTransition } from "react";
import { createTemplate } from "@/app/(therapist)/templates-actions";
import { templateSchema, type QuestionInput } from "@/lib/validations/templates";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Label, FieldError } from "@/components/ui/input";
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

export function TemplateBuilder({ onDone }: { onDone: () => void }) {
  const [kind, setKind] = useState<"check_in" | "prompt">("check_in");
  const [frequency, setFrequency] = useState<"daily" | "weekly" | "biweekly" | "monthly">("daily");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
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

  function addOption(qIndex: number) {
    setQuestions((qs) =>
      qs.map((q, i) => (i === qIndex ? { ...q, options: [...(q.options ?? []), ""] } : q))
    );
  }

  function removeOption(qIndex: number, oIndex: number) {
    setQuestions((qs) =>
      qs.map((q, i) =>
        i === qIndex ? { ...q, options: q.options?.filter((_, oi) => oi !== oIndex) } : q
      )
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
      kind,
      title,
      description,
      frequency: kind === "check_in" ? frequency : undefined,
      questions,
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Check the form for errors");
      return;
    }

    startTransition(async () => {
      const result = await createTemplate(parsed.data);
      if (result.error) {
        setError(result.error);
      } else {
        onDone();
      }
    });
  }

  return (
    <Card className="mb-8">
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-display text-lg">New {kind === "check_in" ? "check-in" : "prompt"}</h2>
        <button onClick={onDone} className="text-ink-muted hover:text-ink" aria-label="Close">
          <X size={18} />
        </button>
      </div>

      <form onSubmit={handleSubmit} noValidate>
        <div className="flex gap-2 mb-4">
          {(["check_in", "prompt"] as const).map((k) => (
            <button
              type="button"
              key={k}
              onClick={() => setKind(k)}
              className={`rounded-lg px-3 py-1.5 text-sm border ${
                kind === k
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-border text-ink-muted"
              }`}
            >
              {k === "check_in" ? "Check-in" : "Prompt"}
            </button>
          ))}
        </div>

        <div className="mb-4">
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={kind === "check_in" ? "Daily check-in" : "Weekly reflection"}
          />
        </div>

        {kind === "check_in" && (
          <div className="mb-4">
            <Label>How often</Label>
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
        )}
        <div className="mb-6">
          <Label htmlFor="description">Description (optional)</Label>
          <Input
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
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
                    placeholder="How anxious have you felt this week?"
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
                    <div key={oIndex} className="flex items-center gap-2">
                      <Input
                        value={opt}
                        onChange={(e) => updateOption(qIndex, oIndex, e.target.value)}
                        placeholder={`Option ${oIndex + 1}`}
                        className="h-9"
                      />
                      {(q.options?.length ?? 0) > 2 && (
                        <button
                          type="button"
                          onClick={() => removeOption(qIndex, oIndex)}
                          className="text-ink-muted hover:text-danger"
                          aria-label="Remove option"
                        >
                          <X size={15} />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => addOption(qIndex)}
                    className="text-sm text-accent hover:underline"
                  >
                    + Add option
                  </button>
                </div>
              )}

              {(q.type === "scale" || q.type === "slider") && (
                <div className="flex gap-3">
                  <div>
                    <Label>Min</Label>
                    <Input
                      type="number"
                      value={q.min ?? 0}
                      onChange={(e) => updateQuestion(qIndex, { min: Number(e.target.value) })}
                      className="h-9 w-20"
                    />
                  </div>
                  <div>
                    <Label>Max</Label>
                    <Input
                      type="number"
                      value={q.max ?? 5}
                      onChange={(e) => updateQuestion(qIndex, { max: Number(e.target.value) })}
                      className="h-9 w-20"
                    />
                  </div>
                </div>
              )}

              {q.type === "short_reflection" && (
                <div>
                  <Label>Max characters</Label>
                  <Input
                    type="number"
                    value={q.maxLength ?? 250}
                    onChange={(e) =>
                      updateQuestion(qIndex, { maxLength: Number(e.target.value) })
                    }
                    className="h-9 w-24"
                  />
                </div>
              )}

              <label className="mt-3 flex items-center gap-2 text-sm text-ink-muted">
                <input
                  type="checkbox"
                  checked={q.isRequired}
                  onChange={(e) => updateQuestion(qIndex, { isRequired: e.target.checked })}
                />
                Required
              </label>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={() => setQuestions((qs) => [...qs, blankQuestion()])}
          className="mb-6 flex items-center gap-1.5 text-sm text-accent hover:underline"
        >
          <Plus size={15} /> Add question
        </button>

        {error && (
          <div className="mb-4 rounded-lg bg-danger/10 px-3.5 py-2.5 text-sm text-danger">
            {error}
          </div>
        )}

        <Button type="submit" disabled={isPending}>
          {isPending ? "Saving…" : "Save template"}
        </Button>
      </form>
    </Card>
  );
}
