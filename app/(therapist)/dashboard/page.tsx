import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";

export default async function DashboardPage() {
  const supabase = await createClient();

  const today = new Date().toISOString().slice(0, 10);
  const [{ count: clientCount }, { count: pendingInvites }, { count: checkInsToday }] =
    await Promise.all([
      supabase.from("users").select("*", { count: "exact", head: true }).eq("role", "client"),
      supabase
        .from("invitations")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending"),
      supabase
        .from("responses")
        .select("*", { count: "exact", head: true })
        .gte("submitted_at", `${today}T00:00:00Z`),
    ]);

  return (
    <div>
      <h1 className="font-display text-2xl mb-1">Overview</h1>
      <p className="text-sm text-ink-muted mb-8">A quick look at your practice on Luma.</p>

      <div className="grid grid-cols-3 gap-4 mb-8">
        <Card className="p-5">
          <p className="eyebrow mb-1">Active clients</p>
          <p className="font-display text-3xl">{clientCount ?? 0}</p>
        </Card>
        <Card className="p-5">
          <p className="eyebrow mb-1">Pending invites</p>
          <p className="font-display text-3xl">{pendingInvites ?? 0}</p>
        </Card>
        <Card className="p-5">
          <p className="eyebrow mb-1">Check-ins today</p>
          <p className="font-display text-3xl">{checkInsToday ?? 0}</p>
        </Card>
      </div>

      <Card>
        <h2 className="font-display text-lg mb-3">Getting started</h2>
        <ol className="text-sm text-ink-muted space-y-2 list-decimal list-inside">
          <li>Invite your first client from the Clients page.</li>
          <li>Build a check-in template so clients have something to respond to.</li>
          <li>Add a book recommendation or blog post to give the portal some content.</li>
        </ol>
      </Card>
    </div>
  );
}
