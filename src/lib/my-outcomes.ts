import type {
  Judgement,
  JudgementType,
  Scoreboard,
  Submission,
} from "@/lib/domjudge/types";
import { describeVerdict, type Verdict } from "@/lib/verdicts";

/**
 * Status satu soal bagi tim sendiri, dihitung dari submission + judgement milik tim.
 *
 * Sengaja TIDAK dibaca dari /scoreboard: untuk akun tim, DOMjudge memberi scoreboard publik, yang ikut
 * dibekukan saat freeze (sel tim sendiri pun tampil "pending"). Sebaliknya /submissions dan /judgements
 * tidak dibekukan dan hanya berisi data tim sendiri, jadi tim tetap tahu benar atau salahnya.
 */
export type OutcomeStatus = "solved" | "pending" | "failed" | "none";

export interface ProblemOutcome {
  status: OutcomeStatus;
  /** Jumlah submission yang sudah selesai dinilai (termasuk yang AC). */
  judged: number;
  /** Menit contest saat AC pertama (dibulatkan ke bawah); null bila belum solved. */
  solvedMinutes: number | null;
  /** Verdict submission terbaru pada soal ini (hanya diisi bila belum solved). */
  latest: Verdict | null;
}

export const NO_OUTCOME: ProblemOutcome = {
  status: "none",
  judged: 0,
  solvedMinutes: null,
  latest: null,
};

/** "2:14:10.000" -> 134 (menit). */
function contestMinutes(t?: string | null): number | null {
  const m = /^(\d+):(\d{2}):(\d{2})/.exec(t ?? "");
  return m ? Number(m[1]) * 60 + Number(m[2]) : null;
}

/**
 * Submission tim sendiri yang dihitung. Submission yang masuk setelah contest selesai disimpan DOMjudge
 * tetapi tidak pernah dinilai, jadi diabaikan agar tidak terlihat "pending" selamanya.
 */
function mine(
  submissions: Submission[] | undefined,
  teamId: string,
  endMs: number | null,
): Submission[] {
  return (submissions ?? []).filter(
    (s) =>
      s.team_id === teamId &&
      (endMs === null || !(Date.parse(s.time ?? "") >= endMs)),
  );
}

function judgementsBySubmission(judgements: Judgement[] | undefined) {
  return new Map((judgements ?? []).map((j) => [j.submission_id, j]));
}

/** true bila ada submission tim yang belum punya hasil (masih antre atau sedang dinilai). */
export function hasPendingSubmission(
  submissions: Submission[] | undefined,
  judgements: Judgement[] | undefined,
  teamId: string,
  endMs: number | null,
): boolean {
  const bySub = judgementsBySubmission(judgements);
  return mine(submissions, teamId, endMs).some(
    (s) => !bySub.get(s.id as string)?.judgement_type_id,
  );
}

export function computeOutcomes(
  submissions: Submission[] | undefined,
  judgements: Judgement[] | undefined,
  types: JudgementType[] | undefined,
  teamId: string,
  endMs: number | null,
): Map<string, ProblemOutcome> {
  const bySub = judgementsBySubmission(judgements);
  const typeById = new Map((types ?? []).map((t) => [t.id, t]));

  const byProblem = new Map<string, Submission[]>();
  for (const s of mine(submissions, teamId, endMs)) {
    const pid = s.problem_id as string;
    const list = byProblem.get(pid);
    if (list) list.push(s);
    else byProblem.set(pid, [s]);
  }

  const out = new Map<string, ProblemOutcome>();
  for (const [pid, list] of byProblem) {
    list.sort(
      (a, b) =>
        Date.parse(a.time ?? "") - Date.parse(b.time ?? "") ||
        Number(a.id) - Number(b.id),
    );

    let judged = 0;
    let pending = 0;
    let solvedMinutes: number | null = null;
    let solved = false;
    let latest: Verdict | null = null;

    for (const s of list) {
      const typeId = bySub.get(s.id as string)?.judgement_type_id ?? null;
      if (!typeId) {
        pending++;
        latest = describeVerdict(null, types);
        continue;
      }
      judged++;
      latest = describeVerdict(typeId, types);
      if (typeById.get(typeId)?.solved ?? typeId === "AC") {
        // Seperti scoreboard: submission setelah AC pertama tidak dihitung.
        solved = true;
        solvedMinutes = Math.max(0, contestMinutes(s.contest_time) ?? 0);
        break;
      }
    }

    out.set(pid, {
      status: solved
        ? "solved"
        : pending > 0
          ? "pending"
          : judged > 0
            ? "failed"
            : "none",
      judged,
      solvedMinutes,
      latest: solved ? null : latest,
    });
  }
  return out;
}

/** Scoreboard sedang dibekukan (sel tidak berubah sampai juri meng-unfreeze). */
export function isFrozen(board: Scoreboard | undefined): boolean {
  return !!board?.state?.frozen && !board.state.thawed;
}

/** Ada tim yang punya submission belum terjawab di scoreboard. */
export function boardHasPending(board: Scoreboard | undefined): boolean {
  return (
    board?.rows.some((r) => r.problems?.some((p) => (p.num_pending ?? 0) > 0)) ??
    false
  );
}
