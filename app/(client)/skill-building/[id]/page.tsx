import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { PathwayStepList } from "@/components/client/pathway-step-list";
import { StartPathwayButton } from "@/components/client/start-pathway-button";
import { Card } from "@/components/ui/card";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default async function PathwayDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: pathway } = await supabase
    .from("pathways")
    .select("id, title, category, description, cover_image_url")
    .eq("id", id)
    .eq("is_active", true)
    .single();

  if (!pathway) notFound();

  const { data: steps } = await supabase
    .from("pathway_steps")
    .select("id, position, title, content, reflection_prompt, reflection_max_length")
    .eq("pathway_id", id)
    .order("position");

  const { data: enrollment } = await supabase
    .from("pathway_enrollments")
    .select("started_at, completed_at")
    .eq("client_id", user!.id)
    .eq("pathway_id", id)
    .maybeSingle();

  const { data: completions } = await supabase
    .from("pathway_step_completions")
    .select("step_id, reflection_response")
    .eq("client_id", user!.id)
    .in("step_id", (steps ?? []).map((s) => s.id));

  return (
    <div>
      <Link
        href="/skill-building"
        className="inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink mb-6"
      >
        <ArrowLeft size={15} /> Back to Skill Building
      </Link>

      <p className="eyebrow mb-2">{pathway.category}</p>
      <h1 className="font-display text-2xl mb-2">{pathway.title}</h1>
      {pathway.description && <p className="text-sm text-ink-muted mb-6">{pathway.description}</p>}

      {!enrollment ? (
        <Card>
          <p className="text-sm text-ink-muted mb-4">
            {(steps ?? []).length} step{(steps ?? []).length === 1 ? "" : "s"} · work through them
            at your own pace.
          </p>
          <StartPathwayButton pathwayId={pathway.id} />
        </Card>
      ) : (
        <PathwayStepList steps={steps ?? []} completions={completions ?? []} />
      )}
    </div>
  );
}
