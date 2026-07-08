"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateSettings, updateCurrentlyReading } from "@/app/(therapist)/content-actions";
import { settingsSchema } from "@/lib/validations/settings";
import { currentlyReadingSchema } from "@/lib/validations/content";
import { Card } from "@/components/ui/card";
import { Input, Label, FieldError } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface SettingsData {
  practice_name: string;
  welcome_message: string;
  session_timeout_minutes: number;
}
interface ReadingData {
  book_title: string | null;
  author: string | null;
  why_reading: string | null;
  learning_note: string | null;
  favorite_quote: string | null;
}

function PracticeSettingsForm({ settings }: { settings: SettingsData }) {
  const router = useRouter();
  const [practiceName, setPracticeName] = useState(settings.practice_name);
  const [welcomeMessage, setWelcomeMessage] = useState(settings.welcome_message);
  const [timeout_, setTimeout_] = useState(settings.session_timeout_minutes);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaved(false);
    const parsed = settingsSchema.safeParse({
      practiceName,
      welcomeMessage,
      sessionTimeoutMinutes: timeout_,
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Check the form");
      return;
    }
    startTransition(async () => {
      const result = await updateSettings(parsed.data);
      if (result.error) setError(result.error);
      else {
        setSaved(true);
        router.refresh();
      }
    });
  }

  return (
    <Card className="mb-6">
      <h2 className="font-display text-lg mb-4">Practice settings</h2>
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <div>
          <Label htmlFor="practiceName">Practice name</Label>
          <Input
            id="practiceName"
            value={practiceName}
            onChange={(e) => setPracticeName(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="welcome">Client home welcome message</Label>
          <Input
            id="welcome"
            value={welcomeMessage}
            onChange={(e) => setWelcomeMessage(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="timeout">Auto-logout after inactivity (minutes)</Label>
          <Input
            id="timeout"
            type="number"
            value={timeout_}
            onChange={(e) => setTimeout_(Number(e.target.value))}
            className="w-32"
          />
          <FieldError>{error ?? undefined}</FieldError>
        </div>
        <Button type="submit" disabled={isPending}>
          {isPending ? "Saving…" : saved ? "Saved" : "Save settings"}
        </Button>
      </form>
    </Card>
  );
}

function CurrentlyReadingForm({ reading }: { reading: ReadingData }) {
  const router = useRouter();
  const [bookTitle, setBookTitle] = useState(reading.book_title ?? "");
  const [author, setAuthor] = useState(reading.author ?? "");
  const [whyReading, setWhyReading] = useState(reading.why_reading ?? "");
  const [learningNote, setLearningNote] = useState(reading.learning_note ?? "");
  const [favoriteQuote, setFavoriteQuote] = useState(reading.favorite_quote ?? "");
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaved(false);
    const parsed = currentlyReadingSchema.safeParse({
      bookTitle,
      author,
      whyReading,
      learningNote,
      favoriteQuote,
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Check the form");
      return;
    }
    startTransition(async () => {
      const result = await updateCurrentlyReading(parsed.data);
      if (result.error) setError(result.error);
      else {
        setSaved(true);
        router.refresh();
      }
    });
  }

  return (
    <Card>
      <h2 className="font-display text-lg mb-1">What I'm currently reading</h2>
      <p className="text-sm text-ink-muted mb-4">
        Shown on your clients' home page — a personal touch, not a full library entry.
      </p>
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="bookTitle">Book title</Label>
            <Input id="bookTitle" value={bookTitle} onChange={(e) => setBookTitle(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="author">Author</Label>
            <Input id="author" value={author} onChange={(e) => setAuthor(e.target.value)} />
          </div>
        </div>
        <div>
          <Label htmlFor="why">Why I'm reading this</Label>
          <textarea
            id="why"
            rows={2}
            value={whyReading}
            onChange={(e) => setWhyReading(e.target.value)}
            className="w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm"
          />
        </div>
        <div>
          <Label htmlFor="learning">What I'm learning</Label>
          <textarea
            id="learning"
            rows={2}
            value={learningNote}
            onChange={(e) => setLearningNote(e.target.value)}
            className="w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm"
          />
        </div>
        <div>
          <Label htmlFor="quote">Favorite quote</Label>
          <textarea
            id="quote"
            rows={2}
            value={favoriteQuote}
            onChange={(e) => setFavoriteQuote(e.target.value)}
            className="w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm"
          />
        </div>
        {error && (
          <div className="rounded-lg bg-danger/10 px-3.5 py-2.5 text-sm text-danger">{error}</div>
        )}
        <Button type="submit" disabled={isPending}>
          {isPending ? "Saving…" : saved ? "Saved" : "Save"}
        </Button>
      </form>
    </Card>
  );
}

export function SettingsManager({
  settings,
  reading,
}: {
  settings: SettingsData;
  reading: ReadingData;
}) {
  return (
    <div>
      <PracticeSettingsForm settings={settings} />
      <CurrentlyReadingForm reading={reading} />
    </div>
  );
}
