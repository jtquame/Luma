"use client";

import { useState, useTransition } from "react";
import { deleteTemplate } from "@/app/(therapist)/templates-actions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CheckInAssignmentPanel } from "./checkin-assignment-panel";
import { Users, Trash2 } from "lucide-react";

interface ClientOption {
  id: string;
  name: string;
}

export function TemplateRow({
  id,
  title,
  description,
  questionCount,
  responseCount,
  kind,
  clients,
  assignedClientIds,
}: {
  id: string;
  title: string;
  description: string | null;
  questionCount: number;
  responseCount: number;
  kind: "check_in" | "prompt";
  clients?: ClientOption[];
  assignedClientIds?: string[];
}) {
  const [isPending, startTransition] = useTransition();
  const [showAssign, setShowAssign] = useState(false);

  return (
    <Card>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <p className="font-medium text-ink">{title}</p>
          {description && <p className="text-sm text-ink-muted mt-0.5">{description}</p>}
          <p className="eyebrow mt-2">
            {questionCount} question{questionCount === 1 ? "" : "s"} · {responseCount} response
            {responseCount === 1 ? "" : "s"}
            {kind === "check_in" && ` · ${assignedClientIds?.length ?? 0} client${
              assignedClientIds?.length === 1 ? "" : "s"
            } assigned`}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {kind === "check_in" && (
            <Button variant="ghost" size="sm" onClick={() => setShowAssign((s) => !s)}>
              <Users size={14} /> {showAssign ? "Hide" : "Assign clients"}
            </Button>
          )}
          <button
            disabled={isPending}
            onClick={() => {
              if (confirm(`Delete "${title}"? This can't be undone.`)) {
                startTransition(() => deleteTemplate(id));
              }
            }}
            className="text-ink-muted hover:text-danger p-2"
            aria-label="Delete"
          >
            <Trash2 size={17} />
          </button>
        </div>
      </div>

      {showAssign && kind === "check_in" && (
        <div className="mt-4 pt-4 border-t border-border">
          <CheckInAssignmentPanel
            templateId={id}
            clients={clients ?? []}
            assignedClientIds={assignedClientIds ?? []}
          />
        </div>
      )}
    </Card>
  );
}
