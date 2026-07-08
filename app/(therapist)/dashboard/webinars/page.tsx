import { createClient } from "@/lib/supabase/server";
import { WebinarManager } from "@/components/therapist/webinar-manager";

export default async function TherapistWebinarsPage() {
  const supabase = await createClient();
  const { data: webinars } = await supabase
    .from("webinars")
    .select("id, title, speaker, scheduled_at, length_minutes")
    .order("scheduled_at", { ascending: false, nullsFirst: false });

  return (
    <div>
      <h1 className="font-display text-2xl mb-1">Webinars</h1>
      <p className="text-sm text-ink-muted mb-8">Host upcoming and past webinars for clients.</p>
      <WebinarManager webinars={webinars ?? []} />
    </div>
  );
}
