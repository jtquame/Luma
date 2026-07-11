"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { startPathway } from "@/app/(client)/skill-building-actions";
import { Button } from "@/components/ui/button";

export function StartPathwayButton({ pathwayId }: { pathwayId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      disabled={isPending}
      onClick={() =>
        startTransition(async () => {
          await startPathway(pathwayId);
          router.refresh();
        })
      }
    >
      {isPending ? "Starting…" : "Start this pathway"}
    </Button>
  );
}
