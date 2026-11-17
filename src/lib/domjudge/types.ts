// Tipe saja (aman dipakai di client component). Sumber: schema.d.ts hasil `npm run gen:api`.
import type { components } from "./schema";

type S = components["schemas"];

export type Contest = S["Contest"];
export type ContestState = S["ContestState"];
export type ContestProblem = S["ContestProblem"];
export type Language = S["Language"];
export type JudgementType = S["JudgementType"];
export type Scoreboard = S["Scoreboard"];
export type ScoreboardRow = S["Row"];
export type ScoreboardProblem = S["Problem"];
export type Submission = S["Submission"];
export type Team = S["Team"];

/** Respons /judgements tidak punya skema di spesifikasi OpenAPI DOMjudge, jadi ditulis manual. */
export interface Judgement {
  id: string;
  submission_id: string;
  /** null = masih diproses */
  judgement_type_id: string | null;
  start_time?: string;
  end_time?: string | null;
  max_run_time?: number | null;
}
