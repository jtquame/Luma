import { ClientNav } from "@/components/client/nav";
import { DisclaimerFooter } from "@/components/disclaimer-footer";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-bg flex flex-col">
      <ClientNav />
      <main className="max-w-3xl mx-auto px-4 md:px-6 py-6 md:py-10 flex-1 w-full">{children}</main>
      <DisclaimerFooter />
    </div>
  );
}
