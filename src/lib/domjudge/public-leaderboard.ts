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
  /** Epoch ms saat scoreboard ini benar-benar diambil dari DOMjudge (bukan saat permintaan datang). */
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
// sedang diambil ikut menunggu hasil yang sama (single-flight). TTL scoreboard dan contest dibuat pendek
// karena perubahan status (freeze, unfreeze, jadwal diubah juri) harus cepat terlihat di layar proyektor;
// bebannya tetap kecil (paling banyak ~0,5 panggilan per detik per proses). Soal dan tim jarang berubah.
//
// Jika DOMjudge gagal, data lama tetap dilayani paling lama STALE_GRACE_MS dihitung dari saat data itu
// DIAMBIL (bukan dari percobaan terakhir), dan percobaan berikutnya ditunda RETRY_AFTER_FAIL_MS agar
// DOMjudge tidak dibanjiri. Lewat batas itu pemanggil mendapat galat, sehingga layar menampilkan
// penanda koneksi terputus alih-alih data basi tanpa batas.

const TTL_CONTEST_MS = 5_000;
const TTL_BOARD_MS = 2_000;
const TTL_LIST_MS = 60_000;
const STALE_GRACE_MS = 60_000;
const RETRY_AFTER_FAIL_MS = 1_000;

interface Cached<T> {
  value: T;
  /** Epoch ms saat nilai ini diambil dari DOMjudge. */
  at: number;
}

interface Entry {
  at: number;
  value?: unknown;
  /** Setelah gagal: sampai kapan tidak mencoba lagi (data lama tetap dilayani). */
  retryAt?: number;
  inflight?: Promise<Cached<unknown>>;
}
const store = new Map<string, Entry>();

async function cached<T>(
  key: string,
  ttlMs: number,
  load: () => Promise<T>,
): Promise<Cached<T>> {
  const e = store.get(key);
  const now = Date.now();
  if (e?.value !== undefined) {
    if (now - e.at < ttlMs) return { value: e.value as T, at: e.at };
    // Baru saja gagal: layani data lama dulu, jangan langsung mencoba lagi.
    if (e.retryAt && now < e.retryAt && now - e.at < STALE_GRACE_MS)
      return { value: e.value as T, at: e.at };
  }
  if (e?.inflight) return e.inflight as Promise<Cached<T>>;

  const p = load().then(
    (value): Cached<T> => {
      const at = Date.now();
      store.set(key, { at, value });
      return { value, at };
    },
    (err): Cached<T> => {
      if (e?.value !== undefined && Date.now() - e.at < STALE_GRACE_MS) {
        store.set(key, {
          at: e.at,
          value: e.value,
          retryAt: Date.now() + RETRY_AFTER_FAIL_MS,
        });
        return { value: e.value as T, at: e.at };
      }
      store.delete(key);
      throw err;
    },
  );
  store.set(key, {
    at: e?.at ?? 0,
    value: e?.value,
    retryAt: e?.retryAt,
    inflight: p,
  });
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

/**
 * Data lengkap, memakai cache bersama per bagian. `updatedAt` adalah saat scoreboard terakhir benar-benar
 * diambil dari DOMjudge, jadi layar dapat menampilkan usia data yang sebenarnya.
 */
export async function getPublicLeaderboard(): Promise<PublicLeaderboard> {
  const contest = await cached("contest", TTL_CONTEST_MS, findContest);
  if (!contest.value)
    return { available: false, updatedAt: contest.at, problems: [], teams: [] };

  const cid = encodeURIComponent(String(contest.value.id));
  const [board, problems, teams] = await Promise.all([
    cached("scoreboard", TTL_BOARD_MS, () =>
      getJson<Scoreboard>(`/contests/${cid}/scoreboard`),
    ),
    cached("problems", TTL_LIST_MS, () =>
      getJson<Record<string, unknown>[]>(`/contests/${cid}/problems`),
    ),
    cached("teams", TTL_LIST_MS, () =>
      getJson<Team[]>(`/contests/${cid}/teams`),
    ),
  ]);
  if (!board.value)
    return { available: false, updatedAt: board.at, problems: [], teams: [] };

  // Hanya tim yang tampil di scoreboard publik, dan hanya id + nama.
  const onBoard = new Set(board.value.rows.map((r) => r.team_id));
  return {
    available: true,
    updatedAt: board.at,
    contest: {
      name: contest.value.formal_name || contest.value.name || "",
      start_time: contest.value.start_time,
      end_time: contest.value.end_time,
    },
    problems: (Array.isArray(problems.value) ? problems.value : []).map(
      (p) => ({
        id: p.id as string | undefined,
        label: p.label as string | undefined,
        ordinal: p.ordinal as number | undefined,
        rgb: p.rgb as string | null | undefined,
        color: p.color as string | null | undefined,
      }),
    ),
    teams: (Array.isArray(teams.value) ? teams.value : [])
      .filter((t) => t.id && onBoard.has(t.id))
      .map((t) => ({ id: t.id as string, name: t.display_name || t.name })),
    scoreboard: board.value,
  };
}
