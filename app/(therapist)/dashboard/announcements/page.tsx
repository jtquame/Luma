import { createClient } from "@/lib/supabase/server";
import { AnnouncementsManager } from "@/components/therapist/support-group-manager";

export default async function TherapistAnnouncementsPage() {
  const supabase = await createClient();
  const { data: announcements } = await supabase
    .from("announcements")
    .select("id, title, body, created_at")
    .order("created_at", { ascending: false });

  return (
    <div>
      <h1 className="font-display text-2xl mb-1">Announcements</h1>
      <p className="text-sm text-ink-muted mb-8">Post updates every client will see.</p>
      <AnnouncementsManager announcements={announcements ?? []} />
    </div>
  );
}
