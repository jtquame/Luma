import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { VideoWatchLink } from "@/components/client/video-watch-link";

export default async function ClientCoachingVideosPage() {
  const supabase = await createClient();

  const { data: videos } = await supabase
    .from("coaching_videos")
    .select("id, title, description, video_url, thumbnail_url")
    .order("created_at", { ascending: false });

  return (
    <div>
      <h1 className="font-display text-2xl mb-8">Coaching Videos</h1>

      {!videos || videos.length === 0 ? (
        <Card>
          <p className="text-sm text-ink-muted">Nothing here yet — check back soon.</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {videos.map((v) => (
            <Card key={v.id} className="flex flex-col sm:flex-row items-start gap-4">
              {v.thumbnail_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={v.thumbnail_url}
                  alt=""
                  className="w-full sm:w-32 h-32 sm:h-20 object-cover rounded-lg shrink-0"
                />
              ) : (
                <div className="w-full sm:w-32 h-32 sm:h-20 rounded-lg bg-sage/40 shrink-0" />
              )}
              <div className="flex-1 w-full">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-display text-lg mb-1">{v.title}</h3>
                    {v.description && (
                      <p className="text-sm text-ink-muted mb-3">{v.description}</p>
                    )}
                  </div>
                </div>
                <VideoWatchLink videoId={v.id} videoUrl={v.video_url} />
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
