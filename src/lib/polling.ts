import type { Scoreboard } from "@/lib/domjudge/types";
import { boardHasPending, isFrozen } from "@/lib/my-outcomes";

/**
 * Interval polling (ms). DOMjudge menjawab dalam puluhan ms, tetapi tiap request melewati BFF Next.js,
 * jadi interval cepat hanya dipakai selama memang ada yang ditunggu.
 */
export const POLL_SUBMISSIONS = 5_000;
/** Selama ada submission tim sendiri yang belum ada hasilnya. */
export const POLL_SUBMISSIONS_WAITING = 2_000;
export const POLL_BOARD = 15_000;
/** Selama ada tim yang pending di leaderboard (dan leaderboard tidak beku). */
export const POLL_BOARD_WAITING = 5_000;

/**
 * Saat beku, isi scoreboard memang tidak berubah sampai di-unfreeze, jadi tidak perlu dipercepat
 * meskipun semua tim tampil pending.
 */
export function boardInterval(board: Scoreboard | undefined): number {
  return !isFrozen(board) && boardHasPending(board)
    ? POLL_BOARD_WAITING
    : POLL_BOARD;
}
