"use client";

import { useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useContestClock } from "@/components/arena/contest-clock";
import { useContestInfo } from "@/components/contest-context";
import { useContestQuery } from "@/lib/api-client";
import type {
  Judgement,
  JudgementType,
  Submission,
} from "@/lib/domjudge/types";
import {
  computeOutcomes,
  hasPendingSubmission,
  NO_OUTCOME,
  type ProblemOutcome,
} from "@/lib/my-outcomes";
import { POLL_SUBMISSIONS, POLL_SUBMISSIONS_WAITING } from "@/lib/polling";

/**
 * Status tim sendiri per soal, dari submission + judgement (diperbarui tiap 5 dtk, 2 dtk selama ada
 * yang masih dinilai). Tidak terpengaruh freeze, lihat penjelasan di `my-outcomes.ts`.
 */
export function useMyOutcomes() {
  const { teamId } = useContestInfo();
  const { end } = useContestClock();
  const queryClient = useQueryClient();

  // Jeda ditentukan dari isi cache kedua query, jadi satu fungsi dipakai bersama.
  const interval = () =>
    hasPendingSubmission(
      queryClient.getQueryData<Submission[]>(["contest", "submissions"]),
      queryClient.getQueryData<Judgement[]>(["contest", "judgements"]),
      teamId,
      end,
    )
      ? POLL_SUBMISSIONS_WAITING
      : POLL_SUBMISSIONS;

  const submissions = useContestQuery<Submission[]>("submissions", interval);
  const judgements = useContestQuery<Judgement[]>("judgements", interval);
  const jtypes = useContestQuery<JudgementType[]>("judgement-types", 300_000);

  const outcomes = useMemo(
    () =>
      computeOutcomes(
        submissions.data,
        judgements.data,
        jtypes.data,
        teamId,
        end,
      ),
    [submissions.data, judgements.data, jtypes.data, teamId, end],
  );

  return {
    submissions,
    judgements,
    jtypes,
    outcomes,
    /** Status satu soal; `NO_OUTCOME` bila belum ada submission. */
    outcomeOf: (problemId: string): ProblemOutcome =>
      outcomes.get(problemId) ?? NO_OUTCOME,
    /** Data pertama belum tiba. */
    loading: submissions.isPending || judgements.isPending,
  };
}
