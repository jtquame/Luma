"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setCheckInPreference } from "@/app/(client)/checkin-preferences-actions";
import type { CheckInFrequency } from "@/lib/supabase/types";

const OPTIONS: { value: CheckInFrequency; label: string }[] = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "biweekly", label: "Every 2 weeks" },
  { value: "monthly", label: "Monthly" },
];

export function CheckInFrequencyPicker({
  templateId,
  currentFrequency,
}: {
  templateId: string;
  currentFrequency: CheckInFrequency;
}) {
  const router = useRouter();
  const [value, setValue] = useState(currentFrequency);
  const [isPending, startTransition] = useTransition();

  function handleChange(next: CheckInFrequency) {
    setValue(next);
    startTransition(async () => {
      await setCheckInPreference({ templateId, frequency: next });
      router.refresh();
    });
  }

  return (
    <label className="flex items-center gap-2 text-xs text-ink-muted">
      Remind me:
      <select
        value={value}
        disabled={isPending}
        onChange={(e) => handleChange(e.target.value as CheckInFrequency)}
        className="rounded-md border border-border bg-surface px-2 py-1 text-xs text-ink"
      >
        {OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}
