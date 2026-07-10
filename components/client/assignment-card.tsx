"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { completeAssignment } from "@/app/(client)/skill-building-actions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Image as ImageIcon, Download } from "lucide-react";

interface Assignment {
  id: string;
  title: string;
  instructions: string;
  reflection_prompt: string | null;
  reflection_max_length: number | null;
  status: string;
  reflection_response: string | null;
  attachment_url?: string | null;
  attachment_name?: string | null;
  attachment_type?: string | null;
}

export function AssignmentCard({ assignment }: { assignment: Assignment }) {
  const router = useRouter();
  const [response, setResponse] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const isCompleted = assignment.status === "completed";
  const maxLength = assignment.reflection_max_length ?? 300;

  function handleComplete() {
    setError(null);
    startTransition(async () => {
      const result = await completeAssignment({
        assignmentId: assignment.id,
        reflectionResponse: response || undefined,
      });
      if (result.error) setError(result.error);
      else router.refresh();
    });
  }

  return (
    <Card>
      <div className="flex items-center gap-2 mb-1">
        <h3 className="font-display text-lg">{assignment.title}</h3>
        {isCompleted && (
          <span className="rounded-full bg-sage px-2 py-0.5 text-xs text-sage-foreground">
            Completed
          </span>
        )}
      </div>
      <p className="text-sm text-ink-muted mb-4">{assignment.instructions}</p>

      {assignment.attachment_url && (
        <a
          href={assignment.attachment_url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 rounded-lg border border-border bg-bg px-3.5 py-2.5 text-sm text-ink hover:border-primary/40 transition-colors mb-4 max-w-xs"
        >
          {assignment.attachment_type === "image" ? (
            <ImageIcon size={16} className="text-ink-muted shrink-0" />
          ) : (
            <FileText size={16} className="text-ink-muted shrink-0" />
          )}
          <span className="truncate flex-1">{assignment.attachment_name ?? "Attachment"}</span>
          <Download size={15} className="text-ink-muted shrink-0" />
        </a>
      )}

      {assignment.reflection_prompt && (
        <div className="mb-4">
          <p className="text-sm font-medium text-ink mb-2">{assignment.reflection_prompt}</p>
          {isCompleted ? (
            <p className="text-sm text-ink-muted italic">
              {assignment.reflection_response || "No response given."}
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
    </Card>
  );
}
