"use client";

import { useMemo } from "react";
import { useContestInfo } from "@/components/contest-context";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useContestQuery } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import type {
  ContestProblem,
  Scoreboard,
  ScoreboardProblem,
  Team,
} from "@/lib/domjudge/types";

function Cell({ p }: { p?: ScoreboardProblem }) {
  if (!p) return <span className="text-zinc-300">·</span>;
  if (p.solved) {
    return (
      <span
        className={cn(
          "inline-block min-w-12 rounded px-2 py-1 text-xs font-medium",
          p.first_to_solve
            ? "bg-emerald-600 text-white"
            : "bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200",
        )}
      >
        {p.time ?? 0}
        {p.num_judged && p.num_judged > 1 ? ` (+${p.num_judged - 1})` : ""}
      </span>
    );
  }
  if (p.num_pending) {
    return (
      <span className="inline-block min-w-12 rounded bg-amber-100 px-2 py-1 text-xs font-medium text-amber-900 dark:bg-amber-950 dark:text-amber-200">
        ? {p.num_pending}
      </span>
    );
  }
  if (p.num_judged) {
    return (
      <span className="inline-block min-w-12 rounded bg-red-100 px-2 py-1 text-xs font-medium text-red-900 dark:bg-red-950 dark:text-red-200">
        -{p.num_judged}
      </span>
    );
  }
  return <span className="text-zinc-300">·</span>;
}

export default function ScoreboardPage() {
  const { teamId } = useContestInfo();
  const board = useContestQuery<Scoreboard>("scoreboard", 15_000);
  const teams = useContestQuery<Team[]>("teams", 60_000);
  const problems = useContestQuery<ContestProblem[]>("problems", 60_000);

  const teamName = useMemo(
    () =>
      new Map((teams.data ?? []).map((t) => [t.id, t.display_name || t.name])),
    [teams.data],
  );

  if (board.isPending)
    return <p className="text-zinc-500">Memuat scoreboard...</p>;
  if (board.isError) {
    return (
      <p role="alert" className="text-red-600">
        {board.error.message}
      </p>
    );
  }

  const cols = problems.data ?? [];
  const frozen = !!board.data.state?.frozen && !board.data.state?.thawed;

  return (
    <div className="grid gap-3">
      <div className="flex items-baseline justify-between">
        <h1 className="text-lg font-semibold">Scoreboard</h1>
        {frozen && (
          <p className="text-sm text-amber-700 dark:text-amber-300">
            Scoreboard sedang dibekukan.
          </p>
        )}
      </div>
      {board.data.rows.length === 0 ? (
        <p className="text-zinc-500">Belum ada tim di scoreboard.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">#</TableHead>
                <TableHead>Tim</TableHead>
                <TableHead className="text-right">Solved</TableHead>
                <TableHead className="text-right">Penalti</TableHead>
                {cols.map((c) => (
                  <TableHead key={c.id} className="text-center" title={c.name}>
                    {c.label}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {board.data.rows.map((row) => (
                <TableRow
                  key={row.team_id}
                  className={cn(
                    row.team_id === teamId && "bg-sky-50 dark:bg-sky-950/40",
                  )}
                >
                  <TableCell>{row.rank}</TableCell>
                  <TableCell className="font-medium">
                    {teamName.get(row.team_id) ?? row.team_id}
                  </TableCell>
                  <TableCell className="text-right">
                    {row.score?.num_solved ?? 0}
                  </TableCell>
                  <TableCell className="text-right">
                    {row.score?.total_time ?? 0}
                  </TableCell>
                  {cols.map((c) => (
                    <TableCell key={c.id} className="text-center">
                      <Cell
                        p={row.problems?.find((p) => p.problem_id === c.id)}
                      />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
