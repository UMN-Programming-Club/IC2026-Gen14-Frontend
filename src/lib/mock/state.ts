// State in-memory untuk mode mock. Hilang saat server dev di-restart.
import { env } from "@/lib/env";
import type {
  Contest,
  ContestProblem,
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
  RUNNING_ELAPSED_MIN,
  SEED_SUBMISSIONS,
  TEAMS,
} from "./data";

export type MockPhase = "before" | "running" | "ended";

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

const MIN = 60_000;

// `globalThis` dipakai agar state tidak ter-reset oleh hot reload / bundel route yang terpisah.
const g = globalThis as typeof globalThis & { __mockState?: MockState };

function seed(): MockState {
  const now = Date.now();
  const scenario = env.MOCK_SCENARIO;

  const startMs =
    scenario === "before"
      ? now + (8 * 24 * 60 + 14 * 60 + 37) * MIN + 8_000
      : scenario === "soon"
        ? now + 25_000 // untuk menguji peralihan otomatis saat contest mulai
        : scenario === "unscheduled"
          ? now + 10 * 365 * 24 * 60 * MIN // tidak pernah tercapai selama sesi
          : scenario === "ended"
            ? now - CONTEST_DURATION_MS - 5 * MIN
            : scenario === "ending"
              ? now - CONTEST_DURATION_MS + 50_000 // freeze ~25 dtk lagi, selesai ~50 dtk lagi
              : now - RUNNING_ELAPSED_MIN * MIN;

  // Sebelum contest dimulai belum ada submission.
  const seeds =
    scenario === "before" || scenario === "soon" || scenario === "unscheduled"
      ? []
      : SEED_SUBMISSIONS;
  const submissions = seeds.map((s, i) => ({
    id: i + 1,
    teamId: s.teamId,
    problemId: s.problemId,
    languageId: s.languageId,
    at: startMs + s.minute * MIN,
    filename: `seed.${s.languageId}`,
    verdict: s.verdict,
    // Setelah contest selesai, semua submission sudah selesai dinilai.
    stuckPending: scenario === "ended" ? false : !!s.pending,
  }));
  return { startMs, submissions, nextId: submissions.length + 1, cycle: 0 };
}

export function getState(): MockState {
  return (g.__mockState ??= seed());
}

export function getPhase(now: number): MockPhase {
  const { startMs } = getState();
  if (now < startMs) return "before";
  if (now >= startMs + CONTEST_DURATION_MS) return "ended";
  return "running";
}

/** DOMjudge menyembunyikan daftar soal dari tim sebelum contest dimulai. */
export function visibleProblems(now: number): ContestProblem[] {
  return getPhase(now) === "before" ? [] : PROBLEMS;
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
  const unscheduled = env.MOCK_SCENARIO === "unscheduled";
  return {
    cid: 1,
    id: MOCK_CONTEST_ID,
    shortname: MOCK_CONTEST_ID,
    name: "Internal Contest (Mock)",
    formal_name: "UMNPC Internal Contest (Mock)",
    scoreboard_type: "pass-fail",
    // Contest yang sudah di-activate tapi start time-nya belum diisi: DOMjudge mengirim null.
    start_time: unscheduled ? null : new Date(startMs).toISOString(),
    end_time: unscheduled
      ? null
      : new Date(startMs + CONTEST_DURATION_MS).toISOString(),
    duration: "3:00:00.000",
    scoreboard_freeze_duration: freezeDurationLabel(),
    allow_submit: true,
    runtime_as_score_tiebreaker: false,
    warning_message: null,
    penalty_time: PENALTY_MINUTES,
  };
}

/** Lama freeze scoreboard sebelum contest berakhir. Skenario "ending" memakai 25 detik agar mudah diuji. */
function freezeDurationMs(): number {
  return env.MOCK_SCENARIO === "ending" ? 25_000 : 15 * MIN;
}

function freezeDurationLabel(): string {
  return env.MOCK_SCENARIO === "ending" ? "0:00:25.000" : "0:15:00.000";
}

export function buildContestState(now: number): ContestState {
  const { startMs } = getState();
  const phase = getPhase(now);
  const freezeAt = startMs + CONTEST_DURATION_MS - freezeDurationMs();
  return {
    started: phase === "before" ? null : new Date(startMs).toISOString(),
    ended:
      phase === "ended"
        ? new Date(startMs + CONTEST_DURATION_MS).toISOString()
        : null,
    // Seperti DOMjudge: setelah freeze tetap beku (juga setelah selesai) sampai di-unfreeze juri.
    frozen:
      phase !== "before" && now >= freezeAt
        ? new Date(freezeAt).toISOString()
        : null,
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
  problems: ContestProblem[],
  startMs: number,
  now: number,
): TeamResult {
  let solved = 0;
  let totalTime = 0;
  const solvedAt = new Map<string, number>();

  const cells = problems.map((p): ScoreboardProblem => {
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
      time = Math.floor((acAt - startMs) / MIN);
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

  return { teamId, solved, totalTime, problems: cells, solvedAt };
}

export function buildScoreboard(now: number): Scoreboard {
  const state = getState();
  const problems = visibleProblems(now);
  const results = TEAMS.map((t) =>
    resultFor(t.id as string, state.submissions, problems, state.startMs, now),
  );

  // first-to-solve: AC paling awal per soal
  for (const p of problems) {
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

  return {
    event_id: String(state.nextId),
    time: new Date(now).toISOString(),
    contest_time: contestTime(now - state.startMs),
    state: buildContestState(now),
    rows,
  };
}
