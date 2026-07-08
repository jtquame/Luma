import { createClient } from "@/lib/supabase/server";
import { TemplateForm } from "@/components/client/template-form";
import { Card } from "@/components/ui/card";
import type { QuestionType, QuestionConfig } from "@/lib/supabase/types";

export default async function CheckInPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: templates } = await supabase
    .from("templates")
    .select("id, kind, title, description, template_questions(id, type, label, config, is_required, position)")
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  const today = new Date().toISOString().slice(0, 10);
  const { data: todaysResponses } = await supabase
    .from("responses")
    .select("template_id, submitted_at")
    .eq("client_id", user!.id)
    .gte("submitted_at", `${today}T00:00:00Z`);

  const completedToday = new Set((todaysResponses ?? []).map((r) => r.template_id));

  return (
    <div>
      <h1 className="font-display text-2xl mb-1">Check-in</h1>
      <p className="text-sm text-ink-muted mb-8">
        A few minutes, structured questions only — nothing to write from scratch.
      </p>

      <div className="space-y-6">
        {(templates ?? []).map((t) => {
          const questions = (
            t.template_questions as {
              id: string;
              type: QuestionType;
              label: string;
              config: QuestionConfig;
              is_required: boolean;
              position: number;
            }[]
          ).sort((a, b) => a.position - b.position);

          if (t.kind === "check_in" && completedToday.has(t.id)) {
            return (
              <Card key={t.id}>
                <p className="font-medium text-ink mb-1">{t.title}</p>
                <p className="text-sm text-ink-muted">Completed for today. See you tomorrow.</p>
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

        {(!templates || templates.length === 0) && (
          <Card>
            <p className="text-sm text-ink-muted">
              Nothing assigned yet — Samara will add your first check-in soon.
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}
