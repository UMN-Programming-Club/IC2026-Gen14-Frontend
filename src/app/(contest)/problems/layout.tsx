"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo, type ReactNode } from "react";
import { Check, Lock, Radio, X } from "lucide-react";
import { useContestClock } from "@/components/arena/contest-clock";
import { PageContainer, PageTitle } from "@/components/arena/page-title";
import { useContestInfo } from "@/components/contest-context";
import { useContestQuery } from "@/lib/api-client";
import { cellStatus, type CellStatus } from "@/lib/contest-status";
import type { ContestProblem, Scoreboard } from "@/lib/domjudge/types";
import { cn } from "@/lib/utils";

function StatusIcon({ status }: { status: CellStatus }) {
  if (status === "solved" || status === "first")
    return (
      <Check className="text-ok size-5" strokeWidth={3} aria-label="Selesai" />
    );
  if (status === "failed")
    return <X className="text-wa size-5" strokeWidth={3} aria-label="Salah" />;
  if (status === "pending")
    return <Radio className="text-pending size-4" aria-label="Menunggu" />;
  return null;
}

/** Kolom kiri (daftar soal) dipertahankan saat berpindah soal; kolom kanan = `children`. */
export default function ProblemsLayout({ children }: { children: ReactNode }) {
  const { id: activeId } = useParams<{ id?: string }>();
  const { teamId } = useContestInfo();
  const { phase } = useContestClock();
  const problems = useContestQuery<ContestProblem[]>("problems", 60_000);
  const board = useContestQuery<Scoreboard>("scoreboard", 15_000);

  const myRow = useMemo(
    () => board.data?.rows.find((r) => r.team_id === teamId),
    [board.data, teamId],
  );

  return (
    <PageContainer>
      <PageTitle
        white="Contest"
        accent="problems"
        subtitle="Pilih soal untuk melihat detail dan mengirim solusi"
      />

      {phase === "before" ? (
        <div className="border-line bg-panel mt-8 flex flex-col items-center rounded-2xl border px-6 py-16 text-center">
          <Lock className="size-9 text-mist-400" aria-hidden="true" />
          <p className="mt-4 text-lg font-bold">Problemset masih terkunci</p>
          <p className="mt-1 text-sm text-mist-400">
            Soal terbuka begitu contest dimulai.
          </p>
        </div>
      ) : problems.isPending ? (
        <p className="mt-8 text-mist-400">Memuat soal...</p>
      ) : problems.isError ? (
        <p role="alert" className="text-wa mt-8">
          {problems.error.message}
        </p>
      ) : (
        <div className="mt-7 grid items-start gap-5 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.45fr)]">
          <nav aria-label="Daftar soal">
            <ul className="flex flex-col gap-3">
              {problems.data.map((p) => {
                const active = p.id === activeId;
                const status = cellStatus(
                  myRow?.problems?.find((c) => c.problem_id === p.id),
                );
                return (
                  <li key={p.id}>
                    <Link
                      href={`/problems/${encodeURIComponent(p.id ?? "")}`}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "focus-visible:ring-aqua-400/60 flex items-center gap-5 rounded-xl border px-5 py-[1.15rem] transition-colors outline-none focus-visible:ring-2",
                        active
                          ? "border-aqua-400/80 bg-aqua-400/[0.08]"
                          : "border-line hover:border-line-strong hover:bg-slate-800/40",
                      )}
                    >
                      <span className="text-aqua-400 w-10 font-mono text-lg font-bold">
                        {p.label}
                      </span>
                      <span className="flex-1 font-semibold">{p.name}</span>
                      <StatusIcon status={status} />
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div>{children}</div>
        </div>
      )}
    </PageContainer>
  );
}
