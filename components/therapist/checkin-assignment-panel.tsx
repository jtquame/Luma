"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setClientCheckInAssignment } from "@/app/(therapist)/templates-actions";

interface ClientOption {
  id: string;
  name: string;
}

export function CheckInAssignmentPanel({
  templateId,
  clients,
  assignedClientIds,
}: {
  templateId: string;
  clients: ClientOption[];
  assignedClientIds: string[];
}) {
  const router = useRouter();
  const [assigned, setAssigned] = useState(new Set(assignedClientIds));
  const [isPending, startTransition] = useTransition();

  function toggle(clientId: string) {
    const willAssign = !assigned.has(clientId);
    setAssigned((prev) => {
      const next = new Set(prev);
      if (willAssign) next.add(clientId);
      else next.delete(clientId);
      return next;
    });
    startTransition(async () => {
      await setClientCheckInAssignment(clientId, templateId, willAssign);
      router.refresh();
    });
  }

  if (clients.length === 0) {
    return <p className="text-sm text-ink-muted">Invite a client first.</p>;
  }

  return (
    <div className="space-y-1.5">
      {clients.map((c) => (
        <label key={c.id} className="flex items-center gap-2.5 text-sm text-ink cursor-pointer">
          <input
            type="checkbox"
            checked={assigned.has(c.id)}
            disabled={isPending}
            onChange={() => toggle(c.id)}
            className="accent-primary"
          />
          {c.name}
        </label>
      ))}
    </div>
  );
}
