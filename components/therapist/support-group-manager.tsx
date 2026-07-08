"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  createSupportGroup,
  deleteSupportGroup,
  createAnnouncement,
  deleteAnnouncement,
} from "@/app/(therapist)/content-actions";
import { supportGroupSchema, announcementSchema } from "@/lib/validations/content";
import { Card } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, X } from "lucide-react";
import { format } from "date-fns";

interface Group {
  id: string;
  title: string;
  meets_at: string | null;
  location: string | null;
  is_recurring: boolean;
}
interface Announcement {
  id: string;
  title: string;
  body: string;
  created_at: string;
}

function GroupForm({ onDone }: { onDone: () => void }) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [meetsAt, setMeetsAt] = useState("");
  const [location, setLocation] = useState("");
  const [virtualLink, setVirtualLink] = useState("");
  const [isRecurring, setIsRecurring] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const parsed = supportGroupSchema.safeParse({
      title,
      description,
      meetsAt,
      location,
      virtualLink,
      isRecurring,
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Check the form");
      return;
    }
    startTransition(async () => {
      const result = await createSupportGroup(parsed.data);
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
        <h3 className="font-display text-lg">New support group</h3>
        <button onClick={onDone} aria-label="Close" className="text-ink-muted hover:text-ink">
          <X size={18} />
        </button>
      </div>
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <div>
          <Label htmlFor="gtitle">Title</Label>
          <Input id="gtitle" value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="meets">Date & time</Label>
            <Input
              id="meets"
              type="datetime-local"
              value={meetsAt}
              onChange={(e) => setMeetsAt(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="location">Location</Label>
            <Input id="location" value={location} onChange={(e) => setLocation(e.target.value)} />
          </div>
        </div>
        <div>
          <Label htmlFor="link">Virtual meeting link (optional)</Label>
          <Input id="link" value={virtualLink} onChange={(e) => setVirtualLink(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="gdesc">Description</Label>
          <textarea
            id="gdesc"
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm"
          />
        </div>
        <label className="flex items-center gap-2 text-sm text-ink-muted">
          <input
            type="checkbox"
            checked={isRecurring}
            onChange={(e) => setIsRecurring(e.target.checked)}
          />
          Recurring meeting
        </label>
        {error && (
          <div className="rounded-lg bg-danger/10 px-3.5 py-2.5 text-sm text-danger">{error}</div>
        )}
        <Button type="submit" disabled={isPending}>
          {isPending ? "Saving…" : "Add group"}
        </Button>
      </form>
    </Card>
  );
}

function AnnouncementForm({ onDone }: { onDone: () => void }) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const parsed = announcementSchema.safeParse({ title, body });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Check the form");
      return;
    }
    startTransition(async () => {
      const result = await createAnnouncement(parsed.data);
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
        <h3 className="font-display text-lg">New announcement</h3>
        <button onClick={onDone} aria-label="Close" className="text-ink-muted hover:text-ink">
          <X size={18} />
        </button>
      </div>
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <div>
          <Label htmlFor="atitle">Title</Label>
          <Input id="atitle" value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="abody">Message</Label>
          <textarea
            id="abody"
            rows={3}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            className="w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm"
          />
        </div>
        {error && (
          <div className="rounded-lg bg-danger/10 px-3.5 py-2.5 text-sm text-danger">{error}</div>
        )}
        <Button type="submit" disabled={isPending}>
          {isPending ? "Posting…" : "Post announcement"}
        </Button>
      </form>
    </Card>
  );
}

export function SupportGroupManager({
  groups,
  announcements,
}: {
  groups: Group[];
  announcements: Announcement[];
}) {
  const [showGroupForm, setShowGroupForm] = useState(false);
  const [showAnnouncementForm, setShowAnnouncementForm] = useState(false);
  const [isPending, startTransition] = useTransition();

  return (
    <div>
      <div className="mb-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="eyebrow">Support groups</h2>
          {!showGroupForm && (
            <Button size="sm" onClick={() => setShowGroupForm(true)}>
              <Plus size={15} /> Add group
            </Button>
          )}
        </div>
        {showGroupForm && <GroupForm onDone={() => setShowGroupForm(false)} />}
        {groups.length === 0 ? (
          <p className="text-sm text-ink-muted">No support groups yet.</p>
        ) : (
          <div className="space-y-3">
            {groups.map((g) => (
              <Card key={g.id} className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-ink">{g.title}</p>
                  <p className="eyebrow mt-1">
                    {g.meets_at && format(new Date(g.meets_at), "MMM d, yyyy 'at' h:mm a")}
                    {g.location && ` · ${g.location}`}
                    {g.is_recurring && " · Recurring"}
                  </p>
                </div>
                <button
                  disabled={isPending}
                  onClick={() => {
                    if (confirm("Delete this support group?"))
                      startTransition(() => deleteSupportGroup(g.id));
                  }}
                  className="text-ink-muted hover:text-danger"
                  aria-label="Delete group"
                >
                  <Trash2 size={17} />
                </button>
              </Card>
            ))}
          </div>
        )}
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="eyebrow">Announcements</h2>
          {!showAnnouncementForm && (
            <Button size="sm" onClick={() => setShowAnnouncementForm(true)}>
              <Plus size={15} /> New announcement
            </Button>
          )}
        </div>
        {showAnnouncementForm && (
          <AnnouncementForm onDone={() => setShowAnnouncementForm(false)} />
        )}
        {announcements.length === 0 ? (
          <p className="text-sm text-ink-muted">No announcements yet.</p>
        ) : (
          <div className="space-y-3">
            {announcements.map((a) => (
              <Card key={a.id} className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-ink">{a.title}</p>
                  <p className="text-sm text-ink-muted mt-0.5">{a.body}</p>
                </div>
                <button
                  disabled={isPending}
                  onClick={() => {
                    if (confirm("Delete this announcement?"))
                      startTransition(() => deleteAnnouncement(a.id));
                  }}
                  className="text-ink-muted hover:text-danger"
                  aria-label="Delete announcement"
                >
                  <Trash2 size={17} />
                </button>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
