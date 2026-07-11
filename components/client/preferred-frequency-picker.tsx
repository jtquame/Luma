"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setPreferredCheckInFrequency } from "@/app/(client)/checkin-preferences-actions";
import type { CheckInFrequency } from "@/lib/supabase/types";

const OPTIONS: { value: CheckInFrequency; label: string }[] = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "biweekly", label: "Every 2 weeks" },
  { value: "monthly", label: "Monthly" },
];

export function PreferredFrequencyPicker({ current }: { current: CheckInFrequency }) {
  const router = useRouter();
  const [value, setValue] = useState(current);
  const [isPending, startTransition] = useTransition();

  function handleChange(next: CheckInFrequency) {
    setValue(next);
    startTransition(async () => {
      await setPreferredCheckInFrequency({ frequency: next });
      router.refresh();
    });
  }

  return (
    <label className="flex items-center gap-2 text-sm text-ink-muted">
      How often do you want check-ins?
      <select
        value={value}
        disabled={isPending}
        onChange={(e) => handleChange(e.target.value as CheckInFrequency)}
        className="rounded-md border border-border bg-surface px-2.5 py-1.5 text-sm text-ink"
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
