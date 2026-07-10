import type { CheckInFrequency } from "@/lib/supabase/types";

const FREQUENCY_DAYS: Record<CheckInFrequency, number> = {
  daily: 1,
  weekly: 7,
  biweekly: 14,
  monthly: 30,
};

/** Whether a client can submit this check-in again right now. */
export function isCheckInDue(
  frequency: CheckInFrequency | null,
  lastSubmittedAt: string | null
): boolean {
  if (!lastSubmittedAt) return true;
  const freq = frequency ?? "daily";

  if (freq === "daily") {
    // Calendar-day comparison (UTC) rather than a strict 24h window, so
    // "daily" lines up with what a client expects ("once per day").
    const lastDate = new Date(lastSubmittedAt).toISOString().slice(0, 10);
    const today = new Date().toISOString().slice(0, 10);
    return lastDate !== today;
  }

  const daysSince = (Date.now() - new Date(lastSubmittedAt).getTime()) / (1000 * 60 * 60 * 24);
  return daysSince >= FREQUENCY_DAYS[freq];
}

/** Human-readable "come back in N days" style message for a completed check-in. */
export function nextAvailableMessage(
  frequency: CheckInFrequency | null,
  lastSubmittedAt: string
): string {
  const freq = frequency ?? "daily";
  if (freq === "daily") return "Completed for today — see you tomorrow.";

  const daysSince = (Date.now() - new Date(lastSubmittedAt).getTime()) / (1000 * 60 * 60 * 24);
  const daysLeft = Math.max(0, Math.ceil(FREQUENCY_DAYS[freq] - daysSince));
  if (daysLeft === 0) return "Completed — check back soon.";
  return `Completed — next one available in ${daysLeft} day${daysLeft === 1 ? "" : "s"}.`;
}
