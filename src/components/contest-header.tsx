"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useContestInfo } from "@/components/contest-context";

const NAV = [
  { href: "/", label: "Ringkasan" },
  { href: "/problems", label: "Soal" },
  { href: "/submissions", label: "Submission" },
  { href: "/scoreboard", label: "Scoreboard" },
];

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function formatDuration(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  return `${pad(Math.floor(total / 3600))}:${pad(Math.floor((total % 3600) / 60))}:${pad(total % 60)}`;
}

function Countdown({ start, end }: { start?: string; end?: string }) {
  // `now` dimulai null supaya HTML server dan client sama (tidak ada hydration mismatch).
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    const tick = () => setNow(Date.now());
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, []);

  if (now === null || !start || !end)
    return <span className="font-mono">--:--:--</span>;
  const s = Date.parse(start);
  const e = Date.parse(end);
  if (now < s)
    return (
      <span className="font-mono">Mulai dalam {formatDuration(s - now)}</span>
    );
  if (now < e)
    return <span className="font-mono">Sisa {formatDuration(e - now)}</span>;
  return <span className="font-mono">Contest selesai</span>;
}

export function ContestHeader() {
  const { contest, teamName } = useContestInfo();
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/login");
    router.refresh();
  }

  return (
    <header className="border-b bg-white dark:bg-zinc-950">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3">
        <div className="min-w-0">
          <p className="truncate font-semibold">
            {contest.formal_name ?? contest.name}
          </p>
          <p className="text-sm text-zinc-500">
            <Countdown start={contest.start_time} end={contest.end_time} />
          </p>
        </div>
        <nav className="flex gap-1 sm:ml-4">
          {NAV.map((item) => {
            const active =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                    : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-900",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="ml-auto flex items-center gap-3">
          <span className="max-w-48 truncate text-sm text-zinc-600 dark:text-zinc-400">
            {teamName}
          </span>
          <Button variant="outline" size="sm" onClick={logout}>
            <LogOut className="size-4" />
            Keluar
          </Button>
        </div>
      </div>
    </header>
  );
}
