"use client";

import { useState, useTransition } from "react";
import { setTemplateActive } from "@/app/(therapist)/templates-actions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CheckInAssignmentPanel } from "./checkin-assignment-panel";
import { Users } from "lucide-react";

interface ClientOption {
  id: string;
  name: string;
}

export function TemplateRow({
  id,
  title,
  description,
  isActive,
  questionCount,
  responseCount,
  kind,
  clients,
  assignedClientIds,
}: {
  id: string;
  title: string;
  description: string | null;
  isActive: boolean;
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
          <div className="flex items-center gap-2">
            <p className="font-medium text-ink">{title}</p>
            {!isActive && (
              <span className="rounded-full bg-border px-2 py-0.5 text-xs text-ink-muted">
                Archived
              </span>
            )}
          </div>
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
          <Button
            variant="ghost"
            size="sm"
            disabled={isPending}
            onClick={() => startTransition(() => setTemplateActive(id, !isActive))}
          >
            {isActive ? "Archive" : "Reactivate"}
          </Button>
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
