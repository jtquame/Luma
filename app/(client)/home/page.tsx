import { createClient } from "@/lib/supabase/server";
import { BreathingOrb } from "@/components/client/breathing-orb";
import { Card } from "@/components/ui/card";
import Link from "next/link";
import { format } from "date-fns";

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

  const { data: settings } = await supabase.from("settings").select("welcome_message").single();

  const { data: activeCheckIns } = await supabase
    .from("templates")
    .select("id")
    .eq("kind", "check_in")
    .eq("is_active", true);

  const today = new Date().toISOString().slice(0, 10);
  const { data: todaysResponses } = await supabase
    .from("responses")
    .select("template_id")
    .eq("client_id", user!.id)
    .gte("submitted_at", `${today}T00:00:00Z`);

  const completedIds = new Set((todaysResponses ?? []).map((r) => r.template_id));
  const pendingCount = (activeCheckIns ?? []).filter((t) => !completedIds.has(t.id)).length;

  const { data: latestPost } = await supabase
    .from("blog_posts")
    .select("title, slug")
    .eq("is_published", true)
    .order("published_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data: featuredBook } = await supabase
    .from("books")
    .select("title, author")
    .eq("status", "recommended")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data: currentlyReading } = await supabase
    .from("currently_reading")
    .select("book_title, author")
    .single();

  const { data: nextGroup } = await supabase
    .from("support_groups")
    .select("title, meets_at")
    .gte("meets_at", new Date().toISOString())
    .order("meets_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  return (
    <div>
      <div className="flex items-center gap-6 mb-10 animate-fade-rise">
        <BreathingOrb />
        <div>
          <p className="eyebrow mb-1">Welcome back</p>
          <h1 className="font-display text-3xl mb-1">Hi, {profile?.first_name ?? "there"}.</h1>
          <p className="text-sm text-ink-muted">
            {settings?.welcome_message ?? "Glad you're here."}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Link href="/check-in">
          <Card className="hover:border-primary/40 transition-colors">
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
          <Card className="hover:border-primary/40 transition-colors">
            <p className="eyebrow mb-2">Latest from the blog</p>
            <p className="text-sm text-ink-muted">
              {latestPost ? latestPost.title : "Nothing published yet."}
            </p>
          </Card>
        </Link>
        <Link href="/books">
          <Card className="hover:border-primary/40 transition-colors">
            <p className="eyebrow mb-2">Recommended book</p>
            <p className="text-sm text-ink-muted">
              {featuredBook ? `${featuredBook.title} — ${featuredBook.author}` : "Not shared yet."}
            </p>
          </Card>
        </Link>
        <Card>
          <p className="eyebrow mb-2">What Samara's reading</p>
          <p className="text-sm text-ink-muted">
            {currentlyReading?.book_title
              ? `${currentlyReading.book_title}${currentlyReading.author ? ` — ${currentlyReading.author}` : ""}`
              : "Not shared yet."}
          </p>
        </Card>
        <Link href="/support-groups" className="col-span-2">
          <Card className="hover:border-primary/40 transition-colors">
            <p className="eyebrow mb-2">Support group</p>
            <p className="text-sm text-ink-muted">
              {nextGroup
                ? `${nextGroup.title} · ${format(new Date(nextGroup.meets_at!), "MMM d, yyyy 'at' h:mm a")}`
                : "No upcoming meetings posted."}
            </p>
          </Card>
        </Link>
      </div>
    </div>
  );
}
