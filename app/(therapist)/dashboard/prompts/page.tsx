import { createClient } from "@/lib/supabase/server";
import { PromptsManager } from "@/components/therapist/prompts-manager";
import { RecentResponses } from "@/components/therapist/recent-responses";

export default async function PromptsPage() {
  const supabase = await createClient();

  const { data: templates } = await supabase
    .from("templates")
    .select(
      "id, kind, title, description, is_active, template_questions(count), responses(count)"
    )
    .order("created_at", { ascending: false });

  const summarize = (rows: typeof templates) =>
    (rows ?? []).map((t) => ({
      id: t.id,
      title: t.title,
      description: t.description,
      is_active: t.is_active,
      questionCount: (t.template_questions as unknown as { count: number }[])[0]?.count ?? 0,
      responseCount: (t.responses as unknown as { count: number }[])[0]?.count ?? 0,
    }));

  const checkIns = summarize(templates?.filter((t) => t.kind === "check_in"));
  const prompts = summarize(templates?.filter((t) => t.kind === "prompt"));

  const { data: recentResponses } = await supabase
    .from("responses")
    .select(
      "id, submitted_at, reviewed_at, templates(title), users!responses_client_id_fkey(first_name, last_name)"
    )
    .order("submitted_at", { ascending: false })
    .limit(15);

  const responseSummaries = (recentResponses ?? []).map((r) => ({
    id: r.id,
    templateTitle: (r.templates as unknown as { title: string })?.title ?? "Untitled",
    clientName: (() => {
      const u = r.users as unknown as { first_name: string; last_name: string };
      return u ? `${u.first_name} ${u.last_name}` : "Unknown client";
    })(),
    submittedAt: r.submitted_at,
    reviewedAt: r.reviewed_at,
  }));

  return (
    <div>
      <h1 className="font-display text-2xl mb-1">Check-ins & Prompts</h1>
      <p className="text-sm text-ink-muted mb-8">
        Build the structured questions your clients respond to.
      </p>
      <PromptsManager checkIns={checkIns} prompts={prompts} />
      <RecentResponses responses={responseSummaries} />
    </div>
  );
}
