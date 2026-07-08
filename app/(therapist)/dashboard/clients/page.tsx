import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { ClientRow } from "@/components/therapist/client-row";
import { AccessCodeCard } from "@/components/therapist/access-code-card";
import { getAccessCode } from "@/app/(therapist)/actions";

export default async function ClientsPage() {
  const supabase = await createClient();

  const { data: clients } = await supabase
    .from("users")
    .select("id, first_name, last_name, email, is_active, created_at")
    .eq("role", "client")
    .order("created_at", { ascending: false });

  const { code } = await getAccessCode();

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-2xl mb-1">Clients</h1>
        <p className="text-sm text-ink-muted">
          Share your access code so clients can create their own accounts.
        </p>
      </div>

      <AccessCodeCard initialCode={code} />

      <h2 className="eyebrow mb-3">Clients ({clients?.length ?? 0})</h2>
      {clients && clients.length > 0 ? (
        <Card className="p-0 divide-y divide-border">
          {clients.map((client) => (
            <ClientRow
              key={client.id}
              id={client.id}
              name={`${client.first_name} ${client.last_name}`}
              email={client.email}
              status={client.is_active ? "active" : "deactivated"}
            />
          ))}
        </Card>
      ) : (
        <Card>
          <p className="text-sm text-ink-muted">
            No clients yet. Share the access code above to get your first one.
          </p>
        </Card>
      )}
    </div>
  );
}
