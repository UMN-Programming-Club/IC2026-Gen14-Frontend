import type {
  ContestProblem,
  Judgement,
  JudgementType,
  Scoreboard,
  Submission,
} from "@/lib/domjudge/types";

export type Phase = "before" | "running" | "ended";
export type ChipStatus = "solved" | "wrong" | "pending" | "none";
import { VERDICT_TEXT, type VerdictKind } from "@/lib/verdicts";

export type { VerdictKind };

export interface ProblemChip {
  label: string;
  status: ChipStatus;
}

export interface SubmissionRow {
  id: string;
  time: string;
  problem: string;
  kind: VerdictKind;
  text: string;
}

export interface HomeStats {
  rank: number | null;
  solved: number;
  penalty: number;
  submissionCount: number;
}

/** "5:00:00.000" -> "5 jam"; "2:30:00.000" -> "2 jam 30 menit". */
export function formatDurationLabel(
  duration?: string | null,
  startMs?: number,
  endMs?: number,
) {
  let totalMin: number | null = null;
  const m = duration?.match(/^(\d+):(\d+):(\d+)/);
  if (m) totalMin = Number(m[1]) * 60 + Number(m[2]);
  else if (startMs && endMs && endMs > startMs)
    totalMin = Math.round((endMs - startMs) / 60_000);
  if (totalMin === null) return "-";
  const h = Math.floor(totalMin / 60);
  const min = totalMin % 60;
  if (h && min) return `${h} jam ${min} menit`;
  if (h) return `${h} jam`;
  return `${min} menit`;
}

export function chipLabel(p: ContestProblem, index: number) {
  return /^IC\d+$/i.test(p.label ?? "")
    ? (p.label as string).toUpperCase()
    : `IC${index + 1}`;
}

/** "2:14:10.000" -> "02:14:10". */
export function formatContestTime(t?: string | null) {
  if (!t) return "--:--:--";
  const [h = "0", m = "00", s = "00"] = t.split(".")[0].split(":");
  return `${h.padStart(2, "0")}:${m}:${s}`;
}

export function buildChips(
  problems: ContestProblem[] | undefined,
  board: Scoreboard | undefined,
  teamId: string,
): ProblemChip[] {
  const row = board?.rows.find((r) => r.team_id === teamId);
  const list: { id: string; label: string }[] = problems?.length
    ? problems.map((p, i) => ({ id: p.id as string, label: chipLabel(p, i) }))
    : (row?.problems ?? []).map((p, i) => ({
        id: p.problem_id as string,
        label: `IC${i + 1}`,
      }));
  return list.map((p) => {
    const cell = row?.problems?.find((x) => x.problem_id === p.id);
    let status: ChipStatus = "none";
    if (cell?.solved) status = "solved";
    else if ((cell?.num_pending ?? 0) > 0) status = "pending";
    else if ((cell?.num_judged ?? 0) > 0) status = "wrong";
    return { label: p.label, status };
  });
}

export function buildRows(
  submissions: Submission[] | undefined,
  judgements: Judgement[] | undefined,
  types: JudgementType[] | undefined,
  problems: ContestProblem[] | undefined,
): SubmissionRow[] {
  const jBySub = new Map((judgements ?? []).map((j) => [j.submission_id, j]));
  const typeById = new Map((types ?? []).map((t) => [t.id, t]));
  const labelByProblem = new Map(
    (problems ?? []).map((p, i) => [p.id as string, chipLabel(p, i)]),
  );
  return [...(submissions ?? [])]
    .sort((a, b) => Date.parse(b.time ?? "") - Date.parse(a.time ?? ""))
    .map((s) => {
      const j = jBySub.get(s.id as string);
      const typeId = j?.judgement_type_id ?? null;
      let kind: VerdictKind = "pending";
      let text = "Pending";
      if (typeId) {
        const t = typeById.get(typeId);
        kind = (t?.solved ?? typeId === "AC") ? "accepted" : "wrong";
        text = VERDICT_TEXT[typeId] ?? t?.name ?? typeId;
      }
      return {
        id: `#${String(s.id).padStart(3, "0")}`,
        time: formatContestTime(s.contest_time),
        problem: labelByProblem.get(s.problem_id as string) ?? "-",
        kind,
        text,
      };
    });
}

/* ---------------------------------------------------------------------------------------------
 * PREVIEW (hanya development, tidak di-commit): `/?preview=before|running-empty|running|ended`
 * mengganti data Home di sisi UI supaya 4 state bisa diperiksa tanpa mengubah src/lib/**.
 * -------------------------------------------------------------------------------------------- */
export type PreviewKey = "before" | "running-empty" | "running" | "ended";

export interface HomeModel {
  phase: Phase;
  teamName: string;
  /** Epoch ms yang dihitung mundur: awal contest (before) atau akhir contest (running). */
  targetMs: number | null;
  startLabel: string;
  durationLabel: string;
  problemCount: number | null;
  stats: HomeStats;
  chips: ProblemChip[];
  rows: SubmissionRow[];
}

const CHIPS = (s: ChipStatus[]): ProblemChip[] =>
  s.map((status, i) => ({ label: `IC${i + 1}`, status }));

export function previewModel(key: PreviewKey, now: number): HomeModel {
  const base = {
    teamName: "Tim Alpha",
    startLabel: "28 NOV 2026",
    durationLabel: "3 jam",
    problemCount: 6,
  };
  switch (key) {
    case "before":
      return {
        ...base,
        phase: "before",
        targetMs: now + ((8 * 24 + 14) * 3600 + 37 * 60 + 8) * 1000,
        stats: { rank: null, solved: 0, penalty: 0, submissionCount: 0 },
        chips: CHIPS(["none", "none", "none", "none", "none", "none"]),
        rows: [],
      };
    case "running-empty":
      return {
        ...base,
        phase: "running",
        targetMs: now + (4 * 3600 + 39 * 60 + 1) * 1000,
        stats: { rank: null, solved: 0, penalty: 0, submissionCount: 0 },
        chips: CHIPS(["none", "none", "none", "none", "none", "none"]),
        rows: [],
      };
    case "running":
      return {
        ...base,
        phase: "running",
        targetMs: now + (46 * 60 + 12) * 1000,
        stats: { rank: 3, solved: 2, penalty: 145, submissionCount: 5 },
        chips: CHIPS(["solved", "solved", "wrong", "pending", "none", "none"]),
        rows: [
          {
            id: "#128",
            time: "02:14:10",
            problem: "IC4",
            kind: "pending",
            text: "Pending",
          },
          {
            id: "#117",
            time: "01:42:10",
            problem: "IC3",
            kind: "wrong",
            text: "Wrong Answer",
          },
          {
            id: "#102",
            time: "01:20:05",
            problem: "IC2",
            kind: "accepted",
            text: "Accepted",
          },
          {
            id: "#090",
            time: "00:35:51",
            problem: "IC1",
            kind: "accepted",
            text: "Accepted",
          },
        ],
      };
    case "ended":
      return {
        ...base,
        phase: "ended",
        targetMs: null,
        stats: { rank: 3, solved: 4, penalty: 312, submissionCount: 9 },
        chips: CHIPS(["solved", "solved", "solved", "solved", "wrong", "none"]),
        rows: [],
      };
  }
}
