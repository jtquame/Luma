"use client";

import type { QuestionType, QuestionConfig, AnswerValue } from "@/lib/supabase/types";

export function QuestionField({
  type,
  config,
  value,
  onChange,
}: {
  type: QuestionType;
  config: QuestionConfig;
  value: AnswerValue | undefined;
  onChange: (value: AnswerValue) => void;
}) {
  switch (type) {
    case "single_choice":
      return (
        <div className="space-y-2">
          {config.options?.map((opt) => (
            <label
              key={opt}
              className="flex items-center gap-2.5 rounded-lg border border-border px-3.5 py-2.5 text-sm cursor-pointer has-[:checked]:border-primary has-[:checked]:bg-primary/5"
            >
              <input
                type="radio"
                checked={value === opt}
                onChange={() => onChange(opt)}
                className="accent-primary"
              />
              {opt}
            </label>
          ))}
        </div>
      );

    case "multi_choice": {
      const selected = (value as string[] | undefined) ?? [];
      return (
        <div className="space-y-2">
          {config.options?.map((opt) => (
            <label
              key={opt}
              className="flex items-center gap-2.5 rounded-lg border border-border px-3.5 py-2.5 text-sm cursor-pointer has-[:checked]:border-primary has-[:checked]:bg-primary/5"
            >
              <input
                type="checkbox"
                checked={selected.includes(opt)}
                onChange={(e) =>
                  onChange(
                    e.target.checked
                      ? [...selected, opt]
                      : selected.filter((o) => o !== opt)
                  )
                }
                className="accent-primary"
              />
              {opt}
            </label>
          ))}
        </div>
      );
    }

    case "scale": {
      const min = config.min ?? 1;
      const max = config.max ?? 5;
      const options = Array.from({ length: max - min + 1 }, (_, i) => min + i);
      return (
        <div className="flex gap-2">
          {options.map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => onChange(n)}
              className={`h-11 w-11 rounded-full border text-sm font-medium transition-colors ${
                value === n
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-border text-ink-muted hover:border-primary/40"
              }`}
            >
              {n}
            </button>
          ))}
        </div>
      );
    }

    case "slider": {
      const min = config.min ?? 0;
      const max = config.max ?? 100;
      const current = (value as number | undefined) ?? Math.round((min + max) / 2);
      return (
        <div>
          <input
            type="range"
            min={min}
            max={max}
            value={current}
            onChange={(e) => onChange(Number(e.target.value))}
            className="w-full accent-primary"
          />
          <p className="text-sm text-ink-muted mt-1">{current}</p>
        </div>
      );
    }

    case "yes_no":
      return (
        <div className="flex gap-2">
          {[true, false].map((b) => (
            <button
              key={String(b)}
              type="button"
              onClick={() => onChange(b)}
              className={`rounded-lg border px-5 py-2 text-sm font-medium transition-colors ${
                value === b
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-border text-ink-muted hover:border-primary/40"
              }`}
            >
              {b ? "Yes" : "No"}
            </button>
          ))}
        </div>
      );

    case "short_reflection": {
      const maxLength = config.max_length ?? 250;
      const text = (value as string | undefined) ?? "";
      return (
        <div>
          <textarea
            value={text}
            maxLength={maxLength}
            onChange={(e) => onChange(e.target.value)}
            rows={3}
            className="w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          />
          <p className="text-xs text-ink-muted mt-1 text-right">
            {text.length}/{maxLength}
          </p>
        </div>
      );
    }

    default:
      return null;
  }
}
