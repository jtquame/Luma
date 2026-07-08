import { Resend } from "resend";

function getResendClient() {
  if (!process.env.RESEND_API_KEY) {
    throw new Error(
      "RESEND_API_KEY isn't set — email invites are unused by default; set it in .env.local if you want to re-enable them."
    );
  }
  return new Resend(process.env.RESEND_API_KEY);
}

const FROM = "Tribe Works Behavioral Services <hello@tribeworksbehavioralservices.com>";

export async function sendInvitationEmail({
  to,
  firstName,
  token,
}: {
  to: string;
  firstName: string;
  token: string;
}) {
  const resend = getResendClient();
  const link = `${process.env.NEXT_PUBLIC_SITE_URL}/accept-invite?token=${token}`;

  await resend.emails.send({
    from: FROM,
    to,
    subject: "You're invited to Luma",
    html: `
      <div style="font-family: 'Work Sans', Arial, sans-serif; max-width: 480px; margin: 0 auto; color: #26261F;">
        <h1 style="font-family: Georgia, serif; font-size: 22px; color: #26261F;">Hi ${firstName},</h1>
        <p style="font-size: 15px; line-height: 1.6;">
          Samara has set up a private space for you on Luma — a place to
          check in between sessions, and find the resources she's shared
          with you.
        </p>
        <p style="margin: 28px 0;">
          <a href="${link}" style="background:#57612F;color:#F7F1E6;padding:12px 24px;
             border-radius:8px;text-decoration:none;font-size:15px;display:inline-block;">
            Set up your account
          </a>
        </p>
        <p style="font-size: 13px; color: #6E6A5A;">
          This link expires in 7 days. If you weren't expecting this invite,
          you can ignore this email.
        </p>
      </div>
    `,
  });
}

export async function sendPasswordResetNotice() {
  // Placeholder hook — Supabase Auth sends the actual reset email itself
  // (see requestPasswordReset in app/(auth)/actions.ts). Kept here in case
  // Samara later wants a branded template instead of the Supabase default.
}
