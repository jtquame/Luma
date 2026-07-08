import { createClient } from "@/lib/supabase/server";
import { SettingsManager } from "@/components/therapist/settings-manager";

export default async function TherapistSettingsPage() {
  const supabase = await createClient();
  const [{ data: settings }, { data: reading }] = await Promise.all([
    supabase
      .from("settings")
      .select("practice_name, welcome_message, session_timeout_minutes")
      .single(),
    supabase
      .from("currently_reading")
      .select("book_title, author, why_reading, learning_note, favorite_quote")
      .single(),
  ]);

  return (
    <div>
      <h1 className="font-display text-2xl mb-1">Settings</h1>
      <p className="text-sm text-ink-muted mb-8">Manage practice branding and portal settings.</p>
      <SettingsManager
        settings={
          settings ?? {
            practice_name: "Tribe Works Behavioral Services",
            welcome_message: "Glad you're here.",
            session_timeout_minutes: 30,
          }
        }
        reading={
          reading ?? {
            book_title: null,
            author: null,
            why_reading: null,
            learning_note: null,
            favorite_quote: null,
          }
        }
      />
    </div>
  );
}
