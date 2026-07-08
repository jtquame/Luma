import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "./types";

// Used in Server Components, Route Handlers, and Server Actions. Respects
// RLS via the anon key + the caller's session cookie — never the service
// role key. See service.ts for the one place we deliberately bypass RLS.
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Called from a Server Component with no request context to
            // write to — safe to ignore because middleware refreshes the
            // session on every request anyway.
          }
        },
      },
    }
  );
}
