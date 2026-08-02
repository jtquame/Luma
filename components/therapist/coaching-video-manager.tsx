"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  createCoachingVideo,
  updateCoachingVideo,
  deleteCoachingVideo,
} from "@/app/(therapist)/coaching-videos-actions";
import { coachingVideoSchema } from "@/lib/validations/coaching-videos";
import { Card } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ImageUploader } from "./image-uploader";
import { VideoUploader, type UploadedVideo } from "./video-uploader";
import { Plus, Trash2, X, Eye, Users } from "lucide-react";

interface Video {
  id: string;
  title: string;
  description: string | null;
  video_url: string;
  thumbnail_url: string | null;
  totalViews: number;
  uniqueViewers: number;
}

function VideoForm({ onDone, existingVideo }: { onDone: () => void; existingVideo?: Video }) {
  const router = useRouter();
  const [title, setTitle] = useState(existingVideo?.title ?? "");
  const [description, setDescription] = useState(existingVideo?.description ?? "");
  const [video, setVideo] = useState<UploadedVideo | null>(
    existingVideo ? { url: existingVideo.video_url, name: existingVideo.title } : null
  );
  const [thumbnailUrl, setThumbnailUrl] = useState(existingVideo?.thumbnail_url ?? "");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!video) {
      setError("Upload a video file first.");
      return;
    }

    const parsed = coachingVideoSchema.safeParse({
      title,
      description,
      videoUrl: video.url,
      thumbnailUrl,
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Check the form");
      return;
    }
    startTransition(async () => {
      const result = existingVideo
        ? await updateCoachingVideo(existingVideo.id, parsed.data)
        : await createCoachingVideo(parsed.data);
      if (result.error) setError(result.error);
      else {
        router.refresh();
        onDone();
      }
    });
  }

  return (
    <Card className="mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display text-lg">{existingVideo ? "Edit video" : "New coaching video"}</h3>
        <button onClick={onDone} aria-label="Close" className="text-ink-muted hover:text-ink">
          <X size={18} />
        </button>
      </div>
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <div>
          <Label htmlFor="vtitle">Title</Label>
          <Input id="vtitle" value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <VideoUploader label="Video file" value={video} onChange={setVideo} />
        <ImageUploader
          label="Thumbnail (optional)"
          value={thumbnailUrl}
          onChange={setThumbnailUrl}
          folder="coaching-videos"
        />
        <div>
          <Label htmlFor="vdesc">Description</Label>
          <textarea
            id="vdesc"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm"
          />
        </div>
        {error && (
          <div className="rounded-lg bg-danger/10 px-3.5 py-2.5 text-sm text-danger">{error}</div>
        )}
        <Button type="submit" disabled={isPending}>
          {isPending ? "Saving…" : existingVideo ? "Save changes" : "Add video"}
        </Button>
      </form>
    </Card>
  );
}

export function CoachingVideoManager({ videos }: { videos: Video[] }) {
  const [showForm, setShowForm] = useState(false);
  const [editingVideo, setEditingVideo] = useState<Video | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleDone() {
    setShowForm(false);
    setEditingVideo(null);
  }

  return (
    <div>
      <div className="flex justify-end mb-6">
        {!showForm && (
          <Button onClick={() => setShowForm(true)}>
            <Plus size={16} strokeWidth={1.75} /> New video
          </Button>
        )}
      </div>

      {showForm && <VideoForm onDone={handleDone} existingVideo={editingVideo ?? undefined} />}

      {videos.length === 0 ? (
        <p className="text-sm text-ink-muted">No coaching videos yet.</p>
      ) : (
        <div className="space-y-3">
          {videos.map((v) => (
            <Card key={v.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                {v.thumbnail_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={v.thumbnail_url}
                    alt=""
                    className="w-16 h-16 object-cover rounded-lg shrink-0"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-lg bg-sage/40 shrink-0" />
                )}
                <div>
                  <p className="font-medium text-ink">{v.title}</p>
                  <p className="eyebrow mt-1 flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <Eye size={12} /> {v.totalViews} view{v.totalViews === 1 ? "" : "s"}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users size={12} /> {v.uniqueViewers} client{v.uniqueViewers === 1 ? "" : "s"}
                    </span>
                  </p>
                </div>
              </div>
              <div className="flex gap-2 flex-wrap">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setEditingVideo(v);
                    setShowForm(true);
                  }}
                >
                  Edit
                </Button>
                <button
                  disabled={isPending}
                  onClick={() => {
                    if (confirm(`Delete "${v.title}"? This can't be undone.`))
                      startTransition(() => deleteCoachingVideo(v.id));
                  }}
                  className="text-ink-muted hover:text-danger p-2"
                  aria-label="Delete video"
                >
                  <Trash2 size={17} />
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
