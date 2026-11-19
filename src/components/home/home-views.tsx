"use client";

import Link from "next/link";
import { useLayoutEffect, useRef, useState, type RefObject } from "react";
import { ArrowRight, Check, Compass, Radio, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import type {
  ChipStatus,
  HomeStats,
  Phase,
  ProblemChip,
  SubmissionRow,
  VerdictKind,
} from "./home-model";
import { formatHms, pad2, splitDuration } from "./use-now";

const LABEL =
  "text-[0.68rem] font-semibold tracking-[0.1em] text-muted-foreground uppercase lg:text-[0.72rem]";

/* ------------------------------------------------------------------ Timer (pojok kanan atas) */

export function TimerBlock({
  phase,
  now,
  targetMs,
  startLabel,
}: {
  phase: Phase;
  now: number | null;
  targetMs: number | null;
  startLabel: string;
}) {
  let label = "Sisa Waktu";
  let value = "--:--:--";
  let tone = "text-foreground";
  if (phase === "before") {
    label = "Arena Dibuka";
    value = startLabel;
  } else if (phase === "ended") {
    label = "Status";
    value = "00:00:00";
    tone = "text-[#ef6b6b]";
  } else if (now !== null && targetMs !== null) {
    value = formatHms(targetMs - now);
  }
  return (
    <div className="flex h-[2.9rem] shrink-0 items-start justify-end px-4 pt-2 lg:h-[3.3rem] lg:px-[2.1rem] lg:pt-[0.5rem]">
      <div className="text-right leading-none">
        <p className={cn(LABEL, "tracking-[0.14em]")}>{label}</p>
        <p
          className={cn(
            "mt-1 font-mono font-bold tabular-nums",
            phase === "before"
              ? "text-foreground/80 text-[0.95rem] font-medium tracking-[0.08em] lg:text-[1.05rem]"
              : "text-[1.15rem] lg:text-[1.65rem]",
            tone,
          )}
        >
          {value}
        </p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ Sebelum mulai */

function CountdownCard({
  now,
  targetMs,
}: {
  now: number | null;
  targetMs: number | null;
}) {
  const d =
    now !== null && targetMs !== null ? splitDuration(targetMs - now) : null;
  const cols = [
    { v: d?.days, l: "Hari" },
    { v: d?.hours, l: "Jam" },
    { v: d?.minutes, l: "Menit" },
    { v: d?.seconds, l: "Detik" },
  ];
  return (
    <div
      className="border-line bg-surface flex w-full max-w-[45.1rem] items-center justify-center rounded-2xl border px-3 py-5 lg:h-[10.95rem] lg:py-0"
      role="timer"
      aria-label="Hitung mundur menuju contest"
    >
      {cols.map((c, i) => (
        <div key={c.l} className="flex items-center">
          {i > 0 && (
            <div className="flex w-[1.2rem] flex-col items-center gap-[0.55rem] pb-6 lg:w-[2.1rem] lg:gap-[1.15rem] lg:pb-[2.2rem]">
              <span className="bg-teal size-[0.35rem] rounded-full lg:size-[0.7rem]" />
              <span className="bg-teal size-[0.35rem] rounded-full lg:size-[0.7rem]" />
            </div>
          )}
          <div className="w-[3.6rem] text-center min-[420px]:w-[4.6rem] lg:w-[8.2rem]">
            <p className="font-mono text-[clamp(1.9rem,9vw,2.8rem)] leading-none font-bold tabular-nums lg:text-[4.6rem]">
              {c.v === undefined ? "--" : pad2(c.v)}
            </p>
            <p className="text-muted-foreground mt-2 text-[0.62rem] font-semibold tracking-[0.12em] uppercase lg:mt-[1.15rem] lg:text-[0.74rem]">
              {c.l}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

function InfoCard({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="border-line bg-surface flex items-center justify-between rounded-xl border px-4 py-2.5 sm:block lg:h-[4.9rem] lg:px-[1.3rem] lg:py-[1.05rem]">
      <p className={LABEL}>{label}</p>
      <p
        className={cn(
          "text-[0.95rem] font-semibold sm:mt-1.5 lg:mt-2 lg:text-[1.3rem]",
          mono && "font-mono text-[0.9rem] lg:text-[1.2rem]",
        )}
      >
        {value}
      </p>
    </div>
  );
}

export function BeforeView({
  now,
  targetMs,
  teamName,
  durationLabel,
  problemCount,
}: {
  now: number | null;
  targetMs: number | null;
  teamName: string;
  durationLabel: string;
  problemCount: number | null;
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-4 pb-4 text-center lg:px-[2.1rem] lg:pb-[4.8rem]">
      <span className="border-teal/35 bg-teal/[0.06] font-display rounded-full border px-[1.15rem] py-[0.28rem] text-[0.8rem] font-semibold tracking-[0.1em] text-[#7fd6c9] uppercase italic lg:text-[0.95rem]">
        Gen XIV
      </span>
      <h1 className="font-display mt-3 text-[clamp(2.6rem,13vw,3.8rem)] leading-[0.9] font-extrabold uppercase italic lg:mt-[1rem] lg:text-[4.9rem] lg:whitespace-nowrap">
        Get <span className="text-teal">Ready</span>
      </h1>
      <p className="text-muted-foreground mt-2 text-[0.9rem] lg:mt-[0.55rem] lg:text-[1.02rem]">
        Arena dibuka dalam
      </p>
      <div className="mt-4 flex w-full justify-center lg:mt-[1.8rem]">
        <CountdownCard now={now} targetMs={targetMs} />
      </div>
      <div className="mt-3 grid w-full max-w-[45.1rem] grid-cols-1 gap-2 text-left sm:grid-cols-3 lg:mt-[1.3rem] lg:gap-[1.05rem]">
        <InfoCard label="Tim" value={teamName.replace(/^tim\s+/i, "")} />
        <InfoCard label="Durasi" value={durationLabel} mono />
        <InfoCard
          label="Jumlah Soal"
          value={problemCount === null ? "-" : `${problemCount} soal`}
          mono
        />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ Berlangsung */

function StatCard({
  label,
  children,
  icon,
}: {
  label: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <div className="border-line bg-surface relative rounded-2xl border px-4 py-3 lg:h-[6.1rem] lg:px-[1.3rem] lg:py-[1.1rem]">
      <p className={LABEL}>{label}</p>
      <p className="mt-1.5 text-[1.7rem] leading-none font-bold tabular-nums lg:mt-[0.95rem] lg:text-[2.3rem]">
        {children}
      </p>
      {icon && (
        <span className="absolute top-3 right-4 lg:top-[1.05rem] lg:right-[1.2rem]">
          {icon}
        </span>
      )}
    </div>
  );
}

const CHIP_STYLE: Record<ChipStatus, string> = {
  none: "border-[#2a3a3c] bg-[#172224]",
  solved: "border-success/70 bg-[#12302a]",
  wrong: "border-danger/70 bg-[#2b1616]",
  pending: "border-pending/70 bg-[#13223a]",
};

function ChipIcon({ status }: { status: ChipStatus }) {
  const c = "size-[0.95rem] lg:size-[1.05rem]";
  if (status === "solved")
    return <Check className={cn(c, "text-success")} strokeWidth={2.5} />;
  if (status === "wrong")
    return <X className={cn(c, "text-danger")} strokeWidth={2.5} />;
  if (status === "pending") return <Radio className={cn(c, "text-pending")} />;
  return <span className="bg-dim size-[0.2rem] rounded-full" />;
}

function ProgressCard({ chips }: { chips: ProblemChip[] }) {
  return (
    <Card className="border-line bg-surface gap-0 rounded-2xl border px-4 py-3 ring-0 lg:px-[1.3rem] lg:py-[1.1rem]">
      <p className={LABEL}>Progres Soal</p>
      <div
        className="mt-2.5 grid grid-cols-3 gap-2 lg:mt-[0.8rem] lg:[grid-template-columns:repeat(var(--n),minmax(0,1fr))] lg:gap-[0.65rem]"
        style={{ "--n": Math.max(chips.length, 1) } as React.CSSProperties}
      >
        {chips.map((c) => (
          <div
            key={c.label}
            className={cn(
              "flex h-[2.3rem] items-center justify-between rounded-lg border px-3 font-mono text-[0.85rem] font-bold lg:h-[2.6rem] lg:px-[1rem] lg:text-[1rem]",
              CHIP_STYLE[c.status],
            )}
          >
            {c.label}
            <ChipIcon status={c.status} />
          </div>
        ))}
      </div>
    </Card>
  );
}

const BADGE_STYLE: Record<VerdictKind, string> = {
  accepted: "bg-[#12332a] text-success",
  wrong: "bg-[#2c1717] text-danger",
  pending: "bg-[#13223a] text-[#5aa9e6]",
};

function VerdictBadge({ kind, text }: { kind: VerdictKind; text: string }) {
  const Icon = kind === "accepted" ? Check : kind === "wrong" ? X : Radio;
  return (
    <Badge
      className={cn(
        "h-[1.35rem] gap-1.5 rounded-full px-2.5 text-[0.75rem] font-medium lg:h-[1.5rem] lg:text-[0.85rem]",
        BADGE_STYLE[kind],
      )}
    >
      <Icon className="size-3" strokeWidth={2.5} />
      {text}
    </Badge>
  );
}

/** Jumlah baris yang muat di dalam elemen `ref`, tanpa memunculkan scroll. */
function useFitCount(
  ref: RefObject<HTMLElement | null>,
  rowRem: number,
  headRem: number,
  max: number,
) {
  const [count, setCount] = useState(max);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => {
      const rem = parseFloat(
        getComputedStyle(document.documentElement).fontSize,
      );
      // +0.12 baris: toleransi pembulatan piksel (border), tetap tanpa scroll karena kontainer overflow-hidden.
      const fit = Math.floor(
        (el.clientHeight - headRem * rem) / (rowRem * rem) + 0.12,
      );
      setCount(Math.max(1, Math.min(max, fit)));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref, rowRem, headRem, max]);
  return count;
}

function SubmissionsCard({ rows }: { rows: SubmissionRow[] }) {
  const bodyRef = useRef<HTMLDivElement>(null);
  const tableCount = useFitCount(bodyRef, 2.7, 1.9, 4);
  const listCount = useFitCount(bodyRef, 3.4, 0, 3);

  return (
    <Card className="border-line bg-surface min-h-0 flex-1 gap-0 rounded-2xl border py-0 ring-0">
      <p
        className={cn(
          LABEL,
          "px-4 pt-3 pb-2.5 lg:px-[1.3rem] lg:pt-[1.15rem] lg:pb-[0.6rem]",
        )}
      >
        Submission Terbaru
      </p>
      <div
        ref={bodyRef}
        className="flex min-h-0 flex-1 flex-col overflow-hidden"
      >
        {rows.length === 0 ? (
          <div className="flex flex-1 flex-col">
            <div className="bg-surface-deep hidden h-[1.9rem] items-center px-[1.3rem] md:flex">
              <HeadCells />
            </div>
            <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-1 px-4 py-2 text-center">
              <Radio className="text-teal size-[1.2rem] lg:size-[1.4rem]" />
              <p className="mt-1 text-[0.95rem] font-semibold lg:text-[1.02rem]">
                Belum ada submission
              </p>
              <p className="text-muted-foreground text-[0.8rem] lg:text-[0.88rem]">
                Submission tim kamu akan muncul di sini.
              </p>
              <Button
                variant="outline"
                render={<Link href="/problems" />}
                nativeButton={false}
                className="border-teal/60 text-teal hover:bg-teal/10 hover:text-teal mt-2 h-[2.1rem] rounded-lg bg-transparent px-5 text-[0.76rem] font-bold tracking-[0.08em] uppercase lg:mt-[0.9rem] lg:h-[2.2rem] lg:px-[1.5rem]"
              >
                Buka Problemset
                <ArrowRight className="size-4" strokeWidth={2.5} />
              </Button>
            </div>
          </div>
        ) : (
          <>
            {/* Tablet dan desktop: tabel */}
            <Table className="hidden md:table">
              <TableHeader>
                <TableRow className="bg-surface-deep hover:bg-surface-deep h-[1.9rem] border-0">
                  <TableHead className="text-muted-foreground h-[1.9rem]! w-[26%] pl-[1.3rem] text-[0.72rem] font-semibold tracking-[0.1em] uppercase">
                    Waktu
                  </TableHead>
                  <TableHead className="text-muted-foreground h-[1.9rem]! w-[21.7%] text-[0.72rem] font-semibold tracking-[0.1em] uppercase">
                    Soal
                  </TableHead>
                  <TableHead className="text-muted-foreground h-[1.9rem]! w-[21.8%] text-[0.72rem] font-semibold tracking-[0.1em] uppercase">
                    ID
                  </TableHead>
                  <TableHead className="text-muted-foreground h-[1.9rem]! text-[0.72rem] font-semibold tracking-[0.1em] uppercase">
                    Verdict
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.slice(0, tableCount).map((r) => (
                  <TableRow
                    key={r.id}
                    className="border-line h-[2.7rem] hover:bg-white/[0.02]"
                  >
                    <TableCell className="text-muted-foreground pl-[1.3rem] font-mono text-[0.85rem]">
                      {r.time}
                    </TableCell>
                    <TableCell className="font-mono text-[0.9rem] font-bold">
                      {r.problem}
                    </TableCell>
                    <TableCell className="text-muted-foreground font-mono text-[0.9rem]">
                      {r.id}
                    </TableCell>
                    <TableCell>
                      <VerdictBadge kind={r.kind} text={r.text} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {/* Mobile: daftar kartu ringkas */}
            <ul className="flex flex-col gap-1.5 px-3 pb-3 md:hidden">
              {rows.slice(0, listCount).map((r) => (
                <li
                  key={r.id}
                  className="border-line bg-surface-deep flex h-[3rem] items-center justify-between rounded-lg border px-3"
                >
                  <div className="leading-tight">
                    <p className="font-mono text-[0.85rem] font-bold">
                      {r.problem}{" "}
                      <span className="text-muted-foreground font-normal">
                        {r.id}
                      </span>
                    </p>
                    <p className="text-muted-foreground font-mono text-[0.7rem]">
                      {r.time}
                    </p>
                  </div>
                  <VerdictBadge kind={r.kind} text={r.text} />
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </Card>
  );
}

function HeadCells() {
  const h =
    "text-[0.72rem] font-semibold tracking-[0.1em] text-muted-foreground uppercase";
  return (
    <div className="grid w-full grid-cols-[26%_21.7%_21.8%_1fr]">
      <span className={cn(h)}>Waktu</span>
      <span className={h}>Soal</span>
      <span className={h}>ID</span>
      <span className={h}>Verdict</span>
    </div>
  );
}

export function RunningView({
  teamName,
  stats,
  chips,
  rows,
}: {
  teamName: string;
  stats: HomeStats;
  chips: ProblemChip[];
  rows: SubmissionRow[];
}) {
  const total = chips.length;
  const hasSubs = stats.submissionCount > 0;
  const showRank = hasSubs && stats.rank !== null;
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 px-4 pb-3 lg:gap-[1rem] lg:px-[2.1rem] lg:pb-[2.2rem]">
      <header className="lg:pt-[1.9rem] lg:pb-[0.4rem]">
        <h1 className="font-display text-[1.7rem] leading-none font-extrabold uppercase italic lg:text-[2.4rem]">
          Selamat datang, <span className="text-teal">{teamName}</span>
        </h1>
        <p className="text-muted-foreground mt-1.5 text-[0.85rem] lg:mt-[0.45rem] lg:text-[0.95rem]">
          {hasSubs
            ? "Kontes sedang berlangsung. Semoga lancar!"
            : "Kontes sedang berlangsung. Kerjakan soal pertama kamu!"}
        </p>
      </header>

      <div className="grid grid-cols-2 gap-2 lg:grid-cols-4 lg:gap-[1.05rem]">
        <StatCard
          label="Peringkat"
          icon={
            showRank ? (
              <Compass className="text-gold size-[1.1rem] lg:size-[1.3rem]" />
            ) : undefined
          }
        >
          {showRank ? (
            <span className="text-gold">#{stats.rank}</span>
          ) : (
            <span className="text-muted-foreground">—</span>
          )}
        </StatCard>
        <StatCard label="Soal Terjawab">
          <span
            className={
              stats.solved > 0 ? "text-success" : "text-muted-foreground"
            }
          >
            {stats.solved}/{total || "-"}
          </span>
        </StatCard>
        <StatCard label="Penalti">{stats.penalty}</StatCard>
        <StatCard label="Submission">{stats.submissionCount}</StatCard>
      </div>

      <ProgressCard chips={chips} />
      <SubmissionsCard rows={rows} />
    </div>
  );
}

/* ------------------------------------------------------------------ Selesai */

export function EndedView({
  stats,
  total,
}: {
  stats: HomeStats;
  total: number;
}) {
  return (
    <div className="flex min-h-0 flex-1 items-center justify-center px-4 pb-4 lg:px-[2.1rem] lg:pb-[2.4rem]">
      <div className="bg-surface w-full max-w-[45.1rem] overflow-hidden rounded-2xl border border-[#5c2326] text-center shadow-[0_0_5rem_rgb(224_70_70/0.16)]">
        <div className="px-4 pt-6 pb-6 lg:pt-[3.15rem] lg:pb-[2.4rem]">
          <span className="border-gold text-gold mx-auto grid size-[2.2rem] place-items-center rounded-full border-2 lg:size-[2.55rem]">
            <Compass className="size-[1.1rem] lg:size-[1.3rem]" />
          </span>
          <h1 className="font-display mt-4 text-[clamp(2rem,10vw,3rem)] leading-[0.95] font-extrabold uppercase italic lg:mt-[1.3rem] lg:text-[4.6rem] lg:whitespace-nowrap">
            Contest <span className="text-[#e45c5c]">Concluded</span>
          </h1>
          <p className="text-muted-foreground mx-auto mt-2 max-w-[34rem] text-[0.82rem] lg:mt-[0.75rem] lg:max-w-none lg:text-[0.98rem]">
            Arena ditutup. Submission tidak lagi diterima. Terima kasih sudah
            berpartisipasi!
          </p>
        </div>

        <div className="border-line flex items-start justify-center gap-6 border-y px-4 py-4 lg:gap-[2.6rem] lg:py-[1.35rem]">
          <EndStat label="Peringkat Akhir" tone="text-gold">
            {stats.rank !== null ? `#${stats.rank}` : "—"}
          </EndStat>
          <EndStat label="Soal Terjawab" tone="text-success">
            {stats.solved}/{total || "-"}
          </EndStat>
          <EndStat label="Penalti">{stats.penalty}</EndStat>
        </div>

        <div className="px-4 py-5 lg:py-[2.35rem]">
          <Button
            render={<Link href="/scoreboard" />}
            nativeButton={false}
            className="bg-teal hover:bg-teal/90 h-[2.6rem] rounded-lg px-6 text-[0.8rem] font-bold tracking-[0.06em] text-[#06201c] uppercase shadow-[0_0.5rem_1.9rem_-0.4rem_rgb(64_186_169/0.4)] lg:h-[3.15rem] lg:px-[2.4rem] lg:text-[0.95rem]"
          >
            Lihat Klasemen Akhir
            <ArrowRight className="size-4" strokeWidth={2.5} />
          </Button>
        </div>
      </div>
    </div>
  );
}

function EndStat({
  label,
  tone,
  children,
}: {
  label: string;
  tone?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className={LABEL}>{label}</p>
      <p
        className={cn(
          "mt-1.5 text-[1.7rem] leading-none font-bold lg:mt-[0.8rem] lg:text-[2.4rem]",
          tone,
        )}
      >
        {children}
      </p>
    </div>
  );
}
