import { createClient } from "@/lib/supabase/server";
import { SupportGroupManager } from "@/components/therapist/support-group-manager";

export default async function TherapistSupportGroupsPage() {
  const supabase = await createClient();
  const [{ data: groups }, { data: announcements }] = await Promise.all([
    supabase
      .from("support_groups")
      .select("id, title, meets_at, location, is_recurring")
      .order("meets_at", { ascending: true, nullsFirst: false }),
    supabase
      .from("announcements")
      .select("id, title, body, created_at")
      .order("created_at", { ascending: false }),
  ]);

  return (
    <div>
      <h1 className="font-display text-2xl mb-1">Support groups</h1>
      <p className="text-sm text-ink-muted mb-8">Share meeting details and announcements.</p>
      <SupportGroupManager groups={groups ?? []} announcements={announcements ?? []} />
    </div>
  );
}
