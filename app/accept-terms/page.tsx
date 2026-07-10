import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { AcceptTermsForm } from "./accept-terms-form";
import { BrandArch } from "@/components/brand-arch";
import { Card } from "@/components/ui/card";
import { DisclaimerFooter } from "@/components/disclaimer-footer";

export default async function AcceptTermsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: terms } = await supabase.from("terms_content").select("body, version").single();

  return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        <div className="flex flex-col items-center mb-8">
          <BrandArch className="w-24 h-16 mb-4" />
          <h1 className="font-display text-2xl text-ink">Terms & conditions</h1>
          <p className="eyebrow mt-1">Please review and accept to continue</p>
        </div>
        <Card>
          <div className="max-h-80 overflow-y-auto mb-6 text-sm text-ink whitespace-pre-wrap leading-relaxed border border-border rounded-lg p-4 bg-bg">
            {terms?.body ?? "Loading…"}
          </div>
          <AcceptTermsForm />
        </Card>
      </div>
      <DisclaimerFooter />
    </div>
  );
}
