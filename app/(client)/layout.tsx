import { ClientNav } from "@/components/client/nav";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-bg">
      <ClientNav />
      <main className="max-w-3xl mx-auto px-6 py-10">{children}</main>
    </div>
  );
}
