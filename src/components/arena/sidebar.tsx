"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, Lock } from "lucide-react";
import { useContestInfo } from "@/components/contest-context";
import { useContestClock } from "@/components/arena/contest-clock";
import { PixelStrip, StarMark } from "@/components/arena/logo";
import { NAV, isActive } from "@/components/arena/nav";
import { EVENT } from "@/lib/event";
import { teamInitial, teamLabel } from "@/lib/format";
import { cn } from "@/lib/utils";

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { teamName } = useContestInfo();
  const { phase } = useContestClock();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/login");
    router.refresh();
  }

  return (
    <aside className="border-line bg-ink-900 hidden w-60 shrink-0 flex-col border-r lg:flex">
      <div className="flex items-center gap-3 px-6 pt-7">
        <StarMark className="size-10 shrink-0" />
        <div className="leading-tight">
          <p className="text-[0.95rem] font-extrabold tracking-wide">
            {EVENT.clubShort}
          </p>
          <p className="text-xs tracking-wider text-mist-400">
            {EVENT.generation} {EVENT.year}
          </p>
        </div>
      </div>

      <PixelStrip className="mt-5 px-6" />

      <nav
        aria-label="Navigasi utama"
        className="mt-6 flex flex-col gap-2 px-4"
      >
        {NAV.map((item) => {
          const Icon = item.icon;
          const locked = item.lockedBeforeStart && phase === "before";
          const active = !locked && isActive(item, pathname);
          const content = (
            <>
              <Icon className="size-5 shrink-0" aria-hidden="true" />
              <span className="flex-1">{item.label}</span>
              {locked && <Lock className="size-4" aria-hidden="true" />}
            </>
          );

          if (locked) {
            return (
              <span
                key={item.href}
                aria-disabled="true"
                title="Terbuka saat contest dimulai"
                className="flex cursor-not-allowed items-center gap-3 rounded-xl px-4 py-3 text-[0.95rem] font-medium text-mist-400/50"
              >
                {content}
              </span>
            );
          }
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "focus-visible:ring-aqua-400/60 relative flex items-center gap-3 rounded-xl px-4 py-3 text-[0.95rem] font-medium transition-colors outline-none focus-visible:ring-2",
                active
                  ? "bg-sidebar-accent text-foam-50 font-semibold"
                  : "hover:text-foam-50 text-mist-400 hover:bg-slate-800/60",
              )}
            >
              {active && (
                <span className="bg-aqua-400 absolute top-1/2 -left-4 h-8 w-1 -translate-y-1/2 rounded-r" />
              )}
              {content}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto p-4">
        <div className="border-line bg-panel flex items-center gap-3 rounded-xl border px-3 py-3">
          <span
            aria-hidden="true"
            className="from-aqua-400 text-ink-950 flex size-10 shrink-0 items-center justify-center rounded-lg bg-linear-to-br to-teal-600 text-base font-extrabold"
          >
            {teamInitial(teamName)}
          </span>
          <div className="min-w-0 flex-1 leading-tight">
            <p className="truncate text-sm font-bold">{teamLabel(teamName)}</p>
            <p className="text-xs text-mist-400">Peserta</p>
          </div>
          <button
            type="button"
            onClick={logout}
            aria-label="Keluar"
            title="Keluar"
            className="hover:text-foam-50 focus-visible:ring-aqua-400/60 rounded-md p-2 text-mist-400 transition-colors outline-none hover:bg-slate-800 focus-visible:ring-2"
          >
            <LogOut className="size-5" />
          </button>
        </div>
      </div>
    </aside>
  );
}
