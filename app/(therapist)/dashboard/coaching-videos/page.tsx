import { createClient } from "@/lib/supabase/server";
import { CoachingVideoManager } from "@/components/therapist/coaching-video-manager";

export default async function TherapistCoachingVideosPage() {
  const supabase = await createClient();

  const [{ data: videos }, { data: views }] = await Promise.all([
    supabase
      .from("coaching_videos")
      .select("id, title, description, video_url, thumbnail_url")
      .order("created_at", { ascending: false }),
    supabase.from("coaching_video_views").select("video_id, client_id"),
  ]);

  const statsByVideo = new Map<string, { total: number; viewers: Set<string> }>();
  for (const v of views ?? []) {
    const stats = statsByVideo.get(v.video_id) ?? { total: 0, viewers: new Set<string>() };
    stats.total += 1;
    stats.viewers.add(v.client_id);
    statsByVideo.set(v.video_id, stats);
  }

  const summaries = (videos ?? []).map((v) => ({
    id: v.id,
    title: v.title,
    description: v.description,
    video_url: v.video_url,
    thumbnail_url: v.thumbnail_url,
    totalViews: statsByVideo.get(v.id)?.total ?? 0,
    uniqueViewers: statsByVideo.get(v.id)?.viewers.size ?? 0,
  }));

  return (
    <div>
      <h1 className="font-display text-2xl mb-1">Coaching Videos</h1>
      <p className="text-sm text-ink-muted mb-8">
        Upload standalone coaching content for clients, with view tracking.
      </p>
      <CoachingVideoManager videos={summaries} />
    </div>
  );
}
