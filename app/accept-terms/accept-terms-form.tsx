"use client";

import { useTransition, useState } from "react";
import { acceptTerms } from "@/app/(client)/terms-actions";
import { Button } from "@/components/ui/button";

export function AcceptTermsForm() {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <div>
      {error && (
        <div className="mb-4 rounded-lg bg-danger/10 px-3.5 py-2.5 text-sm text-danger">
          {error}
        </div>
      )}
      <Button
        className="w-full"
        disabled={isPending}
        onClick={() =>
          startTransition(async () => {
            const result = await acceptTerms();
            if (result?.error) setError(result.error);
          })
        }
      >
        {isPending ? "Saving…" : "I agree — continue"}
      </Button>
    </div>
  );
}
