import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { CompleteButton } from "@/components/client/complete-button";
import { format } from "date-fns";

export default async function ClientWebinarsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: webinars } = await supabase
    .from("webinars")
    .select(
      "id, title, description, speaker, video_url, thumbnail_url, scheduled_at, length_minutes, registration_url"
    )
    .order("scheduled_at", { ascending: true, nullsFirst: true });

  const { data: completions } = await supabase
    .from("webinar_completions")
    .select("webinar_id")
    .eq("client_id", user!.id);

  const completedIds = new Set((completions ?? []).map((c) => c.webinar_id));
  const now = new Date();
  const upcoming = (webinars ?? []).filter((w) => w.scheduled_at && new Date(w.scheduled_at) > now);
  const pastOrOnDemand = (webinars ?? []).filter(
    (w) => !w.scheduled_at || new Date(w.scheduled_at) <= now
  );

  function WebinarCard({ w }: { w: (typeof upcoming)[number] }) {
    return (
      <Card key={w.id}>
        <div className="flex flex-col sm:flex-row items-start gap-4">
          {w.thumbnail_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={w.thumbnail_url}
              alt=""
              className="w-full sm:w-32 h-32 sm:h-20 object-cover rounded-lg shrink-0"
            />
          )}
          <div className="flex-1 flex items-start justify-between gap-4 w-full">
            <div>
              <h3 className="font-display text-lg mb-1">{w.title}</h3>
              <p className="eyebrow mb-2">
                {w.speaker ?? "Tribe Works Behavioral Services"}
                {w.scheduled_at && ` · ${format(new Date(w.scheduled_at), "MMM d, yyyy 'at' h:mm a")}`}
                {w.length_minutes && ` · ${w.length_minutes} min`}
              </p>
              {w.description && <p className="text-sm text-ink-muted mb-3">{w.description}</p>}
              {w.video_url && (
                <a
                  href={w.video_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-accent hover:underline"
                >
                  Watch now
                </a>
              )}
              {w.registration_url && !w.video_url && (
                <a
                  href={w.registration_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-accent hover:underline"
                >
                  Register
                </a>
              )}
            </div>
            {w.video_url && (
              <CompleteButton webinarId={w.id} isComplete={completedIds.has(w.id)} />
            )}
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div>
      <h1 className="font-display text-2xl mb-8">Webinars</h1>

      {upcoming.length > 0 && (
        <div className="mb-8">
          <h2 className="eyebrow mb-3">Upcoming</h2>
          <div className="space-y-3">
            {upcoming.map((w) => (
              <WebinarCard key={w.id} w={w} />
            ))}
          </div>
        </div>
      )}

      <div>
        <h2 className="eyebrow mb-3">{upcoming.length > 0 ? "Past & on-demand" : "All webinars"}</h2>
        {pastOrOnDemand.length === 0 ? (
          <p className="text-sm text-ink-muted">Nothing here yet.</p>
        ) : (
          <div className="space-y-3">
            {pastOrOnDemand.map((w) => (
              <WebinarCard key={w.id} w={w} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
