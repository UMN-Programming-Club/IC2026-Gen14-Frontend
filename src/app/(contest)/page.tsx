"use client";

import Link from "next/link";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { useContestInfo } from "@/components/contest-context";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useContestQuery } from "@/lib/api-client";
import type { ContestState, Scoreboard } from "@/lib/domjudge/types";

function fmt(iso?: string | null) {
  return iso
    ? format(new Date(iso), "EEEE, d MMM yyyy HH:mm", { locale: idLocale })
    : "-";
}

function phase(state?: ContestState) {
  if (!state?.started)
    return { label: "Belum dimulai", tone: "secondary" as const };
  if (state.ended) return { label: "Selesai", tone: "outline" as const };
  if (state.frozen)
    return { label: "Scoreboard dibekukan", tone: "secondary" as const };
  return { label: "Berlangsung", tone: "default" as const };
}

export default function OverviewPage() {
  const { contest, teamId, teamName } = useContestInfo();
  const state = useContestQuery<ContestState>("state", 15_000);
  const board = useContestQuery<Scoreboard>("scoreboard", 15_000);

  const myRow = board.data?.rows.find((r) => r.team_id === teamId);
  const p = phase(state.data);

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between gap-2">
            {contest.formal_name ?? contest.name}
            <Badge variant={p.tone}>{state.isPending ? "..." : p.label}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-1 text-sm">
          <p>
            <span className="text-zinc-500">Mulai:</span>{" "}
            {fmt(contest.start_time)}
          </p>
          <p>
            <span className="text-zinc-500">Selesai:</span>{" "}
            {fmt(contest.end_time)}
          </p>
          <p>
            <span className="text-zinc-500">Durasi:</span>{" "}
            {contest.duration ?? "-"}
          </p>
          <p>
            <span className="text-zinc-500">Penalti salah:</span>{" "}
            {contest.penalty_time ?? 20} menit
          </p>
          {contest.warning_message && (
            <p className="mt-2 rounded-md bg-amber-50 p-2 text-amber-800 dark:bg-amber-950 dark:text-amber-200">
              {contest.warning_message}
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{teamName}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3">
          {board.isPending ? (
            <p className="text-sm text-zinc-500">Memuat posisi tim...</p>
          ) : board.isError ? (
            <p role="alert" className="text-sm text-red-600">
              {board.error.message}
            </p>
          ) : myRow ? (
            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <p className="text-2xl font-semibold">{myRow.rank ?? "-"}</p>
                <p className="text-xs text-zinc-500">Peringkat</p>
              </div>
              <div>
                <p className="text-2xl font-semibold">
                  {myRow.score?.num_solved ?? 0}
                </p>
                <p className="text-xs text-zinc-500">Soal selesai</p>
              </div>
              <div>
                <p className="text-2xl font-semibold">
                  {myRow.score?.total_time ?? 0}
                </p>
                <p className="text-xs text-zinc-500">Penalti (mnt)</p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-zinc-500">
              Tim kamu belum muncul di scoreboard contest ini.
            </p>
          )}
          <div className="flex gap-2">
            <Button render={<Link href="/problems" />} nativeButton={false}>
              Lihat soal
            </Button>
            <Button
              variant="outline"
              render={<Link href="/scoreboard" />}
              nativeButton={false}
            >
              Scoreboard
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
