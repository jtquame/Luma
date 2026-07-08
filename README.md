# Luma

A private client portal for Tribe Works Behavioral Services — Samara Lynch's
one-therapist, invite-only practice. Clients complete structured check-ins,
read Samara's blog and book recommendations, and stay connected to support
groups between sessions. There is no free-text journaling, messaging, or AI
chat by design — see `DESIGN.md` for the reasoning and the master spec this
was built from.

## Stack

- Next.js 15 (App Router) + TypeScript
- Supabase (Postgres, Auth, Row Level Security)
- Tailwind CSS + shadcn/ui-style primitives
- Resend for transactional email (invitations, notifications)

## Local setup

1. Install dependencies:
   ```
   npm install
   ```
2. Create a Supabase project, then copy `.env.example` to `.env.local` and
   fill in the values from Project Settings → API.
3. Run the migrations against your Supabase project (SQL editor or CLI), in
   order:
   ```
   supabase/migrations/0001_init.sql
   supabase/migrations/0002_accept_invitation.sql
   supabase/migrations/0003_check_ins_prompts.sql
   supabase/migrations/0004_blog.sql
   supabase/migrations/0005_books.sql
   supabase/migrations/0006_currently_reading.sql
   supabase/migrations/0007_webinars.sql
   supabase/migrations/0008_support_groups.sql
   supabase/migrations/0009_access_code.sql
   ```
4. Promote yourself (Samara) to therapist. Sign up once through Supabase
   Auth directly (or the login page after a manual `auth.users` insert),
   then run:
   ```sql
   update public.users set role = 'therapist' where email = 'samara@...';
   ```
   Only one therapist row is allowed — the schema enforces this.
5. (Optional) Set up Resend (resend.com) if you want to re-enable the
   per-email invite flow later — the default access-code onboarding above
   doesn't need it. Password reset emails are sent by Supabase Auth
   directly, not Resend.
6. Run the dev server:
   ```
   npm run dev
   ```

## How clients join

Onboarding uses a **shared access code** rather than per-client email
invites:

1. In Clients, the therapist sets or generates an access code.
2. She shares it directly with a client (text, verbally, on an intake form).
3. The client goes to `/join`, enters the code plus their name/email/
   password, and their account is created immediately.
4. The code is checked server-side by a security-definer Postgres function
   (`verify_access_code`) — it's never exposed to the browser directly, and
   regenerating it invalidates the old one instantly.

This trades per-person vetting for simplicity: anyone with the code can
create an account, so treat it like a shared password and rotate it
(regenerate button on the Clients page) if it's ever shared more widely
than intended. There is still no public signup route with no code at all.

The original per-email invitation flow (`/accept-invite`, the
`invitations` table, `inviteClient` action) is left in the codebase but
unused — wire it back into the Clients page if targeted invites are wanted
alongside or instead of the shared code.

## Project structure

```
app/
  (auth)/         login, accept-invite, reset-password — public routes
  (therapist)/    dashboard/* — therapist-only, gated by middleware + RLS
  (client)/       home, check-in, blog, books, etc. — client-only
  auth/confirm/   route handler that exchanges Supabase email-link codes
components/
  ui/             shared primitives (Button, Input, Card)
  therapist/      therapist-dashboard-specific components
  client/         client-portal-specific components
lib/
  supabase/       browser/server/service clients + generated types
  validations/    zod schemas
  email/          Resend integration
supabase/migrations/   SQL migrations, applied in order
```

## Security notes

- Every table has RLS enabled; the therapist role is enforced at the
  database level (`is_therapist()`), not just in the UI.
- Only one `therapist` row can ever exist (unique partial index).
- The `invitations` table is never readable pre-auth except through the
  two security-definer RPCs (`get_invitation_by_token`,
  `accept_invitation`), which are the entire pre-auth attack surface —
  keep them minimal if you extend this.
- Rate limiting on login and password-reset requests is in-memory
  (`lib/rate-limit.ts`) — fine for single-instance hosting; swap for
  Upstash Redis if this ever runs on multiple instances.
- Security headers (HSTS, X-Frame-Options, etc.) are set in
  `next.config.mjs`.

## Status

All core spec sections are implemented end to end:

- **Auth**: invite-only signup, login, password reset, session middleware,
  role gating, one-therapist-enforced-at-the-DB-level.
- **Client management**: invite, revoke, deactivate/reactivate, audit-logged.
- **Check-ins & prompts**: structured-only questions (no blank journaling),
  one check-in per client per day, server-side answer validation, therapist
  response review with mark-reviewed.
- **Blog**: publish/unpublish/delete, client list + detail pages, no
  comments or reactions.
- **Book library**: status (recommended/optional/advanced), categories,
  Amazon links, client browsing view.
- **What I'm currently reading**: single personal entry, shown on the
  client home page.
- **Webinars**: upcoming vs. past/on-demand, per-client completion
  tracking.
- **Support groups & announcements**: meeting details, recurring flag,
  therapist-posted announcements — no forum, no chat.
- **Settings**: practice name, client-facing welcome message, session
  timeout.

Not yet done: the full accessibility/design polish pass (dark mode toggle,
keyboard-nav audit, WCAG contrast check), response CSV/PDF download,
printable calendar for support groups, and production deploy hardening
beyond what's in next.config.mjs and middleware.ts.
