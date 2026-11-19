"use client";

import Link from "next/link";
import { useMemo, type ReactNode } from "react";
import { ArrowRight, Check, Compass, Radio, X } from "lucide-react";
import { useContestClock } from "@/components/arena/contest-clock";
import { arenaButton } from "@/components/arena/button-styles";
import { PageContainer } from "@/components/arena/page-title";
import { SponsorBar } from "@/components/arena/sponsor-bar";
import { VerdictBadge } from "@/components/arena/verdict-badge";
import { useContestInfo } from "@/components/contest-context";
import { useContestQuery } from "@/lib/api-client";
import { cellStatus, type CellStatus } from "@/lib/contest-status";
import type {
  ContestProblem,
  Judgement,
  Scoreboard,
  Submission,
} from "@/lib/domjudge/types";
import {
  formatDurationLabel,
  parseContestTime,
  pad,
  splitCountdown,
  teamLabel,
} from "@/lib/format";
import { EVENT } from "@/lib/event";
import { cn } from "@/lib/utils";

// ---------- Sebelum contest dimulai ----------

function CountdownUnit({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center gap-3">
      <span className="font-mono text-[clamp(2.75rem,9vw,6rem)] leading-none font-bold tabular-nums">
        {pad(value)}
      </span>
      <span className="eyebrow !text-[0.7rem]">{label}</span>
    </div>
  );
}

function Colon() {
  return (
    <span aria-hidden="true" className="flex flex-col gap-3.5 pb-9 sm:gap-5">
      <span className="bg-aqua-400 size-2 rounded-full sm:size-3" />
      <span className="bg-aqua-400 size-2 rounded-full sm:size-3" />
    </span>
  );
}

function InfoCard({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="border-line bg-panel rounded-2xl border px-6 py-5">
      <p className="eyebrow">{label}</p>
      <p className="mt-2 text-2xl font-bold">{children}</p>
    </div>
  );
}

function HomeBefore() {
  const { contest, teamName } = useContestInfo();
  const { start, untilStartMs } = useContestClock();
  const problems = useContestQuery<ContestProblem[]>("problems", 60_000);
  const { days, hours, minutes, seconds } = splitCountdown(untilStartMs);
  // Soal disembunyikan DOMjudge sebelum mulai, jadi pakai angka dari konfigurasi acara.
  const count = problems.data?.length || EVENT.problemCount;

  return (
    <PageContainer className="flex min-h-full flex-col items-center pt-10 lg:pt-14">
      <span className="border-line-strong text-aqua-400 rounded-full border px-4 py-1 text-xs font-bold tracking-[0.12em] uppercase italic">
        {EVENT.generation}
      </span>
      <h1 className="title-display mt-6 text-center text-[clamp(3.5rem,10vw,7rem)]">
        Get <span className="text-aqua-400">ready</span>
      </h1>
      <p className="mt-4 text-lg text-mist-400">
        {start === null
          ? "Waktu mulai belum ditentukan panitia"
          : "Arena dibuka dalam"}
      </p>

      {start === null ? (
        <div className="border-line bg-panel mt-9 flex w-full max-w-4xl flex-col items-center rounded-2xl border px-6 py-14 text-center">
          <Radio className="text-aqua-400 size-8" aria-hidden="true" />
          <p className="mt-4 text-lg font-bold">Menunggu jadwal mulai</p>
          <p className="mt-1 max-w-md text-sm text-mist-400">
            Kamu sudah masuk. Hitung mundur akan muncul di sini begitu panitia
            menetapkan waktu mulai, dan halaman ini diperbarui otomatis.
          </p>
        </div>
      ) : (
        <div
          role="timer"
          aria-label="Hitung mundur menuju contest"
          className="border-line bg-panel mt-9 flex w-full max-w-4xl items-end justify-center gap-3 rounded-2xl border px-4 py-9 sm:gap-8 sm:px-10"
        >
          <CountdownUnit value={days} label="Hari" />
          <Colon />
          <CountdownUnit value={hours} label="Jam" />
          <Colon />
          <CountdownUnit value={minutes} label="Menit" />
          <Colon />
          <CountdownUnit value={seconds} label="Detik" />
        </div>
      )}

      <div className="mt-6 grid w-full max-w-4xl gap-4 sm:grid-cols-3">
        <InfoCard label="Tim">{teamName.replace(/^tim\s+/i, "")}</InfoCard>
        <InfoCard label="Durasi">
          <span className="font-mono">
            {formatDurationLabel(contest.duration)}
          </span>
        </InfoCard>
        <InfoCard label="Jumlah soal">
          <span className="font-mono">{count > 0 ? `${count} soal` : "—"}</span>
        </InfoCard>
      </div>
    </PageContainer>
  );
}

// ---------- Contest berlangsung ----------

function StatCard({
  label,
  icon,
  children,
}: {
  label: string;
  icon?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="border-line bg-panel rounded-2xl border px-6 py-5">
      <div className="flex items-center justify-between">
        <p className="eyebrow">{label}</p>
        {icon}
      </div>
      <p className="mt-3 font-mono text-5xl leading-none font-bold">
        {children}
      </p>
    </div>
  );
}

const CHIP_STYLE: Record<CellStatus, string> = {
  first: "border-ok/70 bg-ok/10 text-foam-50",
  solved: "border-ok/70 bg-ok/10 text-foam-50",
  failed: "border-wa/70 bg-wa/10 text-foam-50",
  pending: "border-pending/70 bg-pending/10 text-foam-50",
  none: "border-line-strong text-foam-50",
};

function ProblemChip({ label, status }: { label: string; status: CellStatus }) {
  return (
    <li
      className={cn(
        "flex items-center justify-between rounded-lg border px-4 py-3.5 font-mono text-base font-bold",
        CHIP_STYLE[status],
      )}
    >
      {label}
      {(status === "solved" || status === "first") && (
        <Check
          className="text-ok size-4"
          strokeWidth={3}
          aria-label="Selesai"
        />
      )}
      {status === "failed" && (
        <X className="text-wa size-4" strokeWidth={3} aria-label="Salah" />
      )}
      {status === "pending" && (
        <Radio className="text-pending size-3.5" aria-label="Menunggu" />
      )}
      {status === "none" && (
        <span className="size-1 rounded-full bg-mist-400" aria-hidden="true" />
      )}
    </li>
  );
}

function HomeRunning() {
  const { teamId, teamName } = useContestInfo();
  const board = useContestQuery<Scoreboard>("scoreboard", 15_000);
  const problems = useContestQuery<ContestProblem[]>("problems", 60_000);
  const submissions = useContestQuery<Submission[]>("submissions", 5_000);
  const judgements = useContestQuery<Judgement[]>("judgements", 5_000);

  const myRow = board.data?.rows.find((r) => r.team_id === teamId);
  const mySubmissions = useMemo(
    () =>
      (submissions.data ?? [])
        .filter((s) => s.team_id === teamId)
        .sort((a, b) => (b.submitid ?? 0) - (a.submitid ?? 0)),
    [submissions.data, teamId],
  );
  const judgementBySubmission = useMemo(
    () => new Map((judgements.data ?? []).map((j) => [j.submission_id, j])),
    [judgements.data],
  );
  const labelByProblem = useMemo(
    () => new Map((problems.data ?? []).map((p) => [p.id, p.label])),
    [problems.data],
  );

  const total = problems.data?.length ?? myRow?.problems?.length ?? 0;
  const solved = myRow?.score?.num_solved ?? 0;
  const hasAttempts = !!myRow?.problems?.some(
    (p) => p.num_judged || p.num_pending,
  );
  const ranked = !!myRow && (solved > 0 || hasAttempts);
  const recent = mySubmissions.slice(0, 5);
  const noSubmission = submissions.isSuccess && mySubmissions.length === 0;

  return (
    <PageContainer>
      <h1 className="title-display text-[clamp(2.25rem,6vw,3.6rem)]">
        Selamat datang,{" "}
        <span className="text-aqua-400">{teamLabel(teamName)}</span>
      </h1>
      <p className="mt-2 text-mist-400">
        {noSubmission
          ? "Kontes sedang berlangsung. Kerjakan soal pertama kamu!"
          : "Kontes sedang berlangsung. Semoga lancar!"}
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Peringkat"
          icon={
            <Compass className="text-brass-400 size-5" aria-hidden="true" />
          }
        >
          {ranked ? (
            <span className="text-brass-400">#{myRow?.rank}</span>
          ) : (
            <span className="text-mist-400">—</span>
          )}
        </StatCard>
        <StatCard label="Soal terjawab">
          <span className={solved > 0 ? "text-ok" : "text-mist-400"}>
            {solved}/{total}
          </span>
        </StatCard>
        <StatCard label="Penalti">{myRow?.score?.total_time ?? 0}</StatCard>
        <StatCard label="Submission">{mySubmissions.length}</StatCard>
      </div>

      <section
        aria-labelledby="progres-soal"
        className="border-line bg-panel mt-5 rounded-2xl border p-6"
      >
        <h2 id="progres-soal" className="eyebrow">
          Progres soal
        </h2>
        {problems.isPending ? (
          <p className="mt-4 text-sm text-mist-400">Memuat soal...</p>
        ) : (
          <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
            {(problems.data ?? []).map((p) => (
              <ProblemChip
                key={p.id}
                label={p.label}
                status={cellStatus(
                  myRow?.problems?.find((c) => c.problem_id === p.id),
                )}
              />
            ))}
          </ul>
        )}
      </section>

      <section
        aria-labelledby="submission-terbaru"
        className="border-line bg-panel mt-5 overflow-hidden rounded-2xl border"
      >
        <h2 id="submission-terbaru" className="eyebrow px-6 py-5">
          Submission terbaru
        </h2>
        <div className="bg-ink-900 grid grid-cols-[1fr_1fr] gap-x-4 px-6 py-3.5 sm:grid-cols-[1.1fr_1fr_0.8fr_1.3fr]">
          <span className="eyebrow">Waktu</span>
          <span className="eyebrow">Soal</span>
          <span className="eyebrow hidden sm:block">ID</span>
          <span className="eyebrow hidden sm:block">Verdict</span>
        </div>

        {submissions.isPending ? (
          <p className="px-6 py-10 text-center text-sm text-mist-400">
            Memuat submission...
          </p>
        ) : recent.length === 0 ? (
          <div className="flex flex-col items-center px-6 py-12 text-center">
            <Radio className="text-aqua-400 size-8" aria-hidden="true" />
            <p className="mt-4 text-lg font-bold">Belum ada submission</p>
            <p className="mt-1 text-sm text-mist-400">
              Submission tim kamu akan muncul di sini.
            </p>
            <Link
              href="/problems"
              className={arenaButton("secondary", "mt-6 px-6 py-3")}
            >
              Buka problemset <ArrowRight className="size-4" />
            </Link>
          </div>
        ) : (
          <ul>
            {recent.map((s) => {
              const j = s.id ? judgementBySubmission.get(s.id) : undefined;
              return (
                <li
                  key={s.id ?? s.submitid}
                  className="border-line grid grid-cols-[1fr_1fr] items-center gap-x-4 gap-y-2 border-t px-6 py-4 sm:grid-cols-[1.1fr_1fr_0.8fr_1.3fr]"
                >
                  <span className="font-mono text-mist-400">
                    {parseContestTime(s.contest_time)}
                  </span>
                  <span className="font-mono font-bold">
                    {labelByProblem.get(s.problem_id) ?? s.problem_id}
                  </span>
                  <span className="hidden font-mono text-mist-400 sm:block">
                    #{s.submitid ?? s.id}
                  </span>
                  <span className="col-span-2 sm:col-span-1">
                    <VerdictBadge judgementTypeId={j?.judgement_type_id} />
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </PageContainer>
  );
}

// ---------- Contest selesai ----------

function FinalStat({
  label,
  className,
  children,
}: {
  label: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className="text-center">
      <p className="eyebrow">{label}</p>
      <p className={cn("mt-3 font-mono text-5xl font-bold", className)}>
        {children}
      </p>
    </div>
  );
}

function HomeEnded() {
  const { teamId } = useContestInfo();
  const board = useContestQuery<Scoreboard>("scoreboard", 30_000);
  const problems = useContestQuery<ContestProblem[]>("problems", 60_000);
  const myRow = board.data?.rows.find((r) => r.team_id === teamId);
  const total = problems.data?.length ?? myRow?.problems?.length ?? 0;

  return (
    <PageContainer className="flex min-h-full items-center justify-center">
      <section className="border-maroon-700/70 bg-panel w-full max-w-4xl overflow-hidden rounded-2xl border shadow-[0_0_80px_-20px_rgb(142_27_27/0.55)]">
        <div className="flex flex-col items-center px-6 pt-12 pb-9 text-center">
          <Compass className="text-brass-400 size-14" strokeWidth={1.5} />
          <h1 className="title-display mt-7 text-[clamp(3rem,9vw,5.8rem)]">
            Contest <span className="text-wa">concluded</span>
          </h1>
          <p className="mt-5 max-w-xl text-mist-400">
            Arena ditutup. Submission tidak lagi diterima. Terima kasih sudah
            berpartisipasi!
          </p>
        </div>

        <div className="border-line flex flex-wrap items-start justify-center gap-x-16 gap-y-6 border-t px-6 py-8">
          <FinalStat label="Peringkat akhir" className="text-brass-400">
            {myRow ? `#${myRow.rank}` : "—"}
          </FinalStat>
          <FinalStat label="Soal terjawab" className="text-ok">
            {myRow?.score?.num_solved ?? 0}/{total}
          </FinalStat>
          <FinalStat label="Penalti">{myRow?.score?.total_time ?? 0}</FinalStat>
        </div>

        <div className="border-line flex justify-center border-t px-6 py-8">
          <Link href="/leaderboard" className={arenaButton("primary", "px-7")}>
            Lihat klasemen akhir <ArrowRight className="size-4" />
          </Link>
        </div>
      </section>
    </PageContainer>
  );
}

// ---------- Halaman ----------

export default function HomePage() {
  const { phase } = useContestClock();

  return (
    <div className="flex min-h-full flex-col">
      <div className="flex-1">
        {phase === "before" && <HomeBefore />}
        {phase === "running" && <HomeRunning />}
        {phase === "ended" && <HomeEnded />}
        {phase === null && (
          <PageContainer>
            <p className="text-mist-400">Memuat contest...</p>
          </PageContainer>
        )}
      </div>
      {(phase === "before" || phase === "running" || phase === "ended") && (
        <SponsorBar />
      )}
    </div>
  );
}
