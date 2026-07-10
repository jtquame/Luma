import { createClient } from "@/lib/supabase/server";
import { AssignmentCard } from "@/components/client/assignment-card";
import { Card } from "@/components/ui/card";

export default async function ClientSkillBuildingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: assignments } = await supabase
    .from("assignments")
    .select(
      "id, title, instructions, reflection_prompt, reflection_max_length, status, reflection_response, created_at"
    )
    .eq("client_id", user!.id)
    .order("status", { ascending: true }) // assigned before completed
    .order("created_at", { ascending: false });

  return (
    <div>
      <h1 className="font-display text-2xl mb-1">Skill building & reflections</h1>
      <p className="text-sm text-ink-muted mb-8">
        Homework Samara's assigned specifically for you.
      </p>

      {!assignments || assignments.length === 0 ? (
        <Card>
          <p className="text-sm text-ink-muted">Nothing assigned yet.</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {assignments.map((a) => (
            <AssignmentCard key={a.id} assignment={a} />
          ))}
        </div>
      )}
    </div>
  );
}
