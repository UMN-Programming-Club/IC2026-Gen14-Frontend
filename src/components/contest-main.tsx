"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";

/**
 * Home (`/`) mengisi satu layar penuh tanpa scroll. Halaman lain (Problems, Submissions,
 * Scoreboard) tidak diubah, jadi tetap dibungkus kontainer lama dan boleh scroll di dalam <main>.
 */
export function ContestMain({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  if (pathname === "/") {
    return <main className="min-h-0 min-w-0 flex-1">{children}</main>;
  }
  return (
    <main className="min-h-0 min-w-0 flex-1 overflow-y-auto">
      <div className="mx-auto w-full max-w-6xl px-4 py-6">{children}</div>
    </main>
  );
}
