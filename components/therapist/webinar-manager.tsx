"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createWebinar, updateWebinar, deleteWebinar } from "@/app/(therapist)/content-actions";
import { webinarSchema } from "@/lib/validations/content";
import { Card } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ImageUploader } from "./image-uploader";
import { Plus, Trash2, X } from "lucide-react";
import { format } from "date-fns";

interface Webinar {
  id: string;
  title: string;
  speaker: string | null;
  scheduled_at: string | null;
  length_minutes: number | null;
  description?: string | null;
  video_url?: string | null;
  thumbnail_url?: string | null;
}

function toLocalInputValue(iso: string | null | undefined) {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function WebinarForm({
  onDone,
  existingWebinar,
}: {
  onDone: () => void;
  existingWebinar?: Webinar;
}) {
  const router = useRouter();
  const [title, setTitle] = useState(existingWebinar?.title ?? "");
  const [description, setDescription] = useState(existingWebinar?.description ?? "");
  const [speaker, setSpeaker] = useState(existingWebinar?.speaker ?? "");
  const [videoUrl, setVideoUrl] = useState(existingWebinar?.video_url ?? "");
  const [thumbnailUrl, setThumbnailUrl] = useState(existingWebinar?.thumbnail_url ?? "");
  const [scheduledAt, setScheduledAt] = useState(toLocalInputValue(existingWebinar?.scheduled_at));
  const [lengthMinutes, setLengthMinutes] = useState(
    existingWebinar?.length_minutes ? String(existingWebinar.length_minutes) : ""
  );
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const parsed = webinarSchema.safeParse({
      title,
      description,
      speaker,
      videoUrl,
      thumbnailUrl,
      scheduledAt,
      lengthMinutes: lengthMinutes ? Number(lengthMinutes) : undefined,
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Check the form");
      return;
    }
    startTransition(async () => {
      const result = existingWebinar
        ? await updateWebinar(existingWebinar.id, parsed.data)
        : await createWebinar(parsed.data);
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
        <h3 className="font-display text-lg">{existingWebinar ? "Edit webinar" : "New webinar"}</h3>
        <button onClick={onDone} aria-label="Close" className="text-ink-muted hover:text-ink">
          <X size={18} />
        </button>
      </div>
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <div>
          <Label htmlFor="wtitle">Title</Label>
          <Input id="wtitle" value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <Label htmlFor="speaker">Speaker</Label>
            <Input id="speaker" value={speaker} onChange={(e) => setSpeaker(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="length">Length (minutes)</Label>
            <Input
              id="length"
              type="number"
              value={lengthMinutes}
              onChange={(e) => setLengthMinutes(e.target.value)}
            />
          </div>
        </div>
        <div>
          <Label htmlFor="video">Video URL</Label>
          <Input id="video" value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} />
        </div>
        <ImageUploader
          label="Thumbnail image"
          value={thumbnailUrl}
          onChange={setThumbnailUrl}
          folder="webinars"
        />
        <div>
          <Label htmlFor="scheduled">Date & time (leave blank for on-demand)</Label>
          <Input
            id="scheduled"
            type="datetime-local"
            value={scheduledAt}
            onChange={(e) => setScheduledAt(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="desc">Description</Label>
          <textarea
            id="desc"
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm"
          />
        </div>
        {error && (
          <div className="rounded-lg bg-danger/10 px-3.5 py-2.5 text-sm text-danger">{error}</div>
        )}
        <Button type="submit" disabled={isPending}>
          {isPending ? "Saving…" : existingWebinar ? "Save changes" : "Add webinar"}
        </Button>
      </form>
    </Card>
  );
}

export function WebinarManager({ webinars }: { webinars: Webinar[] }) {
  const [showForm, setShowForm] = useState(false);
  const [editingWebinar, setEditingWebinar] = useState<Webinar | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleDone() {
    setShowForm(false);
    setEditingWebinar(null);
  }

  return (
    <div>
      <div className="flex justify-end mb-6">
        {!showForm && (
          <Button onClick={() => setShowForm(true)}>
            <Plus size={16} strokeWidth={1.75} /> Add webinar
          </Button>
        )}
      </div>
      {showForm && (
        <WebinarForm onDone={handleDone} existingWebinar={editingWebinar ?? undefined} />
      )}

      {webinars.length === 0 ? (
        <p className="text-sm text-ink-muted">No webinars yet.</p>
      ) : (
        <div className="space-y-3">
          {webinars.map((w) => (
            <Card key={w.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <p className="font-medium text-ink">{w.title}</p>
                <p className="eyebrow mt-1">
                  {w.speaker ?? "No speaker set"}
                  {w.scheduled_at &&
                    ` · ${format(new Date(w.scheduled_at), "MMM d, yyyy 'at' h:mm a")}`}
                  {w.length_minutes && ` · ${w.length_minutes} min`}
                </p>
              </div>
              <div className="flex gap-2 flex-wrap">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setEditingWebinar(w);
                    setShowForm(true);
                  }}
                >
                  Edit
                </Button>
                <button
                  disabled={isPending}
                  onClick={() => {
                    if (confirm("Delete this webinar?")) startTransition(() => deleteWebinar(w.id));
                  }}
                  className="text-ink-muted hover:text-danger p-2"
                  aria-label="Delete webinar"
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
