import { createClient } from "@/lib/supabase/server";
import { PromptsManager } from "@/components/therapist/prompts-manager";
import { RecentResponses } from "@/components/therapist/recent-responses";

export default async function PromptsPage() {
  const supabase = await createClient();

  const [{ data: templates }, { data: clients }, { data: assignments }, { data: libraryItems }] =
    await Promise.all([
      supabase
        .from("templates")
        .select(
          "id, kind, title, description, is_active, template_questions(count), responses(count)"
        )
        .order("created_at", { ascending: false }),
      supabase
        .from("users")
        .select("id, first_name, last_name")
        .eq("role", "client")
        .eq("is_active", true)
        .order("first_name"),
      supabase.from("client_checkin_assignments").select("client_id, template_id"),
      supabase
        .from("checkin_library")
        .select("id, title, description, frequency, questions")
        .order("title"),
    ]);

  const clientOptions = (clients ?? []).map((c) => ({
    id: c.id,
    name: `${c.first_name} ${c.last_name}`,
  }));

  const assignedClientsByTemplate = new Map<string, string[]>();
  for (const a of assignments ?? []) {
    const list = assignedClientsByTemplate.get(a.template_id) ?? [];
    list.push(a.client_id);
    assignedClientsByTemplate.set(a.template_id, list);
  }

  const summarize = (rows: typeof templates) =>
    (rows ?? []).map((t) => ({
      id: t.id,
      title: t.title,
      description: t.description,
      is_active: t.is_active,
      questionCount: (t.template_questions as unknown as { count: number }[])[0]?.count ?? 0,
      responseCount: (t.responses as unknown as { count: number }[])[0]?.count ?? 0,
      assignedClientIds: assignedClientsByTemplate.get(t.id) ?? [],
    }));

  const checkIns = summarize(templates?.filter((t) => t.kind === "check_in"));
  const prompts = summarize(templates?.filter((t) => t.kind === "prompt"));

  const { data: recentResponses } = await supabase
    .from("responses")
    .select(
      "id, submitted_at, reviewed_at, shared_with_therapist, templates(title), users!responses_client_id_fkey(first_name, last_name)"
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
    shared: r.shared_with_therapist,
  }));

  return (
    <div>
      <h1 className="font-display text-2xl mb-1">Check-ins & Prompts</h1>
      <p className="text-sm text-ink-muted mb-8">
        Build the structured questions your clients respond to.
      </p>
      <PromptsManager
        checkIns={checkIns}
        prompts={prompts}
        clients={clientOptions}
        libraryItems={libraryItems ?? []}
      />
      <RecentResponses responses={responseSummaries} />
    </div>
  );
}
