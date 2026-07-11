import { createClient } from "@/lib/supabase/server";
import { AssignmentManager } from "@/components/therapist/assignment-manager";

export default async function TherapistSkillBuildingPage() {
  const supabase = await createClient();

  const [{ data: clients }, { data: assignments }, { data: libraryTemplates }] = await Promise.all([
    supabase
      .from("users")
      .select("id, first_name, last_name")
      .eq("role", "client")
      .eq("is_active", true)
      .order("first_name"),
    supabase
      .from("assignments")
      .select("id, title, status, created_at, users!assignments_client_id_fkey(first_name, last_name)")
      .order("created_at", { ascending: false })
      .limit(30),
    supabase
      .from("assignment_templates")
      .select(
        "id, title, instructions, reflection_prompt, reflection_max_length, attachment_url, attachment_name, attachment_type"
      )
      .order("title"),
  ]);

  const clientOptions = (clients ?? []).map((c) => ({
    id: c.id,
    name: `${c.first_name} ${c.last_name}`,
  }));

  const assignmentSummaries = (assignments ?? []).map((a) => ({
    id: a.id,
    title: a.title,
    status: a.status,
    createdAt: a.created_at,
    clientName: (() => {
      const u = a.users as unknown as { first_name: string; last_name: string };
      return u ? `${u.first_name} ${u.last_name}` : "Unknown client";
    })(),
  }));

  return (
    <div>
      <h1 className="font-display text-2xl mb-1">Reflections</h1>
      <p className="text-sm text-ink-muted mb-8">
        Assign after-session homework to a specific client.
      </p>
      <AssignmentManager
        clients={clientOptions}
        assignments={assignmentSummaries}
        libraryTemplates={libraryTemplates ?? []}
      />
    </div>
  );
}
