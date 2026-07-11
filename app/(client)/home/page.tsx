import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import Link from "next/link";
import { randomQuote } from "@/lib/quotes";
import { isCheckInDue } from "@/lib/checkin-cadence";
import type { CheckInFrequency } from "@/lib/supabase/types";

export default async function ClientHomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("users")
    .select("first_name")
    .eq("id", user!.id)
    .single();

  const { data: activeCheckIns } = await supabase
    .from("templates")
    .select("id, frequency")
    .eq("kind", "check_in")
    .eq("is_active", true);

  const { data: lastResponses } = await supabase
    .from("responses")
    .select("template_id, submitted_at")
    .eq("client_id", user!.id)
    .order("submitted_at", { ascending: false });

  const { data: preferences } = await supabase
    .from("client_template_preferences")
    .select("template_id, frequency")
    .eq("client_id", user!.id);

  const preferenceByTemplate = new Map<string, CheckInFrequency>();
  for (const p of preferences ?? []) {
    preferenceByTemplate.set(p.template_id, p.frequency);
  }

  const lastSubmittedByTemplate = new Map<string, string>();
  for (const r of lastResponses ?? []) {
    if (!lastSubmittedByTemplate.has(r.template_id)) {
      lastSubmittedByTemplate.set(r.template_id, r.submitted_at);
    }
  }

  const pendingCount = (activeCheckIns ?? []).filter((t) => {
    const last = lastSubmittedByTemplate.get(t.id) ?? null;
    const effectiveFrequency =
      preferenceByTemplate.get(t.id) ?? (t.frequency as CheckInFrequency | null) ?? "daily";
    return isCheckInDue(effectiveFrequency, last);
  }).length;

  const { data: latestPost } = await supabase
    .from("blog_posts")
    .select("title, slug")
    .eq("is_published", true)
    .order("published_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data: pendingAssignments } = await supabase
    .from("assignments")
    .select("id, title")
    .eq("client_id", user!.id)
    .eq("status", "assigned")
    .order("created_at", { ascending: false });

  const { data: latestAnnouncement } = await supabase
    .from("announcements")
    .select("title, body")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return (
    <div>
      <div className="mb-10 animate-fade-rise">
        <h1 className="font-display text-3xl mb-2">Hi, {profile?.first_name ?? "there"}.</h1>
        <p className="text-sm text-ink-muted italic">"{randomQuote()}"</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link href="/check-in">
          <Card className="hover:border-primary/40 transition-colors h-full">
            <p className="eyebrow mb-2">Today's check-in</p>
            {!activeCheckIns || activeCheckIns.length === 0 ? (
              <p className="text-sm text-ink-muted">
                Not set up yet — Samara will assign your first check-in soon.
              </p>
            ) : pendingCount === 0 ? (
              <p className="text-sm text-ink-muted">All done for today.</p>
            ) : (
              <p className="text-sm text-primary font-medium">
                {pendingCount} check-in{pendingCount === 1 ? "" : "s"} waiting →
              </p>
            )}
          </Card>
        </Link>

        <Link href={latestPost ? `/blog/${latestPost.slug}` : "/blog"}>
          <Card className="hover:border-primary/40 transition-colors h-full">
            <p className="eyebrow mb-2">Latest from the blog</p>
            <p className="text-sm text-ink-muted">
              {latestPost ? latestPost.title : "Nothing published yet."}
            </p>
          </Card>
        </Link>

        <Link href="/reflections">
          <Card className="hover:border-primary/40 transition-colors h-full">
            <p className="eyebrow mb-2">What's assigned</p>
            {!pendingAssignments || pendingAssignments.length === 0 ? (
              <p className="text-sm text-ink-muted">Nothing assigned right now.</p>
            ) : (
              <p className="text-sm text-primary font-medium">
                {pendingAssignments.length} assignment{pendingAssignments.length === 1 ? "" : "s"}{" "}
                waiting →
              </p>
            )}
          </Card>
        </Link>

        <Link href="/announcements">
          <Card className="hover:border-primary/40 transition-colors h-full">
            <p className="eyebrow mb-2">Announcements</p>
            <p className="text-sm text-ink-muted">
              {latestAnnouncement ? latestAnnouncement.title : "Nothing posted yet."}
            </p>
          </Card>
        </Link>
      </div>
    </div>
  );
}
