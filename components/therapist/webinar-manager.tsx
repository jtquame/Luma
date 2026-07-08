"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createWebinar, deleteWebinar } from "@/app/(therapist)/content-actions";
import { webinarSchema } from "@/lib/validations/content";
import { Card } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, X } from "lucide-react";
import { format } from "date-fns";

interface Webinar {
  id: string;
  title: string;
  speaker: string | null;
  scheduled_at: string | null;
  length_minutes: number | null;
}

function WebinarForm({ onDone }: { onDone: () => void }) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [speaker, setSpeaker] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [lengthMinutes, setLengthMinutes] = useState("");
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
      scheduledAt,
      lengthMinutes: lengthMinutes ? Number(lengthMinutes) : undefined,
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Check the form");
      return;
    }
    startTransition(async () => {
      const result = await createWebinar(parsed.data);
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
        <h3 className="font-display text-lg">New webinar</h3>
        <button onClick={onDone} aria-label="Close" className="text-ink-muted hover:text-ink">
          <X size={18} />
        </button>
      </div>
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <div>
          <Label htmlFor="wtitle">Title</Label>
          <Input id="wtitle" value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-3">
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
          {isPending ? "Saving…" : "Add webinar"}
        </Button>
      </form>
    </Card>
  );
}

export function WebinarManager({ webinars }: { webinars: Webinar[] }) {
  const [showForm, setShowForm] = useState(false);
  const [isPending, startTransition] = useTransition();

  return (
    <div>
      <div className="flex justify-end mb-6">
        {!showForm && (
          <Button onClick={() => setShowForm(true)}>
            <Plus size={16} strokeWidth={1.75} /> Add webinar
          </Button>
        )}
      </div>
      {showForm && <WebinarForm onDone={() => setShowForm(false)} />}

      {webinars.length === 0 ? (
        <p className="text-sm text-ink-muted">No webinars yet.</p>
      ) : (
        <div className="space-y-3">
          {webinars.map((w) => (
            <Card key={w.id} className="flex items-center justify-between">
              <div>
                <p className="font-medium text-ink">{w.title}</p>
                <p className="eyebrow mt-1">
                  {w.speaker ?? "No speaker set"}
                  {w.scheduled_at &&
                    ` · ${format(new Date(w.scheduled_at), "MMM d, yyyy 'at' h:mm a")}`}
                  {w.length_minutes && ` · ${w.length_minutes} min`}
                </p>
              </div>
              <button
                disabled={isPending}
                onClick={() => {
                  if (confirm("Delete this webinar?")) startTransition(() => deleteWebinar(w.id));
                }}
                className="text-ink-muted hover:text-danger"
                aria-label="Delete webinar"
              >
                <Trash2 size={17} />
              </button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
