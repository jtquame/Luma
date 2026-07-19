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
`0014_attachments_and_preferences.sql`, `0015_pathways.sql`,
`0016_assignment_library.sql`, `0017_checkin_library.sql`,
`0018_client_checkin_model.sql`, `0019_split_response_visibility.sql`,
`0020_deletable_templates.sql`, `0021_webinar_price.sql` —
run these after `0009` in order, same as before.

## Skill Building vs. Reflections (split)

These used to be one combined section; they're now two separate things:

- **Reflections** (`/reflections` client, `/dashboard/reflections`
  therapist) — what used to be called "assignments": per-client homework
  Samara assigns directly, each with instructions, an optional attachment,
  and an optional capped-length reflection question.
- **Skill Building** (`/skill-building` client, `/dashboard/skill-building`
  therapist) — brand new: self-serve, topic-based **pathways** (e.g.
  "Coping with a Breakup," "Managing Anxiety"), modeled on a Bible-app
  reading-plan pattern. A client browses the library by category and
  starts whichever pathway they want; steps unlock **sequentially** —
  step 2 isn't visible/answerable until step 1 is marked complete. This
  was genuinely ambiguous from the original request, so I confirmed the
  two open questions (self-serve vs. therapist-assigned, sequential vs.
  free access) before building — went with self-serve + sequential, which
  is the closest match to the Bible-app reference. Easy to flip either
  behavior if that's not actually what's wanted.

## Assignment library (the "folder")

`/dashboard/reflections` now has a collapsible "Assignment library" panel
where Samara can pre-save reusable assignment content (title,
instructions, reflection question, attachment) once. When creating an
actual per-client assignment, typing a title that matches a saved one
(there's autocomplete via a native datalist) auto-fills the rest of the
form instead of retyping it — that's the "types the name and it
automatically uploads" behavior.

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

## Check-in library: custom, not just fixed presets

The "Add from library" panel on Check-ins & Prompts now has a "Create your
own" option — Samara builds a check-in (title, description, frequency,
questions, same question types as the manual builder) and it's saved to
`checkin_library`, not made live immediately. From there it works exactly
like the fixed starter templates: "Add" turns it into a real, live
check-in. Saved custom items can be deleted from the library independent
of any live check-ins already created from them.

## Check-in model change: client-wide frequency + assigned (not broadcast)

This replaced the earlier per-check-in override — it's a real behavior
change worth knowing about:

- **One frequency per client, not per check-in.** A client no longer picks
  a different cadence for each check-in — they set one frequency
  ("How often do you want check-ins?" on `/check-in`) that governs every
  check-in they're given. `users.preferred_checkin_frequency`.
- **Assigned, not broadcast.** Previously every active check-in showed up
  for every client. Now Samara picks one or more specific check-ins for a
  specific client via "Assign clients" on each check-in row (Check-ins &
  Prompts page) — only assigned check-ins appear for that client.
  `client_checkin_assignments`.
- **Prompts are unaffected** — still one-off and broadcast to every
  client (not part of this assignment model, since the request was
  specifically about check-ins). They now also hide themselves once
  answered, which they didn't reliably do before.
- The earlier per-check-in override table (`client_template_preferences`)
  and its picker component are superseded by this and no longer used by
  any page, though the table is still in the schema.

## Response visibility: always know they answered, content is opt-in

Refined from an earlier pass — Samara can now always see **that** a client
answered a check-in or prompt (which one, when, on the Check-ins & Prompts
page), but the actual answer content is only visible if the client chose
to share it. This is enforced as two separate RLS layers:

- `responses` (the submission itself: who, which check-in, when) —
  always visible to the therapist.
- `response_answers` (the actual question-by-question content) — only
  visible to the therapist when `responses.shared_with_therapist = true`.

After answering, a client sees "Samara will see that you completed this
either way. Want her to see your actual answers too, or keep those just
for yourself?" On her side, each entry in "Recent responses" shows a
Shared/Private badge, and expanding a shared one loads the actual
question/answer pairs (`getResponseDetail` in
`app/(therapist)/response-actions.ts`); expanding a private one just says
they answered but haven't shared the details. Migration
`0019_split_response_visibility.sql`.

Not yet done: response CSV/PDF export, printable support-group calendar,
a full WCAG contrast/keyboard-nav audit, and editing an existing pathway
after creation (currently create/archive/delete only, no edit — same
pattern as check-in templates).

## Starter templates: no write-in questions

The five fixed starter check-ins no longer include any `short_reflection`
(free-text) questions — each one that had a write-in field now uses a
structured equivalent instead (multiple choice, checkboxes, or a scale)
that covers similar ground without a blank box. This only touched the
fixed starter list (`lib/checkin-presets.ts`); the question-type picker in
the manual builder and in "Create your own" (custom library items) still
includes short reflection as an option, since that's Samara's own
authoring tool, not a starter template.

## Check-ins/prompts: delete instead of archive

The archive/reactivate toggle on check-ins and prompts is gone — deleting
is now the only option. This needed a small schema change: response
answers previously had a hard foreign-key link to the exact question they
answered, which would have blocked deleting a template (or errored) the
moment any client had responded to it. Two changes fixed that:

- Each answer now stores a snapshot of the question's text at the moment
  it was answered (`response_answers.question_label`), so a client's past
  answers stay fully readable even after the original check-in is deleted.
- `responses.template_id` and `response_answers.question_id` both switched
  from a blocking foreign key to `ON DELETE SET NULL` — deleting a
  template detaches old responses from it rather than destroying them or
  refusing to let Samara delete it.

Migration `0020_deletable_templates.sql`.

## Selling webinar tickets (external ticketing, not built-in payments)

The app doesn't process payments itself — no Stripe integration, no
checkout flow. Instead, webinars link out cleanly to whatever external
ticketing tool Samara uses (Eventbrite, a Stripe Payment Link, etc.):

- Each webinar has an optional **price** (free text — "$25", "Free",
  "Sliding scale", whatever fits) and a **registration/ticket link**.
  Neither field existed in the actual webinar form before this pass
  (`registration_url` was in the schema but nothing collected it) — that's
  fixed now, along with adding `price`. Migration `0021_webinar_price.sql`.
- On the client side, the price shows as a badge and "Get tickets" opens
  the external link in a new tab, with a line noting tickets are handled
  outside the app.
- If a webinar has **both** a registration link and a video URL (e.g. a
  recorded session only meant for people who already paid), both buttons
  now show side by side — previously the video URL silently hid the
  registration link entirely, which would have broken any paid+recorded
  webinar. The app has no way to verify someone actually paid before
  showing the video link, though — that's on Samara to manage (e.g. by
  only sharing the video URL with people after she confirms payment, or
  running truly public/free content through the video field alone).
