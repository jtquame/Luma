import { TherapistSidebar } from "@/components/therapist/sidebar";
import { DisclaimerFooter } from "@/components/disclaimer-footer";

export default function TherapistLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-bg">
      <TherapistSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <main className="px-4 py-6 md:px-10 md:py-8 max-w-5xl flex-1">{children}</main>
        <DisclaimerFooter />
      </div>
    </div>
  );
}
