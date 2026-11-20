import "server-only";
import { djFetch, type Credentials } from "./client";

export type ServerPhase = "before" | "running" | "ended";

/**
 * Fase contest menurut DOMjudge (`/state`), dibaca di server. Dipakai untuk menegakkan aturan yang tidak
 * boleh bergantung pada UI: DOMjudge sendiri hanya menolak submission SEBELUM contest mulai. Setelah
 * selesai, submission tetap diterima ("stored but not processed") dan statement soal tetap bisa diunduh.
 *
 * null = tidak bisa ditentukan (DOMjudge menolak/tidak terjangkau); pemanggil harus menolak (fail closed).
 */
export async function fetchServerPhase(
  creds: Credentials,
  contestId: string,
): Promise<ServerPhase | null> {
  try {
    const res = await djFetch(
      creds,
      `/contests/${encodeURIComponent(contestId)}/state`,
    );
    if (!res.ok) return null;
    const s = (await res.json().catch(() => null)) as {
      started?: string | null;
      ended?: string | null;
    } | null;
    if (!s || typeof s !== "object") return null;
    return s.ended ? "ended" : s.started ? "running" : "before";
  } catch {
    return null;
  }
}

export const PHASE_MESSAGE: Record<Exclude<ServerPhase, "running">, string> = {
  before: "Contest belum dimulai.",
  ended: "Contest sudah selesai. Soal tidak lagi dapat dilihat.",
};
