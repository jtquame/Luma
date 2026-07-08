import { getInvitation } from "../actions";
import { AcceptInviteForm } from "./accept-invite-form";
import { Card } from "@/components/ui/card";

export default async function AcceptInvitePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  const invite = token ? await getInvitation(token) : null;

  if (!token || !invite) {
    return (
      <Card>
        <h2 className="font-display text-xl mb-2">This link isn't valid</h2>
        <p className="text-sm text-ink-muted">
          Invitation links expire after 7 days and can only be used once. If
          you think this is a mistake, reach out to your therapist for a new
          invitation.
        </p>
      </Card>
    );
  }

  return (
    <Card>
      <h2 className="font-display text-xl mb-1">Welcome, {invite.first_name}</h2>
      <p className="text-sm text-ink-muted mb-6">
        Set a password to finish creating your account.
      </p>
      <AcceptInviteForm token={token} email={invite.email} />
    </Card>
  );
}
