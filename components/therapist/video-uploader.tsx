"use client";

import { useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Label } from "@/components/ui/input";
import { Video as VideoIcon, X, Loader2, Upload } from "lucide-react";

const MAX_SIZE_BYTES = 500 * 1024 * 1024; // 500MB — generous for phone-recorded video

export interface UploadedVideo {
  url: string;
  name: string;
}

export function VideoUploader({
  label,
  value,
  onChange,
}: {
  label: string;
  value: UploadedVideo | null;
  onChange: (video: UploadedVideo | null) => void;
}) {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);

    if (!file.type.startsWith("video/")) {
      setError("Please choose a video file.");
      return;
    }
    if (file.size > MAX_SIZE_BYTES) {
      setError(
        `That file is too large (${(file.size / 1024 / 1024).toFixed(0)}MB) — please choose one under 500MB, or compress it first.`
      );
      return;
    }

    setIsUploading(true);
    setProgress("Uploading — larger videos can take a few minutes…");
    try {
      const supabase = createClient();
      const ext = file.name.split(".").pop() || "mp4";
      const path = `${crypto.randomUUID()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("videos")
        .upload(path, file, { upsert: false });

      if (uploadError) {
        setError(
          uploadError.message?.toLowerCase().includes("size")
            ? "That file exceeds the server's upload limit. Check Storage settings in Supabase, or compress the video."
            : "Upload failed. Try again."
        );
        return;
      }

      // Bucket is private (not public like images), so sign a long-lived URL.
      const { data, error: signError } = await supabase.storage
        .from("videos")
        .createSignedUrl(path, 60 * 60 * 24 * 365); // 1 year

      if (signError || !data) {
        setError("Upload succeeded but couldn't generate a link. Try again.");
        return;
      }

      onChange({ url: data.signedUrl, name: file.name });
    } catch {
      setError("Upload failed. Try again.");
    } finally {
      setIsUploading(false);
      setProgress(null);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div>
      <Label>{label}</Label>
      {value ? (
        <div className="flex items-center gap-2 rounded-lg border border-border bg-bg px-3.5 py-2.5 max-w-sm">
          <VideoIcon size={16} className="text-ink-muted shrink-0" />
          <span className="text-sm text-ink truncate flex-1">{value.name}</span>
          <button
            type="button"
            onClick={() => onChange(null)}
            className="text-ink-muted hover:text-danger shrink-0"
            aria-label="Remove video"
          >
            <X size={15} />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={isUploading}
          className="flex items-center gap-2 rounded-lg border border-dashed border-border bg-bg px-3.5 py-2.5 text-sm text-ink-muted hover:border-primary/40 hover:text-ink transition-colors disabled:opacity-60 max-w-sm"
        >
          {isUploading ? (
            <>
              <Loader2 size={16} className="animate-spin" /> {progress ?? "Uploading…"}
            </>
          ) : (
            <>
              <Upload size={16} /> Upload video from phone or computer
            </>
          )}
        </button>
      )}
      {/* No `accept` restriction beyond video/* check after selection, and
          no `capture` attribute — lets mobile browsers offer both the
          camera roll and "Record Video" as options. */}
      <input
        ref={inputRef}
        type="file"
        accept="video/*"
        onChange={handleFileChange}
        className="hidden"
      />
      {error && <p className="mt-1.5 text-sm text-danger">{error}</p>}
    </div>
  );
}
