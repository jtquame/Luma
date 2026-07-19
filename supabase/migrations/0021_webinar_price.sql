-- Tribe Works: webinar price (display only — actual payment happens on
-- an external ticketing tool like Eventbrite or a Stripe Payment Link;
-- the app never processes payment itself, just links out cleanly and
-- shows the price before a client clicks through).

alter table public.webinars
  add column if not exists price text;
