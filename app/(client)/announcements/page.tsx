import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { formatDistanceToNow } from "date-fns";

export default async function ClientAnnouncementsPage() {
  const supabase = await createClient();
  const { data: announcements } = await supabase
    .from("announcements")
    .select("id, title, body, created_at")
    .order("created_at", { ascending: false });

  return (
    <div>
      <h1 className="font-display text-2xl mb-8">Announcements</h1>

      {!announcements || announcements.length === 0 ? (
        <Card>
          <p className="text-sm text-ink-muted">No announcements yet.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {announcements.map((a) => (
            <Card key={a.id} className="bg-sage/20 border-sage">
              <p className="font-medium text-ink">{a.title}</p>
              <p className="text-sm text-ink-muted mt-0.5">{a.body}</p>
              <p className="eyebrow mt-2">
                {formatDistanceToNow(new Date(a.created_at), { addSuffix: true })}
              </p>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
