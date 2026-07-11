"use client";

import { useState, useTransition } from "react";
import { markResponseReviewed } from "@/app/(therapist)/templates-actions";
import { getResponseDetail, type ResponseDetailItem } from "@/app/(therapist)/response-actions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { ChevronDown, ChevronUp, Lock } from "lucide-react";

interface ResponseSummary {
  id: string;
  templateTitle: string;
  clientName: string;
  submittedAt: string;
  reviewedAt: string | null;
  shared: boolean;
}

function ResponseRow({ r }: { r: ResponseSummary }) {
  const [isPending, startTransition] = useTransition();
  const [expanded, setExpanded] = useState(false);
  const [items, setItems] = useState<ResponseDetailItem[] | null>(null);
  const [notShared, setNotShared] = useState(false);

  function handleToggle() {
    if (expanded) {
      setExpanded(false);
      return;
    }
    setExpanded(true);
    if (items === null && !notShared) {
      startTransition(async () => {
        const result = await getResponseDetail(r.id);
        if (result.error === "not_shared") setNotShared(true);
        else setItems(result.items);
      });
    }
  }

  return (
    <Card>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium text-ink">
              {r.clientName} <span className="text-ink-muted font-normal">— {r.templateTitle}</span>
            </p>
            {r.shared ? (
              <span className="rounded-full bg-sage px-2 py-0.5 text-xs text-sage-foreground">
                Shared
              </span>
            ) : (
              <span className="flex items-center gap-1 rounded-full bg-border px-2 py-0.5 text-xs text-ink-muted">
                <Lock size={10} /> Private
              </span>
            )}
          </div>
          <p className="eyebrow mt-1">
            {formatDistanceToNow(new Date(r.submittedAt), { addSuffix: true })}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
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
          <Button variant="ghost" size="sm" onClick={handleToggle}>
            {expanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
          </Button>
        </div>
      </div>

      {expanded && (
        <div className="mt-4 pt-4 border-t border-border">
          {notShared ? (
            <p className="text-sm text-ink-muted italic">
              They answered this but haven't chosen to share the details.
            </p>
          ) : items === null ? (
            <p className="text-sm text-ink-muted">Loading…</p>
          ) : (
            <div className="space-y-3">
              {items.map((item, i) => (
                <div key={i}>
                  <p className="text-sm font-medium text-ink">{item.question}</p>
                  <p className="text-sm text-ink-muted">{item.answer}</p>
                </div>
              ))}
            </div>
          )}
        </div>
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
