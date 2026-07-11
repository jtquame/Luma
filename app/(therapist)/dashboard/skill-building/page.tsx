import { createClient } from "@/lib/supabase/server";
import { PathwayManager } from "@/components/therapist/pathway-manager";

export default async function TherapistSkillBuildingPage() {
  const supabase = await createClient();

  const { data: pathways } = await supabase
    .from("pathways")
    .select("id, title, category, is_active, pathway_steps(count), pathway_enrollments(count)")
    .order("created_at", { ascending: false });

  const summaries = (pathways ?? []).map((p) => ({
    id: p.id,
    title: p.title,
    category: p.category,
    is_active: p.is_active,
    stepCount: (p.pathway_steps as unknown as { count: number }[])[0]?.count ?? 0,
    enrollmentCount: (p.pathway_enrollments as unknown as { count: number }[])[0]?.count ?? 0,
  }));

  return (
    <div>
      <h1 className="font-display text-2xl mb-1">Skill Building</h1>
      <p className="text-sm text-ink-muted mb-8">
        Build topic-based pathways clients can work through at their own pace.
      </p>
      <PathwayManager pathways={summaries} />
    </div>
  );
}
