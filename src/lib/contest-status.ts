import type { ScoreboardProblem } from "@/lib/domjudge/types";

/** Status satu soal bagi satu tim, dibaca dari sel scoreboard. */
export type CellStatus = "first" | "solved" | "pending" | "failed" | "none";

export function cellStatus(p?: ScoreboardProblem): CellStatus {
  if (!p) return "none";
  if (p.solved) return p.first_to_solve ? "first" : "solved";
  if (p.num_pending) return "pending";
  if (p.num_judged) return "failed";
  return "none";
}

/** Jumlah percobaan salah sebelum AC (num_judged ikut menghitung submission AC-nya). */
export function wrongBeforeSolve(p: ScoreboardProblem): number {
  return Math.max(0, (p.num_judged ?? 0) - 1);
}

/** Warna cadangan untuk titik warna soal bila DOMjudge tidak menyediakan `rgb`. */
export const PROBLEM_FALLBACK_COLORS = [
  "#ffffff",
  "#6b7280",
  "#ef4444",
  "#10b981",
  "#3b82f6",
  "#8b5cf6",
];
