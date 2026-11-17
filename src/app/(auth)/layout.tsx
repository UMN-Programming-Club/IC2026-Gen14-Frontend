import type { ReactNode } from "react";
import { MockBanner } from "@/components/mock-banner";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <MockBanner />
      {children}
    </>
  );
}
