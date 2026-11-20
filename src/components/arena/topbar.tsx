"use client";

import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useContestClock, type Phase } from "@/components/arena/contest-clock";
import { formatClock } from "@/lib/format";

const CHIP: Record<Phase, { label: string; className: string; dot: string }> = {
  before: {
    label: "Belum dimulai",
    className: "border-line-strong text-aqua-400",
    dot: "bg-aqua-400",
  },
  running: {
    label: "Berlangsung",
    className: "border-aqua-400/50 bg-aqua-400/10 text-aqua-400",
    dot: "bg-aqua-400",
  },
  ended: {
    label: "Selesai",
    className: "border-maroon-700/80 bg-maroon-700/25 text-wa",
    dot: "bg-wa",
  },
};

function StatusChip({ phase }: { phase: Phase | null }) {
  if (!phase) {
    return <span className="border-line h-8 w-36 rounded-full border" />;
  }
  const c = CHIP[phase];
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-bold tracking-[0.12em] uppercase",
        c.className,
      )}
    >
      <span className="relative flex size-2.5 items-center justify-center">
        {phase === "running" && (
          <span className="bg-aqua-400/50 absolute inset-0 animate-ping rounded-full motion-reduce:animate-none" />
        )}
        <span className={cn("relative size-2 rounded-full", c.dot)} />
      </span>
      {c.label}
    </span>
  );
}

export function Topbar() {
  const { phase, start, remainingMs, progress } = useContestClock();

  const fill =
    phase === "ended"
      ? "bg-maroon-700"
      : "bg-linear-to-r from-teal-600 to-aqua-400";
  const thumb =
    phase === "ended" ? "border-wa bg-ink-950" : "border-aqua-400 bg-ink-950";

  let label = "";
  let value = "--:--:--";
  let valueClass = "text-foam-50";
  if (phase === "before") {
    label = "Arena dibuka";
    value =
      start !== null
        ? format(start, "dd MMM yyyy", { locale: idLocale }).toUpperCase()
        : "BELUM DIJADWALKAN";
    valueClass = "text-foam-50 text-lg tracking-widest";
  } else if (phase === "running") {
    label = "Sisa waktu";
    value = formatClock(remainingMs);
  } else if (phase === "ended") {
    label = "Status";
    value = "00:00:00";
    valueClass = "text-wa";
  }

  return (
    <header className="border-line bg-ink-900 flex h-16 shrink-0 items-center gap-4 border-b px-4 sm:px-8 lg:px-10">
      <StatusChip phase={phase} />

      <div className="hidden min-w-0 flex-1 items-center gap-4 md:flex">
        <span className="font-mono text-[0.68rem] tracking-widest text-mist-400">
          MULAI
        </span>
        <div
          role="progressbar"
          aria-label="Progres waktu contest"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(progress * 100)}
          className="relative h-1.5 flex-1 rounded-full bg-slate-800"
        >
          <div
            className={cn("h-full rounded-full", fill)}
            style={{ width: `${progress * 100}%` }}
          />
          <span
            className={cn(
              "absolute top-1/2 size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px]",
              thumb,
            )}
            style={{ left: `${progress * 100}%` }}
          />
        </div>
        <span className="font-mono text-[0.68rem] tracking-widest text-mist-400">
          SELESAI
        </span>
      </div>

      <div className="ml-auto text-right leading-tight md:ml-0">
        <p className="text-foam-50/80 text-[0.65rem] font-semibold tracking-[0.14em] uppercase">
          {label}
        </p>
        <p
          className={cn(
            "font-mono text-2xl font-bold tabular-nums sm:text-[1.9rem]",
            valueClass,
          )}
        >
          {value}
        </p>
      </div>
    </header>
  );
}
