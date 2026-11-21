import "server-only";
import { env } from "@/lib/env";
import { djPublicFetch } from "./client";
import type { Contest, Scoreboard, Team } from "./types";

/**
 * Data untuk halaman leaderboard TERBUKA (tanpa login). Semuanya dibaca anonim dari DOMjudge,
 * jadi isinya persis yang DOMjudge anggap publik: scoreboard publik (ikut beku saat freeze) dan tim
 * dari kategori yang terlihat. Tidak ada kredensial yang terlibat.
 *
 * Hanya field yang dibutuhkan yang diteruskan (daftar soal tanpa judul, batas waktu, atau statement).
 */
export interface PublicLeaderboard {
  /** false = contest belum bisa dilihat publik (belum di-activate, atau belum dimulai). */
  available: boolean;
  /** Epoch ms saat data ini diambil dari DOMjudge (sama untuk semua pengunjung selama masih di-cache). */
  updatedAt: number;
  contest?: {
    name: string;
    start_time?: string | null;
    end_time?: string | null;
  };
  problems: {
    id?: string;
    label?: string;
    ordinal?: number;
    rgb?: string | null;
    color?: string | null;
  }[];
  teams: { id: string; name: string }[];
  scoreboard?: Scoreboard;
}

// ---------- Cache bersama (per proses) ----------
//
// Berapa pun pengunjungnya, DOMjudge hanya dipanggil sekali per TTL: permintaan yang datang saat data
// sedang diambil ikut menunggu hasil yang sama (single-flight). Jika DOMjudge gagal, data lama tetap
// dilayani sampai 12x TTL, dan percobaan berikutnya ditunda 1 detik agar DOMjudge tidak dibanjiri.

interface Entry {
  at: number;
  value?: unknown;
  inflight?: Promise<unknown>;
}
const store = new Map<string, Entry>();

async function cached<T>(
  key: string,
  ttlMs: number,
  load: () => Promise<T>,
): Promise<T> {
  const e = store.get(key);
  const now = Date.now();
  if (e?.value !== undefined && now - e.at < ttlMs) return e.value as T;
  if (e?.inflight) return e.inflight as Promise<T>;

  const p = load().then(
    (value) => {
      store.set(key, { at: Date.now(), value });
      return value;
    },
    (err) => {
      if (e?.value !== undefined && now - e.at < ttlMs * 12) {
        store.set(key, { at: Date.now() - ttlMs + 1_000, value: e.value });
        return e.value as T;
      }
      store.delete(key);
      throw err;
    },
  );
  store.set(key, { at: e?.at ?? 0, value: e?.value, inflight: p });
  return p;
}

async function getJson<T>(path: string): Promise<T | null> {
  const res = await djPublicFetch(path);
  if (!res.ok) return null;
  return (await res.json().catch(() => null)) as T | null;
}

/** Contest yang dikonfigurasi (id ATAU shortname) di antara contest yang terlihat publik. */
async function findContest(): Promise<Contest | null> {
  const list = await getJson<Contest[]>("/contests");
  if (!Array.isArray(list)) return null;
  const wanted = env.DOMJUDGE_CONTEST_ID;
  return list.find((c) => c.id === wanted || c.shortname === wanted) ?? null;
}

async function load(): Promise<PublicLeaderboard> {
  const contest = await cached("contest", 15_000, findContest);
  const updatedAt = Date.now();
  if (!contest) return { available: false, updatedAt, problems: [], teams: [] };

  const cid = encodeURIComponent(String(contest.id));
  const [board, problems, teams] = await Promise.all([
    cached("scoreboard", 5_000, () =>
      getJson<Scoreboard>(`/contests/${cid}/scoreboard`),
    ),
    cached("problems", 60_000, () =>
      getJson<Record<string, unknown>[]>(`/contests/${cid}/problems`),
    ),
    cached("teams", 60_000, () => getJson<Team[]>(`/contests/${cid}/teams`)),
  ]);
  if (!board) return { available: false, updatedAt, problems: [], teams: [] };

  // Hanya tim yang tampil di scoreboard publik, dan hanya id + nama.
  const onBoard = new Set(board.rows.map((r) => r.team_id));
  return {
    available: true,
    updatedAt,
    contest: {
      name: contest.formal_name || contest.name || "",
      start_time: contest.start_time,
      end_time: contest.end_time,
    },
    problems: (Array.isArray(problems) ? problems : []).map((p) => ({
      id: p.id as string | undefined,
      label: p.label as string | undefined,
      ordinal: p.ordinal as number | undefined,
      rgb: p.rgb as string | null | undefined,
      color: p.color as string | null | undefined,
    })),
    teams: (Array.isArray(teams) ? teams : [])
      .filter((t) => t.id && onBoard.has(t.id))
      .map((t) => ({ id: t.id as string, name: t.display_name || t.name })),
    scoreboard: board,
  };
}

/** Data lengkap, memakai cache bersama. `updatedAt` mengikuti pengambilan scoreboard terakhir. */
export async function getPublicLeaderboard(): Promise<PublicLeaderboard> {
  return cached("page", 5_000, load);
}
