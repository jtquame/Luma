// Kept short (≤10 words) and non-clinical — a small lift, not advice.
// A new one is picked at random on every page load.
export const EMPOWERING_QUOTES = [
  "You are allowed to take up space.",
  "Small steps still move you forward.",
  "Your feelings are valid, not a burden.",
  "Progress isn't a straight line — keep going.",
  "You've survived every hard day so far.",
  "Rest is productive too.",
  "You don't have to earn your worth.",
  "One honest moment matters more than perfect ones.",
  "You're allowed to change your mind.",
  "Healing isn't linear, and that's okay.",
  "You are more than your worst day.",
  "Asking for help is a strength.",
  "You get to set the pace.",
  "Today's effort counts, even if it's small.",
  "You are not behind — you are on your path.",
] as const;

export function randomQuote(): string {
  return EMPOWERING_QUOTES[Math.floor(Math.random() * EMPOWERING_QUOTES.length)];
}
