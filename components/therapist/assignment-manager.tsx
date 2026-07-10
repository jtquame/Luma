"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createAssignment, deleteAssignment } from "@/app/(therapist)/assignments-actions";
import { assignmentSchema } from "@/lib/validations/assignments";
import { Card } from "@/components/ui/card";
import { Input, Label, FieldError } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FileUploader, type UploadedFile } from "./file-uploader";
import { Plus, Trash2, X } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface ClientOption {
  id: string;
  name: string;
}

interface Assignment {
  id: string;
  title: string;
  clientName: string;
  status: string;
  createdAt: string;
}

function AssignmentForm({ clients, onDone }: { clients: ClientOption[]; onDone: () => void }) {
  const router = useRouter();
  const [clientId, setClientId] = useState(clients[0]?.id ?? "");
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
    const parsed = assignmentSchema.safeParse({
      clientId,
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
      const result = await createAssignment(parsed.data);
      if (result.error) setError(result.error);
      else {
        router.refresh();
        onDone();
      }
    });
  }

  if (clients.length === 0) {
    return (
      <Card className="mb-6">
        <p className="text-sm text-ink-muted">
          Invite at least one client before assigning skill-building homework.
        </p>
      </Card>
    );
  }

  return (
    <Card className="mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display text-lg">New assignment</h3>
        <button onClick={onDone} aria-label="Close" className="text-ink-muted hover:text-ink">
          <X size={18} />
        </button>
      </div>
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <div>
          <Label htmlFor="client">Client</Label>
          <select
            id="client"
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
            className="h-11 w-full rounded-lg border border-border bg-surface px-3 text-sm"
          >
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label htmlFor="atitle">Title</Label>
          <Input
            id="atitle"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Practice grounding technique"
          />
        </div>
        <div>
          <Label htmlFor="instructions">Instructions</Label>
          <textarea
            id="instructions"
            rows={3}
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            className="w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm"
            placeholder="What should they do before your next session?"
          />
        </div>
        <FileUploader
          label="Attach a worksheet, doc, or photo (optional)"
          value={attachment}
          onChange={setAttachment}
          folder="assignments"
        />
        <div>
          <Label htmlFor="reflection">Reflection question (optional)</Label>
          <Input
            id="reflection"
            value={reflectionPrompt}
            onChange={(e) => setReflectionPrompt(e.target.value)}
            placeholder="What did you notice while practicing this?"
          />
        </div>
        {reflectionPrompt && (
          <div>
            <Label htmlFor="maxLength">Max response length (characters)</Label>
            <Input
              id="maxLength"
              type="number"
              value={reflectionMaxLength}
              onChange={(e) => setReflectionMaxLength(e.target.value)}
              className="w-28"
            />
          </div>
        )}
        {error && (
          <div className="rounded-lg bg-danger/10 px-3.5 py-2.5 text-sm text-danger">{error}</div>
        )}
        <Button type="submit" disabled={isPending}>
          {isPending ? "Assigning…" : "Assign"}
        </Button>
      </form>
    </Card>
  );
}

export function AssignmentManager({
  clients,
  assignments,
}: {
  clients: ClientOption[];
  assignments: Assignment[];
}) {
  const [showForm, setShowForm] = useState(false);
  const [isPending, startTransition] = useTransition();

  return (
    <div>
      <div className="flex justify-end mb-6">
        {!showForm && (
          <Button onClick={() => setShowForm(true)}>
            <Plus size={16} strokeWidth={1.75} /> New assignment
          </Button>
        )}
      </div>
      {showForm && <AssignmentForm clients={clients} onDone={() => setShowForm(false)} />}

      {assignments.length === 0 ? (
        <p className="text-sm text-ink-muted">No assignments yet.</p>
      ) : (
        <div className="space-y-3">
          {assignments.map((a) => (
            <Card key={a.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <p className="font-medium text-ink">
                  {a.title} <span className="text-ink-muted font-normal">— {a.clientName}</span>
                </p>
                <p className="eyebrow mt-1">
                  {a.status === "completed" ? "Completed" : "Assigned"}
                  {" · "}
                  {formatDistanceToNow(new Date(a.createdAt), { addSuffix: true })}
                </p>
              </div>
              <button
                disabled={isPending}
                onClick={() => {
                  if (confirm("Delete this assignment?")) startTransition(() => deleteAssignment(a.id));
                }}
                className="text-ink-muted hover:text-danger"
                aria-label="Delete assignment"
              >
                <Trash2 size={17} />
              </button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
