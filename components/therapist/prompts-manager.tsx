"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { TemplateBuilder } from "./template-builder";
import { TemplateRow } from "./template-row";
import { CheckInPresetLibrary, type CustomLibraryItem } from "./checkin-preset-library";
import { Button } from "@/components/ui/button";
import { Plus, Library } from "lucide-react";

interface TemplateSummary {
  id: string;
  title: string;
  description: string | null;
  is_active: boolean;
  questionCount: number;
  responseCount: number;
  assignedClientIds?: string[];
}

interface ClientOption {
  id: string;
  name: string;
}

export function PromptsManager({
  checkIns,
  prompts,
  clients,
  libraryItems,
}: {
  checkIns: TemplateSummary[];
  prompts: TemplateSummary[];
  clients: ClientOption[];
  libraryItems: CustomLibraryItem[];
}) {
  const [showBuilder, setShowBuilder] = useState(false);
  const [showLibrary, setShowLibrary] = useState(false);
  const router = useRouter();

  function handleDone() {
    setShowBuilder(false);
    router.refresh();
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-6">
        <p className="text-sm text-ink-muted max-w-md">
          Check-ins repeat on a cadence; prompts are one-off. Clients only ever
          see structured questions — never a blank text box.
        </p>
        <div className="flex gap-2 shrink-0">
          {!showLibrary && (
            <Button variant="secondary" onClick={() => setShowLibrary(true)}>
              <Library size={16} strokeWidth={1.75} />
              Add from library
            </Button>
          )}
          {!showBuilder && (
            <Button onClick={() => setShowBuilder(true)}>
              <Plus size={16} strokeWidth={1.75} />
              New template
            </Button>
          )}
        </div>
      </div>

      {showLibrary && (
        <CheckInPresetLibrary onDone={() => setShowLibrary(false)} customItems={libraryItems} />
      )}
      {showBuilder && <TemplateBuilder onDone={handleDone} />}

      <div className="mb-8">
        <h2 className="eyebrow mb-3">Check-ins</h2>
        {checkIns.length === 0 ? (
          <p className="text-sm text-ink-muted">No check-in templates yet.</p>
        ) : (
          <div className="space-y-3">
            {checkIns.map((t) => (
              <TemplateRow
                key={t.id}
                id={t.id}
                title={t.title}
                description={t.description}
                isActive={t.is_active}
                questionCount={t.questionCount}
                responseCount={t.responseCount}
                kind="check_in"
                clients={clients}
                assignedClientIds={t.assignedClientIds}
              />
            ))}
          </div>
        )}
      </div>

      <div>
        <h2 className="eyebrow mb-3">Prompts</h2>
        {prompts.length === 0 ? (
          <p className="text-sm text-ink-muted">No prompts yet.</p>
        ) : (
          <div className="space-y-3">
            {prompts.map((t) => (
              <TemplateRow
                key={t.id}
                id={t.id}
                title={t.title}
                description={t.description}
                isActive={t.is_active}
                questionCount={t.questionCount}
                responseCount={t.responseCount}
                kind="prompt"
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
