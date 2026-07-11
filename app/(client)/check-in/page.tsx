import { createClient } from "@/lib/supabase/server";
import { TemplateForm } from "@/components/client/template-form";
import { PreferredFrequencyPicker } from "@/components/client/preferred-frequency-picker";
import { Card } from "@/components/ui/card";
import { isCheckInDue, nextAvailableMessage } from "@/lib/checkin-cadence";
import type { QuestionType, QuestionConfig, CheckInFrequency } from "@/lib/supabase/types";

export default async function CheckInPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("users")
    .select("preferred_checkin_frequency")
    .eq("id", user!.id)
    .single();

  const preferredFrequency: CheckInFrequency = profile?.preferred_checkin_frequency ?? "daily";

  // Only check-ins Samara has specifically assigned to this client.
  const { data: assignments } = await supabase
    .from("client_checkin_assignments")
    .select(
      "template_id, templates(id, kind, title, description, template_questions(id, type, label, config, is_required, position))"
    )
    .eq("client_id", user!.id);

  // Prompts stay broadcast (unaffected by the assignment model) — every
  // active prompt is visible to every client, same as before.
  const { data: promptTemplates } = await supabase
    .from("templates")
    .select(
      "id, kind, title, description, template_questions(id, type, label, config, is_required, position)"
    )
    .eq("kind", "prompt")
    .eq("is_active", true);

  const { data: lastResponses } = await supabase
    .from("responses")
    .select("template_id, submitted_at")
    .eq("client_id", user!.id)
    .order("submitted_at", { ascending: false });

  const lastSubmittedByTemplate = new Map<string, string>();
  for (const r of lastResponses ?? []) {
    if (!lastSubmittedByTemplate.has(r.template_id)) {
      lastSubmittedByTemplate.set(r.template_id, r.submitted_at);
    }
  }

  const templates = (assignments ?? [])
    .map((a) => a.templates)
    .filter(
      (t): t is NonNullable<typeof t> => t !== null
    ) as unknown as {
    id: string;
    kind: string;
    title: string;
    description: string | null;
    template_questions: {
      id: string;
      type: QuestionType;
      label: string;
      config: QuestionConfig;
      is_required: boolean;
      position: number;
    }[];
  }[];

  const prompts = (promptTemplates ?? []) as unknown as typeof templates;

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
        <h1 className="font-display text-2xl">Check-in</h1>
        <PreferredFrequencyPicker current={preferredFrequency} />
      </div>
      <p className="text-sm text-ink-muted mb-8">
        A few minutes, structured questions only — nothing to write from scratch.
      </p>

      <div className="space-y-6">
        <h2 className="eyebrow">Check-ins</h2>
        {templates.map((t) => {
          const questions = [...t.template_questions].sort((a, b) => a.position - b.position);
          const lastSubmittedAt = lastSubmittedByTemplate.get(t.id) ?? null;

          if (lastSubmittedAt && !isCheckInDue(preferredFrequency, lastSubmittedAt)) {
            return (
              <Card key={t.id}>
                <p className="font-medium text-ink mb-1">{t.title}</p>
                <p className="text-sm text-ink-muted">
                  {nextAvailableMessage(preferredFrequency, lastSubmittedAt)}
                </p>
              </Card>
            );
          }

          return (
            <TemplateForm
              key={t.id}
              templateId={t.id}
              title={t.title}
              description={t.description}
              questions={questions}
            />
          );
        })}

        {templates.length === 0 && (
          <Card>
            <p className="text-sm text-ink-muted">
              Nothing assigned yet — Samara will add your first check-in soon.
            </p>
          </Card>
        )}

        {prompts.length > 0 && (
          <>
            <h2 className="eyebrow pt-4">Prompts</h2>
            {prompts.map((t) => {
              const questions = [...t.template_questions].sort((a, b) => a.position - b.position);
              const alreadyAnswered = lastSubmittedByTemplate.has(t.id);

              if (alreadyAnswered) {
                return (
                  <Card key={t.id}>
                    <p className="font-medium text-ink mb-1">{t.title}</p>
                    <p className="text-sm text-ink-muted">Completed.</p>
                  </Card>
                );
              }

              return (
                <TemplateForm
                  key={t.id}
                  templateId={t.id}
                  title={t.title}
                  description={t.description}
                  questions={questions}
                />
              );
            })}
          </>
        )}
      </div>
    </div>
  );
}
