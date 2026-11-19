"use client";

import { useMemo } from "react";
import { Check, Compass, Radio, Star, X } from "lucide-react";
import { useContestClock } from "@/components/arena/contest-clock";
import { PageContainer, PageTitle } from "@/components/arena/page-title";
import { useContestInfo } from "@/components/contest-context";
import { useContestQuery } from "@/lib/api-client";
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

function Legend() {
  return (
    <ul className="flex flex-wrap items-center gap-x-5 gap-y-1 text-sm">
      <li className="text-brass-400 flex items-center gap-1.5">
        <Star className="size-3.5 fill-current" aria-hidden="true" /> first
        solve
      </li>
      <li className="text-ok flex items-center gap-1.5">
        <Check className="size-3.5" strokeWidth={3} aria-hidden="true" />{" "}
        accepted
      </li>
      <li className="text-wa flex items-center gap-1.5">
        <X className="size-3.5" strokeWidth={3} aria-hidden="true" /> salah
      </li>
      <li className="text-pending flex items-center gap-1.5">
        <Radio className="size-3.5" aria-hidden="true" /> pending
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
        className={cn(CELL, "bg-pending/20 text-pending")}
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

export default function LeaderboardPage() {
  const { teamId } = useContestInfo();
  const { phase } = useContestClock();
  const board = useContestQuery<Scoreboard>("scoreboard", 15_000);
  const teams = useContestQuery<Team[]>("teams", 60_000);
  const problems = useContestQuery<ContestProblem[]>("problems", 60_000);

  const teamName = useMemo(
    () =>
      new Map((teams.data ?? []).map((t) => [t.id, t.display_name || t.name])),
    [teams.data],
  );

  const cols = problems.data ?? [];
  const frozen = !!board.data?.state?.frozen && !board.data?.state?.thawed;
  // Kolom soal: 4 kolom tetap (#, tim, AC, penalti) lalu satu kolom per soal.
  const grid = `3rem minmax(9rem,1.6fr) 4rem 5rem repeat(${Math.max(cols.length, 1)}, minmax(5.5rem,1fr))`;

  return (
    <PageContainer>
      <PageTitle
        white="Leader"
        accent="board"
        joined
        subtitle={
          frozen
            ? "Scoreboard sedang dibekukan. Hasil akhir diumumkan panitia."
            : "Klasemen tim, diperbarui otomatis"
        }
        aside={<Legend />}
      />

      <section className="border-line bg-panel mt-7 overflow-x-auto rounded-2xl border">
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
        ) : board.data.rows.length === 0 ? (
          <p className="p-8 text-mist-400">Belum ada tim di leaderboard.</p>
        ) : (
          <div className="min-w-[56rem] p-4 sm:p-5">
            <div
              className="grid items-end gap-x-2 px-3 pb-4"
              style={{ gridTemplateColumns: grid }}
            >
              <span className="eyebrow">#</span>
              <span className="eyebrow">Tim</span>
              <span className="eyebrow text-center">AC</span>
              <span className="eyebrow text-center">Penalti</span>
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

            <ol className="flex flex-col gap-1.5">
              {board.data.rows.map((row) => {
                const mine = row.team_id === teamId;
                const rank = row.rank ?? 0;
                const name = teamName.get(row.team_id) ?? row.team_id;
                return (
                  <li
                    key={row.team_id}
                    aria-current={mine ? "true" : undefined}
                    className={cn(
                      "grid items-center gap-x-2 rounded-xl border px-3 py-1.5",
                      mine
                        ? "border-aqua-400/70 bg-aqua-400/[0.06]"
                        : "border-transparent",
                    )}
                    style={{ gridTemplateColumns: grid }}
                  >
                    <span
                      className={cn(
                        "text-xl font-bold",
                        rank === 1 ? "text-brass-400" : "text-foam-50",
                      )}
                    >
                      {rank || "-"}
                    </span>
                    <span className="flex min-w-0 items-center gap-2 font-bold">
                      <span className="truncate">{name}</span>
                      {mine && (
                        <span className="text-aqua-400 shrink-0 text-[0.65rem] font-bold tracking-widest">
                          KAMU
                        </span>
                      )}
                    </span>
                    <span className="text-center font-mono font-bold">
                      {row.score?.num_solved ?? 0}
                    </span>
                    <span className="text-center font-mono text-mist-400">
                      {row.score?.total_time ?? 0}
                    </span>
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
        )}
      </section>
    </PageContainer>
  );
}
