"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  Check,
  ChevronDown,
  ChevronUp,
  Compass,
  Medal,
  Minus,
  Radio,
  Snowflake,
  Star,
  X,
} from "lucide-react";
import { useContestClock } from "@/components/arena/contest-clock";
import { PageContainer, PageTitle } from "@/components/arena/page-title";
import { useContestInfo } from "@/components/contest-context";
import { useContestQuery } from "@/lib/api-client";
import { boardInterval } from "@/lib/polling";
import {
  PROBLEM_FALLBACK_COLORS,
  cellStatus,
  wrongBeforeSolve,
} from "@/lib/contest-status";
import type {
  ContestProblem,
  Scoreboard,
  ScoreboardProblem,
  Team,
} from "@/lib/domjudge/types";
import { formatMinutes } from "@/lib/format";
import { cn } from "@/lib/utils";

type Move = { dir: "up" | "down"; n: number };

function MoveIndicator({ move }: { move?: Move }) {
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

function RankBadge({ rank }: { rank: number }) {
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
    <span className="text-foam-50 grid min-w-7 place-items-center text-xl font-bold">
      {rank || "-"}
    </span>
  );
}

function Legend() {
  const pill =
    "inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1 text-sm font-semibold";
  return (
    <ul className="flex flex-wrap items-center gap-2">
      <li
        className={cn(
          pill,
          "border-brass-400/40 bg-brass-400/10 text-brass-400",
        )}
      >
        <Star className="size-3.5 fill-current" aria-hidden="true" /> First to
        Solve
      </li>
      <li className={cn(pill, "border-ok/40 bg-ok/10 text-ok")}>
        <Check className="size-3.5" strokeWidth={3} aria-hidden="true" />{" "}
        Accepted
      </li>
      <li className={cn(pill, "border-wa/40 bg-wa/10 text-wa")}>
        <X className="size-3.5" strokeWidth={3} aria-hidden="true" /> Wrong
      </li>
      <li className={cn(pill, "border-pending/40 bg-pending/10 text-pending")}>
        <Radio className="size-3.5" aria-hidden="true" /> Pending
      </li>
    </ul>
  );
}

const CELL = "flex h-14 flex-col items-center justify-center rounded-lg";

function Cell({ p }: { p?: ScoreboardProblem }) {
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
          <Star className="size-3.5 fill-current" aria-hidden="true" />
        ) : (
          <Check className="size-3.5" strokeWidth={3} aria-hidden="true" />
        )}
        <span className="font-mono text-xs">
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
        <Radio className="size-3.5" aria-hidden="true" />
        <span className="font-mono text-xs">~</span>
      </div>
    );
  }

  return (
    <div
      className={cn(CELL, "bg-wa/15 text-wa")}
      aria-label={`${p.num_judged} percobaan salah`}
    >
      <X className="size-3.5" strokeWidth={3} aria-hidden="true" />
      <span className="font-mono text-xs">-{p.num_judged}</span>
    </div>
  );
}

/** Ms sejak contest mulai -> "H:MM:SS". */
function elapsedLabel(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

/** Penanda tegas bahwa klasemen sedang dibekukan (freeze), bukan sekadar teks kecil di bawah judul. */
function FrozenBanner({
  atLabel,
  ended,
}: {
  atLabel: string | null;
  ended: boolean;
}) {
  return (
    <div
      role="status"
      className="border-ice-400/50 bg-ice-400/10 mt-6 flex items-center gap-4 rounded-2xl border px-4 py-4 sm:gap-5 sm:px-6"
    >
      <span className="bg-ice-400/15 text-ice-400 grid size-12 shrink-0 place-items-center rounded-xl sm:size-14">
        <Snowflake className="size-7 sm:size-8" aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="title-display text-ice-300 text-2xl sm:text-4xl">
          Leaderboard dibekukan
        </p>
        <p className="mt-1 text-sm text-mist-400">
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

/** Lebar blok kiri yang selalu terlihat: rank 4.5 + tim 1fr + AC 4 + penalti 5 (rem). */
const FIXED_WIDTH = "27rem";
const FIXED_BLOCK =
  "sticky left-0 z-10 grid grid-cols-[4.5rem_minmax(0,1fr)_4rem_5rem] items-center gap-x-2 pl-4 sm:pl-5 pr-2 transition-shadow";
const FIXED_SHADOW = "shadow-[10px_0_14px_-10px_rgb(0_0_0/0.75)]";

export default function LeaderboardPage() {
  const { teamId, contest } = useContestInfo();
  const { phase } = useContestClock();
  const board = useContestQuery<Scoreboard>("scoreboard", boardInterval);
  const teams = useContestQuery<Team[]>("teams", 60_000);
  const problems = useContestQuery<ContestProblem[]>("problems", 60_000);

  const teamName = useMemo(
    () =>
      new Map((teams.data ?? []).map((t) => [t.id, t.display_name || t.name])),
    [teams.data],
  );

  const rows = board.data?.rows;

  // Pergerakan peringkat dibandingkan dari polling ke polling. Awalnya semua "-".
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

  // Animasi geser baris (FLIP): catat posisi lama, bandingkan dengan posisi baru, lalu animasikan selisihnya.
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

  const cols = problems.data ?? [];

  // Halaman tidak di-scroll; tabel sendiri yang di-scroll (atas-bawah untuk tim, ke samping untuk
  // soal). State ini hanya untuk penanda: bayangan di tepi header/blok tetap saat sudah di-scroll,
  // dan efek memudar di kanan/bawah bila masih ada soal/tim yang belum terlihat.
  const scrollRef = useRef<HTMLDivElement>(null);
  const [scroll, setScroll] = useState({
    left: false,
    right: false,
    top: false,
    down: false,
  });
  function updateScroll() {
    const el = scrollRef.current;
    if (!el) return;
    const next = {
      left: el.scrollLeft > 1,
      right: el.scrollLeft + el.clientWidth < el.scrollWidth - 1,
      top: el.scrollTop > 1,
      down: el.scrollTop + el.clientHeight < el.scrollHeight - 1,
    };
    setScroll((s) =>
      s.left === next.left &&
      s.right === next.right &&
      s.top === next.top &&
      s.down === next.down
        ? s
        : next,
    );
  }
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    updateScroll();
    const ro = new ResizeObserver(updateScroll);
    ro.observe(el);
    if (el.firstElementChild) ro.observe(el.firstElementChild);
    return () => ro.disconnect();
  });

  const frozen = !!board.data?.state?.frozen && !board.data?.state?.thawed;
  const frozenAtMs = board.data?.state?.frozen
    ? Date.parse(board.data.state.frozen)
    : NaN;
  const startMs = contest.start_time ? Date.parse(contest.start_time) : NaN;
  const frozenAtLabel =
    Number.isFinite(frozenAtMs) && Number.isFinite(startMs)
      ? elapsedLabel(frozenAtMs - startMs)
      : null;
  // Blok kiri (rank, tim, AC, penalti) selebar tetap dan selalu terlihat; kolom soal di kanannya.
  // Bila soal banyak, kolom soal bisa digeser ke samping (tetap 5,5rem, tidak dipadatkan).
  const grid = `${FIXED_WIDTH} repeat(${Math.max(cols.length, 1)}, minmax(5.5rem,1fr))`;

  return (
    // Lebar maksimum dalam rem (ikut skala font), bukan 1400px, supaya layar lebar memuat lebih banyak soal.
    // h-full + flex: halaman pas satu layar; sisa tinggi untuk tabel, yang di-scroll di dalamnya.
    <PageContainer className="flex h-full max-w-[96rem] flex-col">
      <PageTitle
        white="LEADER"
        accent="BOARD"
        joined
        subtitle={
          frozen
            ? "Klasemen sementara pada saat pembekuan"
            : "Klasemen tim, diperbarui otomatis"
        }
        aside={<Legend />}
      />

      {frozen && phase !== "before" && (
        <FrozenBanner atLabel={frozenAtLabel} ended={phase === "ended"} />
      )}

      <section
        className={cn(
          "bg-panel relative mt-6 flex min-h-0 flex-col overflow-hidden rounded-2xl border",
          rows?.length ? "min-h-40" : "",
          frozen && phase !== "before"
            ? "border-ice-400/40 shadow-[0_0_0_1px_rgba(127,208,242,0.08),0_0_32px_-12px_rgba(127,208,242,0.35)]"
            : "border-line",
        )}
      >
        {phase === "before" ? (
          <div className="flex flex-col items-center px-6 py-16 text-center">
            <Compass className="size-9 text-mist-400" aria-hidden="true" />
            <p className="mt-4 text-lg font-bold">Leaderboard belum dibuka</p>
            <p className="mt-1 text-sm text-mist-400">
              Klasemen muncul begitu contest dimulai.
            </p>
          </div>
        ) : board.isPending ? (
          <p className="p-8 text-mist-400">Memuat leaderboard...</p>
        ) : board.isError ? (
          <p role="alert" className="text-wa p-8">
            {board.error.message}
          </p>
        ) : rows?.length === 0 ? (
          <p className="p-8 text-mist-400">Belum ada tim di leaderboard.</p>
        ) : (
          <>
            <div
              ref={scrollRef}
              onScroll={updateScroll}
              className="min-h-0 [scrollbar-width:thin] overflow-auto"
            >
              <div className="w-max min-w-full pr-4 pb-4 sm:pr-5 sm:pb-5">
                {/* Header kolom tetap di atas saat daftar tim di-scroll */}
                <div
                  className={cn(
                    "bg-panel sticky top-0 z-30 grid items-end gap-x-2 pt-4 pb-4 transition-shadow sm:pt-5",
                    scroll.top && "shadow-[0_12px_14px_-12px_rgb(0_0_0/0.8)]",
                  )}
                  style={{ gridTemplateColumns: grid }}
                >
                  <div
                    className={cn(
                      FIXED_BLOCK,
                      "bg-panel -my-1 content-end items-end self-stretch py-1",
                      scroll.left && FIXED_SHADOW,
                    )}
                  >
                    <span className="eyebrow">RANK</span>
                    <span className="eyebrow">Tim</span>
                    <span className="eyebrow text-center">AC</span>
                    <span className="eyebrow text-center">Penalti</span>
                  </div>
                  {cols.map((c, i) => (
                    <div
                      key={c.id}
                      className="flex flex-col items-center gap-2"
                      title={c.name}
                    >
                      <span className="font-mono text-sm font-bold tracking-wider">
                        {c.label}
                      </span>
                      <span
                        aria-hidden="true"
                        className="size-2.5 rounded-full ring-1 ring-white/10"
                        style={{
                          backgroundColor:
                            c.rgb ??
                            PROBLEM_FALLBACK_COLORS[
                              i % PROBLEM_FALLBACK_COLORS.length
                            ],
                        }}
                      />
                    </div>
                  ))}
                </div>

                <ol ref={listRef} className="flex flex-col gap-1.5">
                  {rows?.map((row) => {
                    const mine = row.team_id === teamId;
                    const rank = row.rank ?? 0;
                    const name = teamName.get(row.team_id) ?? row.team_id;
                    const move = moves[row.team_id ?? ""];
                    return (
                      <li
                        key={row.team_id}
                        data-team={row.team_id}
                        aria-current={mine ? "true" : undefined}
                        className={cn(
                          // overflow-clip, bukan overflow-hidden: hidden membuat sticky di dalamnya tidak bekerja.
                          "group relative grid items-center gap-x-2 overflow-clip rounded-xl py-1.5 transition-colors",
                          mine && "bg-aqua-400/[0.08]",
                        )}
                        style={{ gridTemplateColumns: grid }}
                      >
                        {move && (
                          <span
                            key={move.n}
                            aria-hidden="true"
                            className={cn(
                              "pointer-events-none absolute inset-0 z-20",
                              move.dir === "up" ? "flash-up" : "flash-down",
                            )}
                          />
                        )}
                        <div
                          className={cn(
                            FIXED_BLOCK,
                            // -my-1.5: menutup padding baris juga, supaya sel lain (mis. animasi pending) tidak tembus.
                            "-my-1.5 self-stretch",
                            mine
                              ? "bg-[color-mix(in_srgb,var(--color-aqua-400)_8%,var(--color-panel))]"
                              : "bg-panel",
                            scroll.left && FIXED_SHADOW,
                          )}
                        >
                          {mine && (
                            <span
                              aria-hidden="true"
                              className="bg-aqua-400 absolute inset-y-0 left-0 w-1"
                            />
                          )}
                          <span className="flex items-center gap-1">
                            <RankBadge rank={rank} />
                            <MoveIndicator move={move} />
                          </span>
                          <span className="flex min-w-0 items-baseline gap-2 font-bold">
                            <span className="truncate" title={name}>
                              {name}
                            </span>
                            {mine && (
                              <span className="text-aqua-400 -top-0.3 relative shrink-0 text-[0.65rem] font-bold tracking-widest">
                                KAMU
                              </span>
                            )}
                          </span>
                          <span className="text-center font-mono font-bold">
                            {row.score?.num_solved ?? 0}
                          </span>
                          <span className="text-center font-mono text-mist-400">
                            {`${row.score?.total_time ?? 0}'`}
                          </span>
                        </div>
                        {cols.map((c) => (
                          <Cell
                            key={c.id}
                            p={row.problems?.find((p) => p.problem_id === c.id)}
                          />
                        ))}
                      </li>
                    );
                  })}
                </ol>
              </div>
            </div>

            {/* Penanda masih ada soal di kanan / tim di bawah */}
            {scroll.right && (
              <div
                aria-hidden="true"
                className="from-panel pointer-events-none absolute inset-y-0 right-0 z-40 w-16 bg-gradient-to-l to-transparent"
              />
            )}
            {scroll.down && (
              <div
                aria-hidden="true"
                className="from-panel pointer-events-none absolute inset-x-0 bottom-0 z-40 h-12 bg-gradient-to-t to-transparent"
              />
            )}
          </>
        )}
      </section>
    </PageContainer>
  );
}
