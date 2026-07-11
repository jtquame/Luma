"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createPathway } from "@/app/(therapist)/pathways-actions";
import { pathwaySchema, PATHWAY_CATEGORIES, type PathwayStepInput } from "@/lib/validations/pathways";
import { Card } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ImageUploader } from "./image-uploader";
import { Plus, Trash2, X } from "lucide-react";

function blankStep(): PathwayStepInput {
  return { title: "", content: "" };
}

export function PathwayBuilder({ onDone }: { onDone: () => void }) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<string>(PATHWAY_CATEGORIES[0]);
  const [customCategory, setCustomCategory] = useState("");
  const [description, setDescription] = useState("");
  const [coverImageUrl, setCoverImageUrl] = useState("");
  const [steps, setSteps] = useState<PathwayStepInput[]>([blankStep()]);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function updateStep(index: number, patch: Partial<PathwayStepInput>) {
    setSteps((s) => s.map((step, i) => (i === index ? { ...step, ...patch } : step)));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const effectiveCategory = category === "__custom__" ? customCategory : category;

    const parsed = pathwaySchema.safeParse({
      title,
      category: effectiveCategory,
      description,
      coverImageUrl,
      steps,
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Check the form for errors");
      return;
    }

    startTransition(async () => {
      const result = await createPathway(parsed.data);
      if (result.error) {
        setError(result.error);
      } else {
        router.refresh();
        onDone();
      }
    });
  }

  return (
    <Card className="mb-8">
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-display text-lg">New pathway</h2>
        <button onClick={onDone} className="text-ink-muted hover:text-ink" aria-label="Close">
          <X size={18} />
        </button>
      </div>

      <form onSubmit={handleSubmit} noValidate>
        <div className="mb-4">
          <Label htmlFor="ptitle">Title</Label>
          <Input
            id="ptitle"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Coping with a Breakup"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
          <div>
            <Label htmlFor="category">Category</Label>
            <select
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="h-11 w-full rounded-lg border border-border bg-surface px-3 text-sm"
            >
              {PATHWAY_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
              <option value="__custom__">Custom…</option>
            </select>
          </div>
          {category === "__custom__" && (
            <div>
              <Label htmlFor="customCategory">Custom category</Label>
              <Input
                id="customCategory"
                value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value)}
              />
            </div>
          )}
        </div>

        <div className="mb-4">
          <Label htmlFor="description">Description</Label>
          <textarea
            id="description"
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm"
            placeholder="What will clients get out of this pathway?"
          />
        </div>

        <div className="mb-6">
          <ImageUploader
            label="Cover image (optional)"
            value={coverImageUrl}
            onChange={setCoverImageUrl}
            folder="pathways"
          />
        </div>

        <div className="space-y-5 mb-5">
          {steps.map((step, index) => (
            <div key={index} className="rounded-lg border border-border p-4">
              <div className="flex items-start justify-between mb-3">
                <p className="eyebrow">Step {index + 1}</p>
                {steps.length > 1 && (
                  <button
                    type="button"
                    onClick={() => setSteps((s) => s.filter((_, i) => i !== index))}
                    className="text-ink-muted hover:text-danger"
                    aria-label="Remove step"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
              <div className="mb-3">
                <Label>Step title</Label>
                <Input
                  value={step.title}
                  onChange={(e) => updateStep(index, { title: e.target.value })}
                  placeholder="Understanding what you're feeling"
                />
              </div>
              <div className="mb-3">
                <Label>Content</Label>
                <textarea
                  rows={3}
                  value={step.content}
                  onChange={(e) => updateStep(index, { content: e.target.value })}
                  className="w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm"
                  placeholder="What should they read or do for this step?"
                />
              </div>
              <div>
                <Label>Reflection question (optional)</Label>
                <Input
                  value={step.reflectionPrompt ?? ""}
                  onChange={(e) => updateStep(index, { reflectionPrompt: e.target.value })}
                  placeholder="What came up for you while reading this?"
                />
              </div>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={() => setSteps((s) => [...s, blankStep()])}
          className="mb-6 flex items-center gap-1.5 text-sm text-accent hover:underline"
        >
          <Plus size={15} /> Add step
        </button>

        {error && (
          <div className="mb-4 rounded-lg bg-danger/10 px-3.5 py-2.5 text-sm text-danger">
            {error}
          </div>
        )}

        <Button type="submit" disabled={isPending}>
          {isPending ? "Saving…" : "Create pathway"}
        </Button>
      </form>
    </Card>
  );
}
