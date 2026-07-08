"use client";

import { useTransition } from "react";
import { revokeInvitation, setClientActive } from "@/app/(therapist)/actions";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";

type Status = "pending" | "active" | "deactivated";

export function ClientRow({
  id,
  name,
  email,
  status,
  expiresAt,
}: {
  id: string;
  name: string;
  email: string;
  status: Status;
  expiresAt?: string;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex items-center justify-between px-6 py-4">
      <div>
        <p className="text-sm font-medium text-ink">{name}</p>
        <p className="text-sm text-ink-muted">{email}</p>
      </div>
      <div className="flex items-center gap-3">
        {status === "pending" && expiresAt && (
          <span className="eyebrow text-accent">
            expires {formatDistanceToNow(new Date(expiresAt), { addSuffix: true })}
          </span>
        )}
        {status === "deactivated" && (
          <span className="rounded-full bg-danger/10 px-2.5 py-0.5 text-xs text-danger">
            Deactivated
          </span>
        )}

        {status === "pending" && (
          <Button
            variant="ghost"
            size="sm"
            disabled={isPending}
            onClick={() => startTransition(() => revokeInvitation(id))}
          >
            Revoke
          </Button>
        )}
        {status === "active" && (
          <Button
            variant="ghost"
            size="sm"
            disabled={isPending}
            onClick={() => startTransition(() => setClientActive(id, false))}
          >
            Deactivate
          </Button>
        )}
        {status === "deactivated" && (
          <Button
            variant="secondary"
            size="sm"
            disabled={isPending}
            onClick={() => startTransition(() => setClientActive(id, true))}
          >
            Reactivate
          </Button>
        )}
      </div>
    </div>
  );
}
