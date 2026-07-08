import { TherapistSidebar } from "@/components/therapist/sidebar";

export default function TherapistLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-bg">
      <TherapistSidebar />
      <main className="flex-1 px-10 py-8 max-w-5xl">{children}</main>
    </div>
  );
}
