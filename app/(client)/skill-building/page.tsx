import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import Link from "next/link";

export default async function ClientSkillBuildingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: pathways } = await supabase
    .from("pathways")
    .select("id, title, category, description, cover_image_url, pathway_steps(count)")
    .eq("is_active", true)
    .order("category");

  const { data: enrollments } = await supabase
    .from("pathway_enrollments")
    .select("pathway_id, completed_at")
    .eq("client_id", user!.id);

  const enrollmentByPathway = new Map(
    (enrollments ?? []).map((e) => [e.pathway_id, e.completed_at])
  );

  const byCategory = new Map<string, typeof pathways>();
  for (const p of pathways ?? []) {
    const list = byCategory.get(p.category) ?? [];
    list.push(p);
    byCategory.set(p.category, list);
  }

  return (
    <div>
      <h1 className="font-display text-2xl mb-1">Skill Building</h1>
      <p className="text-sm text-ink-muted mb-8">
        Self-paced pathways for specific things you're working through. Start
        whichever fits — steps unlock one at a time as you go.
      </p>

      {!pathways || pathways.length === 0 ? (
        <Card>
          <p className="text-sm text-ink-muted">No pathways available yet.</p>
        </Card>
      ) : (
        Array.from(byCategory.entries()).map(([category, items]) => (
          <div key={category} className="mb-8">
            <h2 className="eyebrow mb-3">{category}</h2>
            <div className="space-y-3">
              {(items ?? []).map((p) => {
                const enrolled = enrollmentByPathway.has(p.id);
                const completed = !!enrollmentByPathway.get(p.id);
                const stepCount = (p.pathway_steps as unknown as { count: number }[])[0]?.count ?? 0;

                return (
                  <Link key={p.id} href={`/skill-building/${p.id}`}>
                    <Card className="flex gap-4 hover:border-primary/40 transition-colors">
                      {p.cover_image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={p.cover_image_url}
                          alt=""
                          className="w-20 h-20 object-cover rounded-lg shrink-0"
                        />
                      ) : (
                        <div className="w-20 h-20 rounded-lg bg-sage/40 shrink-0" />
                      )}
                      <div>
                        <h3 className="font-display text-lg mb-1">{p.title}</h3>
                        {p.description && (
                          <p className="text-sm text-ink-muted mb-1">{p.description}</p>
                        )}
                        <p className="eyebrow">
                          {stepCount} step{stepCount === 1 ? "" : "s"}
                          {completed && " · Completed"}
                          {enrolled && !completed && " · In progress"}
                        </p>
                      </div>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
