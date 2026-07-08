import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./types";

// Bypasses RLS entirely — service role key, never exposed to the browser.
// ONLY use this from Server Actions / Route Handlers, and ONLY after
// confirming the caller is the therapist. This is what lets the therapist
// create auth.users records directly when issuing an invitation.
export function createServiceClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: { autoRefreshToken: false, persistSession: false },
    }
  );
}
