import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { format } from "date-fns";

export default async function ClientSupportGroupsPage() {
  const supabase = await createClient();
  const { data: groups } = await supabase
    .from("support_groups")
    .select("id, title, description, who_should_attend, meets_at, location, virtual_link, is_recurring")
    .order("meets_at", { ascending: true, nullsFirst: false });

  return (
    <div>
      <h1 className="font-display text-2xl mb-8">Support groups</h1>

      {!groups || groups.length === 0 ? (
        <Card>
          <p className="text-sm text-ink-muted">No support groups posted yet.</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {groups.map((g) => (
            <Card key={g.id}>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-display text-lg">{g.title}</h3>
                {g.is_recurring && (
                  <span className="rounded-full bg-sage px-2 py-0.5 text-xs text-sage-foreground">
                    Recurring
                  </span>
                )}
              </div>
              <p className="eyebrow mb-2">
                {g.meets_at && format(new Date(g.meets_at), "MMM d, yyyy 'at' h:mm a")}
                {g.location && ` · ${g.location}`}
              </p>
              {g.description && <p className="text-sm text-ink-muted mb-2">{g.description}</p>}
              {g.who_should_attend && (
                <p className="text-sm text-ink-muted mb-2">
                  <span className="font-medium text-ink">Who should attend: </span>
                  {g.who_should_attend}
                </p>
              )}
              {g.virtual_link && (
                <a
                  href={g.virtual_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-accent hover:underline"
                >
                  Join virtually
                </a>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
