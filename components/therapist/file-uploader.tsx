"use client";

import { useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Label } from "@/components/ui/input";
import { Paperclip, X, Loader2, FileText, Image as ImageIcon } from "lucide-react";

const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10MB — worksheets/PDFs run bigger than photos

export interface UploadedFile {
  url: string;
  name: string;
  type: "image" | "document";
}

export function FileUploader({
  label,
  value,
  onChange,
  folder,
}: {
  label: string;
  value: UploadedFile | null;
  onChange: (file: UploadedFile | null) => void;
  folder: string;
}) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);

    if (file.size > MAX_SIZE_BYTES) {
      setError("File is too large — please choose one under 10MB.");
      return;
    }

    setIsUploading(true);
    try {
      const supabase = createClient();
      const ext = file.name.split(".").pop() || "bin";
      const path = `${folder}/${crypto.randomUUID()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("attachments")
        .upload(path, file, { upsert: false });

      if (uploadError) {
        setError("Upload failed. Try again.");
        return;
      }

      // Bucket is private, so we sign a long-lived URL rather than relying
      // on a public one.
      const { data, error: signError } = await supabase.storage
        .from("attachments")
        .createSignedUrl(path, 60 * 60 * 24 * 365); // 1 year

      if (signError || !data) {
        setError("Upload succeeded but couldn't generate a link. Try again.");
        return;
      }

      onChange({
        url: data.signedUrl,
        name: file.name,
        type: file.type.startsWith("image/") ? "image" : "document",
      });
    } catch {
      setError("Upload failed. Try again.");
    } finally {
      setIsUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div>
      <Label>{label}</Label>
      {value ? (
        <div className="flex items-center gap-2 rounded-lg border border-border bg-bg px-3.5 py-2.5 max-w-xs">
          {value.type === "image" ? (
            <ImageIcon size={16} className="text-ink-muted shrink-0" />
          ) : (
            <FileText size={16} className="text-ink-muted shrink-0" />
          )}
          <span className="text-sm text-ink truncate flex-1">{value.name}</span>
          <button
            type="button"
            onClick={() => onChange(null)}
            className="text-ink-muted hover:text-danger shrink-0"
            aria-label="Remove attachment"
          >
            <X size={15} />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={isUploading}
          className="flex items-center gap-2 rounded-lg border border-dashed border-border bg-bg px-3.5 py-2.5 text-sm text-ink-muted hover:border-primary/40 hover:text-ink transition-colors disabled:opacity-60 max-w-xs"
        >
          {isUploading ? (
            <>
              <Loader2 size={16} className="animate-spin" /> Uploading…
            </>
          ) : (
            <>
              <Paperclip size={16} /> Attach a file or photo
            </>
          )}
        </button>
      )}
      {/* No `accept` restriction and no `capture` — lets clients/therapist
          attach worksheets (PDF, Word, etc.) or images, and mobile browsers
          still offer camera roll / take photo for image selection. */}
      <input ref={inputRef} type="file" onChange={handleFileChange} className="hidden" />
      {error && <p className="mt-1.5 text-sm text-danger">{error}</p>}
    </div>
  );
}
