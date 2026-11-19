import type { ReactNode } from "react";
import { MockBanner } from "@/components/mock-banner";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-dvh min-h-0 flex-col overflow-hidden">
      <MockBanner />
      <div className="min-h-0 flex-1">{children}</div>
    </div>
  );
}
