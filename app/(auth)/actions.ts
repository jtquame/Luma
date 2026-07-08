"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import {
  loginSchema,
  setPasswordSchema,
  requestResetSchema,
  joinSchema,
  type LoginInput,
  type SetPasswordInput,
  type RequestResetInput,
  type JoinInput,
} from "@/lib/validations/auth";
import { checkRateLimit } from "@/lib/rate-limit";

type ActionResult = { error: string } | { error: null };

async function clientIp() {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
}

export async function login(input: LoginInput): Promise<ActionResult> {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const ip = await clientIp();
  const rl = checkRateLimit(`login:${ip}:${parsed.data.email}`, {
    limit: 5,
    windowMs: 15 * 60 * 1000,
  });
  if (!rl.allowed) {
    return { error: "Too many attempts. Try again in a few minutes." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) {
    // Deliberately generic — don't reveal whether the email exists.
    return { error: "Incorrect email or password." };
  }

  const { data: profile } = await supabase
    .from("users")
    .select("role, is_active")
    .eq("id", data.user.id)
    .single();

  if (profile?.is_active === false) {
    await supabase.auth.signOut();
    return { error: "This account has been deactivated. Contact your therapist." };
  }

  revalidatePath("/", "layout");
  redirect(profile?.role === "therapist" ? "/dashboard" : "/home");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}

export async function getInvitation(token: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .rpc("get_invitation_by_token", { p_token: token })
    .maybeSingle();

  if (error || !data) return null;
  return data;
}

export async function acceptInvitation(
  token: string,
  input: SetPasswordInput
): Promise<ActionResult> {
  const parsed = setPasswordSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const supabase = await createClient();
  const invite = await getInvitation(token);
  if (!invite) {
    return { error: "This invitation is invalid or has expired." };
  }

  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email: invite.email,
    password: parsed.data.password,
  });

  if (signUpError || !signUpData.user) {
    return { error: "Couldn't create your account. Contact your therapist." };
  }

  const { error: acceptError } = await supabase.rpc("accept_invitation", {
    p_token: token,
    p_user_id: signUpData.user.id,
  });

  if (acceptError) {
    return { error: "Couldn't finish setting up your account. Contact your therapist." };
  }

  revalidatePath("/", "layout");
  redirect("/home");
}

export async function requestPasswordReset(input: RequestResetInput): Promise<ActionResult> {
  const parsed = requestResetSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const ip = await clientIp();
  const rl = checkRateLimit(`reset:${ip}`, { limit: 3, windowMs: 15 * 60 * 1000 });
  if (!rl.allowed) {
    return { error: "Too many attempts. Try again in a few minutes." };
  }

  const supabase = await createClient();
  await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/reset-password/confirm`,
  });

  // Always return success, regardless of whether the email matched an
  // account, so this can't be used to enumerate client emails.
  return { error: null };
}

export async function joinWithCode(input: JoinInput): Promise<ActionResult> {
  const parsed = joinSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const ip = await clientIp();
  // Tighter limit than login — this is the one place a wrong guess is
  // trying codes, not passwords.
  const rl = checkRateLimit(`join:${ip}`, { limit: 8, windowMs: 15 * 60 * 1000 });
  if (!rl.allowed) {
    return { error: "Too many attempts. Try again in a few minutes." };
  }

  const supabase = await createClient();

  const { data: codeValid } = await supabase.rpc("verify_access_code", {
    p_code: parsed.data.accessCode,
  });
  if (!codeValid) {
    return { error: "That access code isn't valid. Double-check with your therapist." };
  }

  const { data: existing } = await supabase
    .from("users")
    .select("id")
    .eq("email", parsed.data.email)
    .maybeSingle();
  if (existing) {
    return { error: "An account with that email already exists. Try signing in instead." };
  }

  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (signUpError || !signUpData.user) {
    return { error: "Couldn't create your account. Try again." };
  }

  const { error: joinError } = await supabase.rpc("join_with_access_code", {
    p_code: parsed.data.accessCode,
    p_user_id: signUpData.user.id,
    p_first_name: parsed.data.firstName,
    p_last_name: parsed.data.lastName,
    p_email: parsed.data.email,
  });

  if (joinError) {
    return { error: "Couldn't finish setting up your account. Contact your therapist." };
  }

  revalidatePath("/", "layout");
  redirect("/home");
}
