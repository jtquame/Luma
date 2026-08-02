import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { VideoPlayer } from "@/components/client/video-player";

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
        <div className="space-y-6">
          {videos.map((v) => (
            <Card key={v.id}>
              <h3 className="font-display text-lg mb-1">{v.title}</h3>
              {v.description && <p className="text-sm text-ink-muted mb-3">{v.description}</p>}
              <VideoPlayer videoId={v.id} videoUrl={v.video_url} posterUrl={v.thumbnail_url} />
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
