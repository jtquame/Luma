import { createClient } from "@/lib/supabase/server";
import { TermsEditor } from "@/components/therapist/terms-editor";
import { Card } from "@/components/ui/card";

export default async function TherapistTermsPage() {
  const supabase = await createClient();

  const { data: terms } = await supabase.from("terms_content").select("body, version").single();

  const { data: clients } = await supabase
    .from("users")
    .select("id, first_name, last_name")
    .eq("role", "client")
    .order("first_name");

  const { data: acceptances } = await supabase
    .from("terms_acceptances")
    .select("client_id, version, accepted_at")
    .order("accepted_at", { ascending: false });

  const currentVersion = terms?.version ?? 1;
  const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;

  const latestByClient = new Map<string, { version: number; accepted_at: string }>();
  for (const a of acceptances ?? []) {
    if (!latestByClient.has(a.client_id)) latestByClient.set(a.client_id, a);
  }

  return (
    <div>
      <h1 className="font-display text-2xl mb-1">Terms & conditions</h1>
      <p className="text-sm text-ink-muted mb-8">
        Edit the terms clients must accept, and see who's up to date.
      </p>

      <div className="mb-8">
        <TermsEditor body={terms?.body ?? ""} version={currentVersion} />
      </div>

      <h2 className="eyebrow mb-3">Client acceptance status</h2>
      {!clients || clients.length === 0 ? (
        <p className="text-sm text-ink-muted">No clients yet.</p>
      ) : (
        <Card className="p-0 divide-y divide-border">
          {clients.map((c) => {
            const latest = latestByClient.get(c.id);
            const isCurrent =
              latest &&
              latest.version === currentVersion &&
              new Date(latest.accepted_at).getTime() > thirtyDaysAgo;
            return (
              <div key={c.id} className="flex items-center justify-between px-6 py-4">
                <p className="text-sm font-medium text-ink">
                  {c.first_name} {c.last_name}
                </p>
                {isCurrent ? (
                  <span className="text-sm text-primary">
                    Signed {new Date(latest.accepted_at).toLocaleDateString()}
                  </span>
                ) : (
                  <span className="text-sm text-danger">Needs to sign</span>
                )}
              </div>
            );
          })}
        </Card>
      )}
    </div>
  );
}
