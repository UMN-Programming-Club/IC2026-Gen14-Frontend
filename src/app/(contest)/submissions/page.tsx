"use client";

import { useMemo } from "react";
import { format } from "date-fns";
import { useContestInfo } from "@/components/contest-context";
import { Badge } from "@/components/ui/badge";
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
  Judgement,
  JudgementType,
  Language,
  Submission,
} from "@/lib/domjudge/types";

function Verdict({
  judgement,
  types,
}: {
  judgement?: Judgement;
  types: Map<string | undefined, JudgementType>;
}) {
  if (!judgement || !judgement.judgement_type_id) {
    return <Badge variant="secondary">Menunggu / diproses</Badge>;
  }
  const type = types.get(judgement.judgement_type_id);
  const solved = type?.solved ?? judgement.judgement_type_id === "AC";
  return (
    <Badge
      variant={solved ? "default" : "destructive"}
      className={cn(solved && "bg-emerald-600 text-white hover:bg-emerald-600")}
    >
      {judgement.judgement_type_id}
      {type?.name ? ` · ${type.name}` : ""}
    </Badge>
  );
}

export default function SubmissionsPage() {
  const { teamId } = useContestInfo();
  const submissions = useContestQuery<Submission[]>("submissions", 5_000);
  const judgements = useContestQuery<Judgement[]>("judgements", 5_000);
  const problems = useContestQuery<ContestProblem[]>("problems", 60_000);
  const languages = useContestQuery<Language[]>("languages", 300_000);
  const jtypes = useContestQuery<JudgementType[]>("judgement-types", 300_000);

  const problemById = useMemo(
    () => new Map((problems.data ?? []).map((p) => [p.id, p])),
    [problems.data],
  );
  const languageById = useMemo(
    () => new Map((languages.data ?? []).map((l) => [l.id, l.name])),
    [languages.data],
  );
  const typeById = useMemo(
    () => new Map((jtypes.data ?? []).map((t) => [t.id, t])),
    [jtypes.data],
  );
  const judgementBySubmission = useMemo(
    () => new Map((judgements.data ?? []).map((j) => [j.submission_id, j])),
    [judgements.data],
  );

  if (submissions.isPending)
    return <p className="text-zinc-500">Memuat submission...</p>;
  if (submissions.isError) {
    return (
      <p role="alert" className="text-red-600">
        {submissions.error.message}
      </p>
    );
  }

  // DOMjudge sudah membatasi submission untuk akun tim; filter ini hanya pengaman tambahan.
  const mine = submissions.data
    .filter((s) => s.team_id === teamId)
    .sort((a, b) => (b.submitid ?? 0) - (a.submitid ?? 0));

  return (
    <div className="grid gap-3">
      <h1 className="text-lg font-semibold">Submission tim</h1>
      {mine.length === 0 ? (
        <p className="text-zinc-500">Belum ada submission.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Waktu</TableHead>
                <TableHead>Soal</TableHead>
                <TableHead>Bahasa</TableHead>
                <TableHead>Hasil</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mine.map((s) => {
                const problem = problemById.get(s.problem_id);
                return (
                  <TableRow key={s.id ?? s.submitid}>
                    <TableCell>{s.id ?? s.submitid}</TableCell>
                    <TableCell>
                      {s.time ? format(new Date(s.time), "HH:mm:ss") : "-"}
                    </TableCell>
                    <TableCell>
                      {problem
                        ? `${problem.label} · ${problem.name}`
                        : s.problem_id}
                    </TableCell>
                    <TableCell>
                      {languageById.get(s.language_id) ?? s.language_id}
                    </TableCell>
                    <TableCell>
                      <Verdict
                        judgement={
                          s.id ? judgementBySubmission.get(s.id) : undefined
                        }
                        types={typeById}
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
