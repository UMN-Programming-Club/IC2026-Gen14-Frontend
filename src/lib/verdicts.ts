import type {
  Judgement,
  JudgementType,
  Submission,
} from "@/lib/domjudge/types";

export type VerdictKind = "accepted" | "wrong" | "pending";

export const VERDICT_TEXT: Record<string, string> = {
  AC: "Accepted",
  WA: "Wrong Answer",
  TLE: "Time Limit",
  RTE: "Runtime Error",
  MLE: "Memory Limit",
  CE: "Compile Error",
  OLE: "Output Limit",
  NO: "No Output",
};

export interface Verdict {
  kind: VerdictKind;
  text: string;
}

/** `typeId` null = belum selesai dinilai. */
export function describeVerdict(
  typeId: string | null | undefined,
  types?: JudgementType[],
): Verdict {
  if (!typeId) return { kind: "pending", text: "Pending" };
  const t = types?.find((x) => x.id === typeId);
  return {
    kind: (t?.solved ?? typeId === "AC") ? "accepted" : "wrong",
    text: VERDICT_TEXT[typeId] ?? t?.name ?? typeId,
  };
}

/** Verdict submission TERAKHIR tim per soal (key = problem id), mis. "Runtime Error". */
export function latestVerdictByProblem(
  submissions: Submission[] | undefined,
  judgements: Judgement[] | undefined,
  types: JudgementType[] | undefined,
): Map<string, Verdict> {
  const judgement = new Map(
    (judgements ?? []).map((j) => [j.submission_id, j]),
  );
  const newestFirst = [...(submissions ?? [])].sort(
    (a, b) => Date.parse(b.time ?? "") - Date.parse(a.time ?? ""),
  );
  const out = new Map<string, Verdict>();
  for (const s of newestFirst) {
    const pid = s.problem_id as string;
    if (out.has(pid)) continue;
    out.set(
      pid,
      describeVerdict(judgement.get(s.id as string)?.judgement_type_id, types),
    );
  }
  return out;
}
