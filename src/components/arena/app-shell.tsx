"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useContestClock } from "@/components/arena/contest-clock";
import { NAV, isActive } from "@/components/arena/nav";
import { Sidebar } from "@/components/arena/sidebar";
import { Topbar } from "@/components/arena/topbar";
import { cn } from "@/lib/utils";

/** Navigasi horizontal untuk layar sempit (sidebar disembunyikan di bawah `lg`). */
function MobileNav() {
  const pathname = usePathname();
  const { phase } = useContestClock();
  return (
    <nav
      aria-label="Navigasi utama"
      className="border-line bg-ink-900 flex shrink-0 gap-1 overflow-x-auto border-b px-3 py-2 lg:hidden"
    >
      {NAV.map((item) => {
        const Icon = item.icon;
        const locked = item.lockedBeforeStart && phase === "before";
        const active = !locked && isActive(item, pathname);
        const cls = cn(
          "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium whitespace-nowrap",
          active ? "bg-sidebar-accent text-foam-50" : "text-mist-400",
          locked && "cursor-not-allowed opacity-50",
        );
        return locked ? (
          <span key={item.href} aria-disabled="true" className={cls}>
            <Icon className="size-4" aria-hidden="true" />
            {item.label}
          </span>
        ) : (
          <Link key={item.href} href={item.href} className={cls}>
            <Icon className="size-4" aria-hidden="true" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

/** Rangka halaman contest: banner (opsional), sidebar, status bar atas, lalu isi halaman. */
export function AppShell({
  banner,
  children,
}: {
  /** Diberikan dari server component (mis. banner mode mock). */
  banner?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="bg-ink-950 flex h-dvh flex-col">
      {banner}
      <div className="flex min-h-0 flex-1">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <Topbar />
          <MobileNav />
          <main className="bg-arena min-h-0 flex-1 overflow-y-auto">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
