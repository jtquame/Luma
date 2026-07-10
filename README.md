# Tribe Works

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

All core spec sections are implemented end to end, plus a full round of
changes from Samara's feedback:

- **Check-in cadence**: therapist sets daily/weekly/biweekly/monthly per
  check-in; eligibility is computed from the client's last submission
  instead of a hardcoded "once a day" rule.
- **Skill building & reflections**: per-client assignments (distinct from
  the broadcast-to-everyone check-ins/prompts) with an optional capped-
  length reflection question. Client gets an email when one is posted (if
  Resend is configured — otherwise the assignment still saves, just no
  email).
- **Editing**: blog posts and webinars can now be edited after creation,
  not just created/deleted.
- **Webinar images**: thumbnail URL field on the webinar form, shown on
  the client-facing page.
- **Support groups vs. announcements**: split into two separate tabs on
  both the therapist and client side (previously combined on one page).
- **"What Samara's reading" removed**: dropped from the client home page
  and Settings. The book *library* (recommendations) is untouched — this
  only removed the separate personal "currently reading" feature. The
  underlying `currently_reading` table is still in the schema, just
  unused by the UI.
- **Client home page**: now shows only Today's check-in, Latest blog,
  What's assigned, and Announcements — no book/support-group cards.
- **Client nav reorder**: Home, Skill building, Check-in, Webinars,
  Support groups, Announcements, Books, Blog (Samara's requested order
  didn't specify where Blog/Announcements land, so they were placed last
  and next to Support groups respectively — flag if that's not right).
- **Home page tone**: "Welcome back" removed, "Hi, {name}" stays. The
  green breathing-orb graphic is replaced with a random short (≤10 word)
  empowering quote, re-picked on every page load (`lib/quotes.ts`).
- **Disclaimer footer**: "This isn't a replacement for therapy — only a
  resource in addition to sessions" now appears on every page (client,
  therapist, and auth layouts).
- **Terms & conditions**: therapist has a dedicated editable page
  (`/dashboard/terms`) with per-client acceptance status. Clients are
  redirected to `/accept-terms` if they haven't accepted the *current*
  version within the last 30 days — editing the terms text bumps the
  version automatically, which immediately forces everyone to re-sign
  even if they accepted recently.
- **Mobile layout**: therapist sidebar and client top nav both collapse
  into a hamburger-triggered drawer below the `md`/`lg` breakpoint instead
  of squishing. Fixed-width grids and side-by-side form rows across the
  app (dashboard stats, book/blog/webinar forms, client/response rows,
  the question builder) now stack on narrow screens instead of
  overflowing. This covers the main flows — worth an actual walkthrough
  on a phone before calling it fully done, since a few less-common screens
  weren't individually tested.
- **Grammar/capitalization**: spot-checked visible copy during this pass,
  not an exhaustive line-by-line audit — flag anything specific you spot
  and it's a fast fix.

Migrations added this round: `0010_assignments.sql`,
`0011_checkin_cadence.sql`, `0012_terms.sql`, `0013_image_storage.sql`,
`0014_attachments_and_preferences.sql` — run these after `0009` in order,
same as before.

## Image uploads

Blog covers, book covers, and webinar thumbnails now upload directly from
a file or a phone's camera roll instead of pasting a URL — `0013_image_storage.sql`
sets up a public Supabase Storage bucket called `images` with therapist-only
write access. The upload button (`components/therapist/image-uploader.tsx`)
uses a plain `<input type="file" accept="image/*">` with no `capture`
attribute, which is what lets mobile browsers offer both "Photo Library"
and "Take Photo" — restricting it to one would remove that choice.

## Assignment attachments

Skill-building assignments can now include an attached file (worksheet,
PDF, doc) or photo, not just text instructions —
`components/therapist/file-uploader.tsx` handles any file type, uploading
to a separate, non-public `attachments` bucket (readable only by
authenticated users, since these are tied to a specific client's homework
rather than general branding content). Client sees a download link on
their assignment card.

## Check-in cadence: client override + preset library

Two additions on top of the therapist-set default cadence:

- **Client override**: each active check-in on `/check-in` has a small
  "Remind me" dropdown letting a client pick their own frequency
  (daily/weekly/biweekly/monthly), independent of whatever the therapist
  set as the default. Stored in `client_template_preferences`; no row
  means "use the template's default."
- **Preset library**: "Add from library" on the Check-ins & prompts page
  offers five ready-built check-ins (daily mood, weekly anxiety scale,
  weekly gratitude, biweekly progress, monthly big-picture) that add in
  one click instead of building question-by-question
  (`lib/checkin-presets.ts`). Once added, they're indistinguishable from a
  manually-built check-in — they follow their cadence automatically, no
  further action needed. This was the reading I went with for "a list of
  them so they can be automated"; if what was actually wanted is
  different (e.g. scheduled push notifications, or something else
  entirely), flag it and it can be adjusted.

Not yet done: response CSV/PDF export, printable support-group calendar,
and a full WCAG contrast/keyboard-nav audit.
