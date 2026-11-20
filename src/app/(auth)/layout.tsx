import type { ReactNode } from "react";
import { MockBanner } from "@/components/mock-banner";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-dvh min-h-0 flex-col overflow-hidden">
      <MockBanner />
      {/* Di layar kecil (dan saat keyboard HP muncul) isi login bisa lebih tinggi dari layar: boleh scroll. */}
      <div className="min-h-0 flex-1 overflow-y-auto lg:overflow-hidden">
        {children}
      </div>
    </div>
  );
}
