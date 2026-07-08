"use client";

import { useTransition } from "react";
import { markResponseReviewed } from "@/app/(therapist)/templates-actions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";

interface ResponseSummary {
  id: string;
  templateTitle: string;
  clientName: string;
  submittedAt: string;
  reviewedAt: string | null;
}

function ResponseRow({ r }: { r: ResponseSummary }) {
  const [isPending, startTransition] = useTransition();

  return (
    <Card className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-ink">
          {r.clientName} <span className="text-ink-muted font-normal">— {r.templateTitle}</span>
        </p>
        <p className="eyebrow mt-1">
          {formatDistanceToNow(new Date(r.submittedAt), { addSuffix: true })}
        </p>
      </div>
      {r.reviewedAt ? (
        <span className="text-sm text-primary">Reviewed</span>
      ) : (
        <Button
          variant="ghost"
          size="sm"
          disabled={isPending}
          onClick={() => startTransition(() => markResponseReviewed(r.id))}
        >
          Mark reviewed
        </Button>
      )}
    </Card>
  );
}

export function RecentResponses({ responses }: { responses: ResponseSummary[] }) {
  if (responses.length === 0) return null;

  return (
    <div className="mt-8">
      <h2 className="eyebrow mb-3">Recent responses</h2>
      <div className="space-y-3">
        {responses.map((r) => (
          <ResponseRow key={r.id} r={r} />
        ))}
      </div>
    </div>
  );
}
