"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { Topbar } from "@/components/arena/topbar";

/**
 * Home (`/`) mengisi satu layar penuh tanpa scroll; timer-nya ada di dalam halaman (TimerBlock).
 * Halaman lain (Leaderboard, Problems) memakai status bar + progres waktu contest di atas, lalu isi
 * yang boleh scroll. Halaman-halaman itu sudah punya <PageContainer> sendiri untuk margin.
 */
export function ContestMain({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  if (pathname === "/") {
    return <main className="min-h-0 min-w-0 flex-1">{children}</main>;
  }
  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col">
      <Topbar />
      <main className="bg-arena min-h-0 flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
