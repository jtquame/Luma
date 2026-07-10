import { createClient } from "@/lib/supabase/server";
import { GroupsManager } from "@/components/therapist/support-group-manager";

export default async function TherapistSupportGroupsPage() {
  const supabase = await createClient();
  const { data: groups } = await supabase
    .from("support_groups")
    .select("id, title, meets_at, location, is_recurring")
    .order("meets_at", { ascending: true, nullsFirst: false });

  return (
    <div>
      <h1 className="font-display text-2xl mb-1">Support groups</h1>
      <p className="text-sm text-ink-muted mb-8">Share meeting details for clients.</p>
      <GroupsManager groups={groups ?? []} />
    </div>
  );
}
