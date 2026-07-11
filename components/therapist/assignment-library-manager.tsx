"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  createAssignmentTemplate,
  deleteAssignmentTemplate,
} from "@/app/(therapist)/assignment-library-actions";
import { assignmentTemplateSchema } from "@/lib/validations/assignment-library";
import { Card } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FileUploader, type UploadedFile } from "./file-uploader";
import { Plus, Trash2, X, FolderOpen } from "lucide-react";

export interface LibraryTemplate {
  id: string;
  title: string;
  instructions: string;
  reflection_prompt: string | null;
  reflection_max_length: number | null;
  attachment_url: string | null;
  attachment_name: string | null;
  attachment_type: string | null;
}

function TemplateForm({ onDone }: { onDone: () => void }) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [instructions, setInstructions] = useState("");
  const [reflectionPrompt, setReflectionPrompt] = useState("");
  const [reflectionMaxLength, setReflectionMaxLength] = useState("300");
  const [attachment, setAttachment] = useState<UploadedFile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const parsed = assignmentTemplateSchema.safeParse({
      title,
      instructions,
      reflectionPrompt,
      reflectionMaxLength: reflectionPrompt ? Number(reflectionMaxLength) : undefined,
      attachmentUrl: attachment?.url,
      attachmentName: attachment?.name,
      attachmentType: attachment?.type,
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Check the form");
      return;
    }
    startTransition(async () => {
      const result = await createAssignmentTemplate(parsed.data);
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
        <h3 className="font-display text-lg">New library item</h3>
        <button onClick={onDone} aria-label="Close" className="text-ink-muted hover:text-ink">
          <X size={18} />
        </button>
      </div>
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <div>
          <Label htmlFor="ltitle">Title</Label>
          <Input
            id="ltitle"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Grounding technique practice"
          />
        </div>
        <div>
          <Label htmlFor="linstructions">Instructions</Label>
          <textarea
            id="linstructions"
            rows={3}
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            className="w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm"
          />
        </div>
        <div>
          <Label htmlFor="lreflection">Reflection question (optional)</Label>
          <Input
            id="lreflection"
            value={reflectionPrompt}
            onChange={(e) => setReflectionPrompt(e.target.value)}
          />
        </div>
        <FileUploader
          label="Attach a worksheet, doc, or photo (optional)"
          value={attachment}
          onChange={setAttachment}
          folder="assignment-library"
        />
        {error && (
          <div className="rounded-lg bg-danger/10 px-3.5 py-2.5 text-sm text-danger">{error}</div>
        )}
        <Button type="submit" disabled={isPending}>
          {isPending ? "Saving…" : "Save to library"}
        </Button>
      </form>
    </Card>
  );
}

export function AssignmentLibraryManager({ templates }: { templates: LibraryTemplate[] }) {
  const [open, setOpen] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [isPending, startTransition] = useTransition();

  return (
    <Card className="mb-8">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center justify-between w-full text-left"
      >
        <div className="flex items-center gap-2">
          <FolderOpen size={18} className="text-ink-muted" />
          <div>
            <h2 className="font-display text-lg">Assignment library</h2>
            <p className="text-sm text-ink-muted">
              Save reusable assignments here — typing a saved title when assigning
              autofills the rest.
            </p>
          </div>
        </div>
        <span className="eyebrow shrink-0">
          {templates.length} item{templates.length === 1 ? "" : "s"}
        </span>
      </button>

      {open && (
        <div className="mt-5">
          {!showForm && (
            <Button size="sm" onClick={() => setShowForm(true)} className="mb-4">
              <Plus size={15} /> Add to library
            </Button>
          )}
          {showForm && <TemplateForm onDone={() => setShowForm(false)} />}

          {templates.length === 0 ? (
            <p className="text-sm text-ink-muted">Nothing saved yet.</p>
          ) : (
            <div className="space-y-2">
              {templates.map((t) => (
                <div
                  key={t.id}
                  className="flex items-center justify-between rounded-lg border border-border px-3.5 py-2.5"
                >
                  <p className="text-sm text-ink">{t.title}</p>
                  <button
                    disabled={isPending}
                    onClick={() => {
                      if (confirm("Remove this from the library?"))
                        startTransition(() => deleteAssignmentTemplate(t.id));
                    }}
                    className="text-ink-muted hover:text-danger"
                    aria-label="Delete library item"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
