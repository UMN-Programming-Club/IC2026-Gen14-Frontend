// State in-memory untuk mode mock. Hilang saat server dev di-restart.
import type {
  Contest,
  ContestState,
  Judgement,
  Scoreboard,
  ScoreboardProblem,
  ScoreboardRow,
  Submission,
} from "@/lib/domjudge/types";
import {
  CONTEST_DURATION_MS,
  JUDGEMENT_TYPES,
  JUDGE_DELAY_MS,
  MOCK_CONTEST_ID,
  PENALTY_MINUTES,
  PROBLEMS,
  SEED_SUBMISSIONS,
  TEAMS,
} from "./data";

export interface MockSubmission {
  id: number;
  teamId: string;
  problemId: string;
  languageId: string;
  /** Waktu submit (epoch ms). */
  at: number;
  filename: string;
  verdict: string;
  /** true = tidak pernah selesai dinilai. */
  stuckPending: boolean;
}

interface MockState {
  startMs: number;
  submissions: MockSubmission[];
  nextId: number;
  /** Penghitung untuk memutar verdict submission baru. */
  cycle: number;
}

/** Verdict yang diberikan bergantian untuk submission baru, supaya semua kondisi sempat terlihat. */
const VERDICT_CYCLE = ["AC", "WA", "TLE", "AC", "CE", "RTE", "MLE"];

// `globalThis` dipakai agar state tidak ter-reset oleh hot reload / bundel route yang terpisah.
const g = globalThis as typeof globalThis & { __mockState?: MockState };

function seed(): MockState {
  const startMs = Date.now() - 60 * 60 * 1000;
  const submissions = SEED_SUBMISSIONS.map((s, i) => ({
    id: i + 1,
    teamId: s.teamId,
    problemId: s.problemId,
    languageId: s.languageId,
    at: startMs + s.minute * 60_000,
    filename: `seed.${s.languageId}`,
    verdict: s.verdict,
    stuckPending: !!s.pending,
  }));
  return { startMs, submissions, nextId: submissions.length + 1, cycle: 0 };
}

export function getState(): MockState {
  return (g.__mockState ??= seed());
}

export function isPending(s: MockSubmission, now: number): boolean {
  return s.stuckPending || now < s.at + JUDGE_DELAY_MS;
}

export function pickVerdict(state: MockState, code: string): string {
  const forced = /mock:(AC|WA|TLE|RTE|CE|MLE|OLE|NO)\b/i.exec(code)?.[1];
  if (forced) return forced.toUpperCase();
  return VERDICT_CYCLE[state.cycle++ % VERDICT_CYCLE.length];
}

export function addSubmission(
  teamId: string,
  problemId: string,
  languageId: string,
  filename: string,
  code: string,
): MockSubmission {
  const state = getState();
  const sub: MockSubmission = {
    id: state.nextId++,
    teamId,
    problemId,
    languageId,
    at: Date.now(),
    filename,
    verdict: pickVerdict(state, code),
    stuckPending: false,
  };
  state.submissions.push(sub);
  return sub;
}

// ---------- Bentuk respons ----------

function contestTime(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = String(Math.floor((total % 3600) / 60)).padStart(2, "0");
  const s = String(total % 60).padStart(2, "0");
  return `${h}:${m}:${s}.000`;
}

export function toSubmission(s: MockSubmission, startMs: number): Submission {
  return {
    id: String(s.id),
    submitid: s.id,
    team_id: s.teamId,
    problem_id: s.problemId,
    language_id: s.languageId,
    time: new Date(s.at).toISOString(),
    contest_time: contestTime(s.at - startMs),
    files: [
      {
        href: `contests/${MOCK_CONTEST_ID}/submissions/${s.id}/files`,
        mime: "application/zip",
        filename: s.filename,
      },
    ],
    entry_point: null,
    import_error: null,
  };
}

export function toJudgement(s: MockSubmission, now: number): Judgement {
  const pending = isPending(s, now);
  return {
    id: String(s.id),
    submission_id: String(s.id),
    judgement_type_id: pending ? null : s.verdict,
    start_time: new Date(s.at + 500).toISOString(),
    end_time: pending ? null : new Date(s.at + JUDGE_DELAY_MS).toISOString(),
    max_run_time: pending ? null : 0.12,
  };
}

export function buildContest(): Contest {
  const { startMs } = getState();
  return {
    cid: 1,
    id: MOCK_CONTEST_ID,
    shortname: MOCK_CONTEST_ID,
    name: "Internal Contest (Mock)",
    formal_name: "UMNPC Internal Contest (Mock)",
    scoreboard_type: "pass-fail",
    start_time: new Date(startMs).toISOString(),
    end_time: new Date(startMs + CONTEST_DURATION_MS).toISOString(),
    duration: "5:00:00.000",
    scoreboard_freeze_duration: "1:00:00.000",
    allow_submit: true,
    runtime_as_score_tiebreaker: false,
    warning_message: null,
    penalty_time: PENALTY_MINUTES,
  };
}

export function buildContestState(now: number): ContestState {
  const { startMs } = getState();
  const ended = now >= startMs + CONTEST_DURATION_MS;
  return {
    started: new Date(startMs).toISOString(),
    ended: ended ? new Date(startMs + CONTEST_DURATION_MS).toISOString() : null,
    frozen: null,
    thawed: null,
    finalized: null,
    end_of_updates: null,
  };
}

// ---------- Scoreboard ----------

interface TeamResult {
  teamId: string;
  solved: number;
  totalTime: number;
  problems: ScoreboardProblem[];
  /** Waktu AC (epoch ms) per problem id, untuk menentukan first-to-solve. */
  solvedAt: Map<string, number>;
}

function resultFor(
  teamId: string,
  subs: MockSubmission[],
  startMs: number,
  now: number,
): TeamResult {
  let solved = 0;
  let totalTime = 0;
  const solvedAt = new Map<string, number>();

  const problems = PROBLEMS.map((p): ScoreboardProblem => {
    const attempts = subs
      .filter((s) => s.teamId === teamId && s.problemId === p.id)
      .sort((a, b) => a.at - b.at);

    let judged = 0;
    let pending = 0;
    let wrong = 0;
    let acAt: number | undefined;

    for (const s of attempts) {
      if (acAt !== undefined) break; // submission setelah AC tidak dihitung
      if (isPending(s, now)) {
        pending++;
        continue;
      }
      judged++;
      if (s.verdict === "AC") acAt = s.at;
      else if (JUDGEMENT_TYPES.find((t) => t.id === s.verdict)?.penalty)
        wrong++;
    }

    let time: number | null = null;
    if (acAt !== undefined) {
      time = Math.floor((acAt - startMs) / 60_000);
      solved++;
      totalTime += time + wrong * PENALTY_MINUTES;
      solvedAt.set(p.id as string, acAt);
    }

    return {
      label: p.label,
      problem_id: p.id,
      num_judged: judged,
      num_pending: pending,
      solved: acAt !== undefined,
      time,
      first_to_solve: false,
      runtime: null,
      fastest_submission: null,
    };
  });

  return { teamId, solved, totalTime, problems, solvedAt };
}

export function buildScoreboard(now: number): Scoreboard {
  const state = getState();
  const results = TEAMS.map((t) =>
    resultFor(t.id as string, state.submissions, state.startMs, now),
  );

  // first-to-solve: AC paling awal per soal
  for (const p of PROBLEMS) {
    let best: { r: TeamResult; at: number } | undefined;
    for (const r of results) {
      const at = r.solvedAt.get(p.id as string);
      if (at !== undefined && (!best || at < best.at)) best = { r, at };
    }
    const cell = best?.r.problems.find((x) => x.problem_id === p.id);
    if (cell) cell.first_to_solve = true;
  }

  results.sort((a, b) => b.solved - a.solved || a.totalTime - b.totalTime);

  let rank = 0;
  const rows: ScoreboardRow[] = results.map((r, i) => {
    const prev = results[i - 1];
    // Seri (jumlah solved dan total waktu sama) berbagi peringkat.
    if (!prev || prev.solved !== r.solved || prev.totalTime !== r.totalTime) {
      rank = i + 1;
    }
    return {
      rank,
      team_id: r.teamId,
      score: {
        num_solved: r.solved,
        total_time: r.totalTime,
        total_runtime: null,
      },
      problems: r.problems,
    };
  });

  const elapsed = now - state.startMs;
  return {
    event_id: String(state.nextId),
    time: new Date(now).toISOString(),
    contest_time: contestTime(elapsed),
    state: buildContestState(now),
    rows,
  };
}
