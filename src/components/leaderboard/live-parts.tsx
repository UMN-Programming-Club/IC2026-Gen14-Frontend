"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  Check,
  ChevronDown,
  ChevronUp,
  Medal,
  Minus,
  Radio,
  Snowflake,
  Star,
  X,
} from "lucide-react";
import { cellStatus, wrongBeforeSolve } from "@/lib/contest-status";
import type { ScoreboardProblem, ScoreboardRow } from "@/lib/domjudge/types";
import { formatMinutes } from "@/lib/format";
import { cn } from "@/lib/utils";

/**
 * Bagian tampilan halaman `/live` (leaderboard terbuka untuk proyektor). Sengaja berdiri sendiri, tidak
 * mengimpor dari halaman leaderboard peserta (`/leaderboard`): halaman itu masih sering berubah, sedangkan
 * layar proyektor tidak boleh ikut berubah tanpa disengaja. Polanya (blok kiri sticky, tabel yang di-scroll
 * sendiri) mengikuti halaman tersebut.
 */

export type Move = { dir: "up" | "down"; n: number };

export function MoveIndicator({ move }: { move?: Move }) {
  if (move?.dir === "up")
    return (
      <ChevronUp className="text-ok size-4" strokeWidth={3} aria-label="Naik" />
    );
  if (move?.dir === "down")
    return (
      <ChevronDown
        className="text-wa size-4"
        strokeWidth={3}
        aria-label="Turun"
      />
    );
  return <Minus className="size-3 text-mist-400/50" aria-label="Tetap" />;
}

const MEDAL_COLOR: Record<number, string> = {
  1: "text-brass-400", // emas, sesuai token style guide
  2: "text-[#c5ced0]", // perak
  3: "text-[#cd7f32]", // perunggu
};

export function RankBadge({ rank }: { rank: number }) {
  if (rank >= 1 && rank <= 3) {
    return (
      <span
        role="img"
        aria-label={`Peringkat ${rank}`}
        className={cn("grid size-7 place-items-center", MEDAL_COLOR[rank])}
      >
        <Medal className="size-6" strokeWidth={2.25} aria-hidden="true" />
      </span>
    );
  }
  return (
    <span className="text-foam-50 grid min-w-7 place-items-center text-lg font-bold sm:text-xl">
      {rank || "-"}
    </span>
  );
}

export function Legend() {
  const pill =
    "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold sm:text-sm";
  const icon = "size-3.5";
  return (
    <ul className="flex flex-wrap items-center gap-2">
      <li
        className={cn(
          pill,
          "border-brass-400/40 bg-brass-400/10 text-brass-400",
        )}
      >
        <Star className={cn(icon, "fill-current")} aria-hidden="true" /> First
        to Solve
      </li>
      <li className={cn(pill, "border-ok/40 bg-ok/10 text-ok")}>
        <Check className={icon} strokeWidth={3} aria-hidden="true" /> Accepted
      </li>
      <li className={cn(pill, "border-wa/40 bg-wa/10 text-wa")}>
        <X className={icon} strokeWidth={3} aria-hidden="true" /> Wrong
      </li>
      <li className={cn(pill, "border-pending/40 bg-pending/10 text-pending")}>
        <Radio className={icon} aria-hidden="true" /> Pending
      </li>
    </ul>
  );
}

/** Satu sel (tim x soal). Meregang mengisi tinggi baris (self-stretch menimpa items-center pada grid baris). */
const CELL =
  "flex min-h-12 flex-col items-center justify-center self-stretch rounded-lg";
const CELL_ICON = "size-3.5 sm:size-4";
const CELL_TEXT = "font-mono text-xs sm:text-sm";

export function Cell({ p }: { p?: ScoreboardProblem }) {
  const status = cellStatus(p);

  if (!p || status === "none") {
    return (
      <div className={cn(CELL, "bg-ink-900/70")} aria-label="Belum dicoba">
        <span className="size-1 rounded-full bg-mist-400/50" />
      </div>
    );
  }

  if (status === "first" || status === "solved") {
    const wrong = wrongBeforeSolve(p);
    const first = status === "first";
    return (
      <div
        className={cn(
          CELL,
          first ? "bg-brass-400/20 text-brass-400" : "bg-ok/15 text-ok",
        )}
        aria-label={`${first ? "Pertama selesai, " : "Selesai, "}menit ${p.time ?? 0}${wrong ? `, ${wrong} percobaan salah` : ""}`}
      >
        {first ? (
          <Star className={cn(CELL_ICON, "fill-current")} aria-hidden="true" />
        ) : (
          <Check className={CELL_ICON} strokeWidth={3} aria-hidden="true" />
        )}
        <span className={CELL_TEXT}>
          {formatMinutes(p.time ?? 0)}
          {wrong > 0 && <span className="opacity-75"> +{wrong}</span>}
        </span>
      </div>
    );
  }

  if (status === "pending") {
    return (
      <div
        className={cn(CELL, "pending-cell bg-pending/20 text-pending")}
        aria-label="Menunggu penilaian"
      >
        <Radio className={CELL_ICON} aria-hidden="true" />
        <span className={CELL_TEXT}>~</span>
      </div>
    );
  }

  return (
    <div
      className={cn(CELL, "bg-wa/15 text-wa")}
      aria-label={`${p.num_judged} percobaan salah`}
    >
      <X className={CELL_ICON} strokeWidth={3} aria-hidden="true" />
      <span className={CELL_TEXT}>-{p.num_judged}</span>
    </div>
  );
}

/** Ms sejak contest mulai -> "H:MM:SS". */
export function elapsedLabel(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

/** Penanda tegas bahwa klasemen sedang dibekukan (freeze). */
export function FrozenBanner({
  atLabel,
  ended,
}: {
  atLabel: string | null;
  ended: boolean;
}) {
  return (
    <div
      role="status"
      className="border-ice-400/50 bg-ice-400/10 flex items-center gap-3 rounded-2xl border px-3 py-2 sm:gap-5 sm:px-6"
    >
      <span className="bg-ice-400/15 text-ice-400 grid size-10 shrink-0 place-items-center rounded-xl sm:size-12">
        <Snowflake className="size-6 sm:size-7" aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="title-display text-ice-300 text-xl sm:text-3xl">
          Leaderboard dibekukan
        </p>
        <p className="mt-1 text-xs text-mist-400 sm:text-sm">
          {atLabel ? `Dibekukan pada ${atLabel} waktu contest. ` : ""}
          Submission setelah pembekuan tampil sebagai{" "}
          <span className="text-pending font-semibold">pending</span>.{" "}
          {ended
            ? "Contest sudah selesai, hasil akhir diumumkan panitia."
            : "Hasil akhir diumumkan panitia."}
        </p>
      </div>
      <span className="border-ice-400/60 text-ice-400 hidden shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-bold tracking-[0.2em] sm:inline">
        FROZEN
      </span>
    </div>
  );
}

/**
 * Blok kiri yang selalu terlihat (rank, tim, AC, penalti). Lebarnya variabel CSS `--fixed-w` (lihat
 * LIVE_VARS) supaya mengikuti ukuran layar: di bawah 1024px situs memakai font 16px tetap, jadi blok yang
 * terlalu lebar akan menutup semua kolom soal di tablet/ponsel.
 */
export const FIXED_WIDTH = "var(--fixed-w)";
export const LIVE_VARS = "[--fixed-w:18rem] sm:[--fixed-w:28rem]";
export const FIXED_BLOCK =
  "sticky left-0 z-10 grid grid-cols-[3rem_minmax(0,1fr)_2.5rem_3.5rem] items-center gap-x-2 pl-3 pr-2 transition-shadow sm:grid-cols-[4.5rem_minmax(0,1fr)_4rem_5rem] sm:gap-x-3 sm:pl-4";
/** Ukuran teks di dalam blok kiri, mengikuti tiga ukuran di atas. */
export const FIXED_NAME = "text-base font-bold sm:text-xl";
export const FIXED_AC = "text-center font-mono text-base font-bold sm:text-xl";
export const FIXED_PENALTY =
  "text-center font-mono text-xs text-mist-400 sm:text-base";
export const FIXED_SHADOW = "shadow-[10px_0_14px_-10px_rgb(0_0_0/0.75)]";

/** Pergerakan peringkat dibandingkan dari polling ke polling (kunci = id tim). Awalnya semua "tetap". */
export function useRankMoves(
  rows: ScoreboardRow[] | undefined,
): Record<string, Move> {
  const prevRanks = useRef<Map<string, number> | null>(null);
  const [moves, setMoves] = useState<Record<string, Move>>({});
  useEffect(() => {
    if (!rows) return;
    const next = new Map(
      rows.map((r) => [r.team_id ?? "", r.rank ?? 0] as const),
    );
    const prev = prevRanks.current;
    prevRanks.current = next;
    if (!prev) return;
    setMoves((cur) => {
      const out = { ...cur };
      next.forEach((rank, id) => {
        const was = prev.get(id);
        if (was !== undefined && was !== rank)
          out[id] = {
            dir: rank < was ? "up" : "down",
            n: (cur[id]?.n ?? 0) + 1,
          };
      });
      return out;
    });
  }, [rows]);
  return moves;
}

/**
 * Animasi geser baris (FLIP): catat posisi lama, bandingkan dengan posisi baru, lalu animasikan
 * selisihnya. Pasang `ref` yang dikembalikan pada `<ol>`; tiap `<li>` anaknya butuh `data-team`.
 */
export function useFlipRows(rows: ScoreboardRow[] | undefined) {
  const listRef = useRef<HTMLOListElement>(null);
  const tops = useRef(new Map<string, number>());
  useLayoutEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const next = new Map<string, number>();
    list
      .querySelectorAll<HTMLLIElement>(":scope > li[data-team]")
      .forEach((li) => {
        const id = li.dataset.team ?? "";
        const top = li.offsetTop - list.offsetTop;
        next.set(id, top);
        const prev = tops.current.get(id);
        if (reduce || prev === undefined || prev === top) return;
        const dy = prev - top;
        const up = dy > 0;
        li.style.zIndex = up ? "10" : "0";
        const glow =
          "0 0 0 1px rgb(47 201 142 / 0.7), 0 0 28px rgb(47 201 142 / 0.35)";
        const anim = li.animate(
          [
            {
              transform: `translateY(${dy}px)`,
              opacity: up ? 1 : 0.55,
              boxShadow: up ? glow : "none",
            },
            { transform: "none", opacity: 1, boxShadow: "none" },
          ],
          { duration: 800, easing: "cubic-bezier(0.34, 1.4, 0.64, 1)" },
        );
        anim.onfinish = () => {
          li.style.zIndex = "";
        };
      });
    tops.current = next;
  }, [rows]);
  return listRef;
}
