"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { inviteClientSchema, type InviteClientInput } from "@/lib/validations/auth";
import { sendInvitationEmail } from "@/lib/email/resend";

type ActionResult = { error: string | null };

async function requireTherapist() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "therapist") throw new Error("Not authorized");
  return { supabase, user };
}

async function logAction(
  supabase: Awaited<ReturnType<typeof createClient>>,
  actorId: string,
  action: string,
  targetType?: string,
  targetId?: string,
  metadata?: Record<string, unknown>
) {
  await supabase.from("audit_log").insert({
    actor_id: actorId,
    action,
    target_type: targetType,
    target_id: targetId,
    metadata: metadata ?? {},
  });
}

export async function inviteClient(input: InviteClientInput): Promise<ActionResult> {
  const parsed = inviteClientSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const { supabase, user } = await requireTherapist();

  const { data: existing } = await supabase
    .from("users")
    .select("id")
    .eq("email", parsed.data.email)
    .maybeSingle();

  if (existing) {
    return { error: "A client with that email already exists." };
  }

  const { data: invitation, error } = await supabase
    .from("invitations")
    .insert({
      email: parsed.data.email,
      first_name: parsed.data.firstName,
      last_name: parsed.data.lastName,
      invited_by: user.id,
    })
    .select("token")
    .single();

  if (error || !invitation) {
    return { error: "Couldn't create the invitation. Try again." };
  }

  try {
    await sendInvitationEmail({
      to: parsed.data.email,
      firstName: parsed.data.firstName,
      token: invitation.token,
    });
  } catch {
    return {
      error:
        "Invitation was created, but the email couldn't be sent. Share the invite link with your client directly.",
    };
  }

  await logAction(supabase, user.id, "invitation.sent", "invitation", invitation.token, {
    email: parsed.data.email,
  });

  revalidatePath("/dashboard/clients");
  return { error: null };
}

export async function revokeInvitation(invitationId: string): Promise<ActionResult> {
  const { supabase, user } = await requireTherapist();

  const { error } = await supabase
    .from("invitations")
    .update({ status: "revoked" })
    .eq("id", invitationId);

  if (error) return { error: "Couldn't revoke the invitation." };

  await logAction(supabase, user.id, "invitation.revoked", "invitation", invitationId);
  revalidatePath("/dashboard/clients");
  return { error: null };
}

export async function setClientActive(
  clientId: string,
  isActive: boolean
): Promise<ActionResult> {
  const { supabase, user } = await requireTherapist();

  const { error } = await supabase
    .from("users")
    .update({ is_active: isActive })
    .eq("id", clientId)
    .eq("role", "client");

  if (error) return { error: "Couldn't update that client." };

  await logAction(
    supabase,
    user.id,
    isActive ? "client.reactivated" : "client.deactivated",
    "user",
    clientId
  );
  revalidatePath("/dashboard/clients");
  return { error: null };
}

export async function getAccessCode(): Promise<{ code: string | null }> {
  const { supabase } = await requireTherapist();
  const { data } = await supabase.from("access_gate").select("code").single();
  return { code: data?.code ?? null };
}

export async function regenerateAccessCode(): Promise<{ code: string | null; error: string | null }> {
  const { supabase, user } = await requireTherapist();

  // Short, easy to say out loud or text — this isn't a login password, it's
  // a shared gate a client types once.
  const newCode = Math.random().toString(36).slice(2, 8).toUpperCase();

  const { data, error } = await supabase
    .from("access_gate")
    .update({ code: newCode })
    .eq("id", true)
    .select("code")
    .single();

  if (error || !data) return { code: null, error: "Couldn't update the access code." };

  await logAction(supabase, user.id, "access_code.regenerated");
  revalidatePath("/dashboard/clients");
  return { code: data.code, error: null };
}

export async function setAccessCode(code: string): Promise<{ code: string | null; error: string | null }> {
  const trimmed = code.trim();
  if (trimmed.length < 4) return { code: null, error: "Use at least 4 characters." };

  const { supabase, user } = await requireTherapist();

  const { data, error } = await supabase
    .from("access_gate")
    .update({ code: trimmed })
    .eq("id", true)
    .select("code")
    .single();

  if (error || !data) return { code: null, error: "Couldn't update the access code." };

  await logAction(supabase, user.id, "access_code.set");
  revalidatePath("/dashboard/clients");
  return { code: data.code, error: null };
}
