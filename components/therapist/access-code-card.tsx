"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { regenerateAccessCode, setAccessCode } from "@/app/(therapist)/actions";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff, RefreshCw } from "lucide-react";

export function AccessCodeCard({ initialCode }: { initialCode: string | null }) {
  const router = useRouter();
  const [code, setCode] = useState(initialCode ?? "");
  const [editValue, setEditValue] = useState(initialCode ?? "");
  const [editing, setEditing] = useState(false);
  const [visible, setVisible] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleRegenerate() {
    setError(null);
    startTransition(async () => {
      const result = await regenerateAccessCode();
      if (result.error) setError(result.error);
      else {
        setCode(result.code ?? "");
        setEditValue(result.code ?? "");
        setVisible(true);
        router.refresh();
      }
    });
  }

  function handleSave() {
    setError(null);
    startTransition(async () => {
      const result = await setAccessCode(editValue);
      if (result.error) setError(result.error);
      else {
        setCode(result.code ?? "");
        setEditing(false);
        setVisible(true);
        router.refresh();
      }
    });
  }

  return (
    <Card className="mb-8">
      <h2 className="font-display text-lg mb-1">Access code</h2>
      <p className="text-sm text-ink-muted mb-4">
        Share this with clients directly — they'll enter it at{" "}
        <span className="font-mono text-xs">/join</span> to create their own account.
        Anyone with the code can sign up, so treat it like a shared password
        and rotate it if it gets passed around too widely.
      </p>

      {editing ? (
        <div className="flex items-center gap-2">
          <Input
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            className="w-48 font-mono"
          />
          <Button size="sm" onClick={handleSave} disabled={isPending}>
            Save
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              setEditing(false);
              setEditValue(code);
            }}
          >
            Cancel
          </Button>
        </div>
      ) : (
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 rounded-lg border border-border bg-bg px-3.5 py-2">
            <span className="font-mono text-sm tracking-wider">
              {visible ? code : "•".repeat(Math.max(code.length, 6))}
            </span>
            <button
              onClick={() => setVisible((v) => !v)}
              className="text-ink-muted hover:text-ink"
              aria-label={visible ? "Hide code" : "Show code"}
            >
              {visible ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
          <Button size="sm" variant="secondary" onClick={() => setEditing(true)}>
            Set custom code
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleRegenerate}
            disabled={isPending}
          >
            <RefreshCw size={14} /> Generate new
          </Button>
        </div>
      )}

      {error && <p className="mt-3 text-sm text-danger">{error}</p>}
    </Card>
  );
}
