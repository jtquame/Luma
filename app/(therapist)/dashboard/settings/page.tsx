import { createClient } from "@/lib/supabase/server";
import { SettingsManager } from "@/components/therapist/settings-manager";

export default async function TherapistSettingsPage() {
  const supabase = await createClient();
  const { data: settings } = await supabase
    .from("settings")
    .select("practice_name, welcome_message, session_timeout_minutes")
    .single();

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
      />
    </div>
  );
}
