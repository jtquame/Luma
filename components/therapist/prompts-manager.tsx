"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { TemplateBuilder } from "./template-builder";
import { TemplateRow } from "./template-row";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface TemplateSummary {
  id: string;
  title: string;
  description: string | null;
  is_active: boolean;
  questionCount: number;
  responseCount: number;
}

export function PromptsManager({
  checkIns,
  prompts,
}: {
  checkIns: TemplateSummary[];
  prompts: TemplateSummary[];
}) {
  const [showBuilder, setShowBuilder] = useState(false);
  const router = useRouter();

  function handleDone() {
    setShowBuilder(false);
    router.refresh();
  }

  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <p className="text-sm text-ink-muted max-w-md">
          Check-ins repeat (daily or weekly); prompts are one-off. Clients only
          ever see structured questions — never a blank text box.
        </p>
        {!showBuilder && (
          <Button onClick={() => setShowBuilder(true)}>
            <Plus size={16} strokeWidth={1.75} />
            New template
          </Button>
        )}
      </div>

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
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
