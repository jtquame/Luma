import { BrandArch } from "@/components/brand-arch";
import { DisclaimerFooter } from "@/components/disclaimer-footer";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <BrandArch className="w-24 h-16 mb-4" />
          <h1 className="font-display text-2xl text-ink">Tribe Works</h1>
          <p className="eyebrow mt-1">Behavioral Services</p>
        </div>
        {children}
      </div>
      <DisclaimerFooter />
    </div>
  );
}
