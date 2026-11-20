// Tipe saja (aman dipakai di client component). Sumber: schema.d.ts hasil `npm run gen:api`.
import type { components } from "./schema";

type S = components["schemas"];

/** Schema menandai start/end sebagai opsional saja; DOMjudge mengirim `null` bila start time belum diisi. */
export type Contest = Omit<S["Contest"], "start_time" | "end_time"> & {
  start_time?: string | null;
  end_time?: string | null;
  /** true = kerangka minimal (waktu mulai tidak diketahui), bukan data lengkap dari DOMjudge. */
  synthetic?: boolean;
};
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
