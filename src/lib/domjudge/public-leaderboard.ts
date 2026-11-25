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
  /**
   * "inactive": tidak ada contest yang bisa dilihat publik (belum di-activate, tidak publik, atau sudah
   * dinonaktifkan). "upcoming": contest aktif tetapi belum mulai. "open": klasemen tersedia (berlangsung
   * atau sudah selesai).
   */
  status: "inactive" | "upcoming" | "open";
  /** Epoch ms saat data ini benar-benar diambil dari DOMjudge (bukan saat permintaan datang). */
  updatedAt: number;
  /** Hanya untuk "upcoming": waktu mulai (ISO), atau null bila belum ditetapkan panitia. */
  startsAt?: string | null;
  /** Hanya untuk "open", beserta `scoreboard`. */
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
// karena perubahan status (mulai, freeze, unfreeze, jadwal diubah juri) harus cepat terlihat di layar
// proyektor; bebannya tetap kecil (paling banyak ~1 panggilan per detik per proses). Soal dan tim jarang
// berubah.
//
// Jika DOMjudge gagal, data lama tetap dilayani paling lama STALE_GRACE_MS dihitung dari saat data itu
// DIAMBIL (bukan dari percobaan terakhir), dan percobaan berikutnya ditunda RETRY_AFTER_FAIL_MS agar
// DOMjudge tidak dibanjiri. Lewat batas itu pemanggil mendapat galat, sehingga layar menampilkan
// penanda koneksi terputus alih-alih data basi tanpa batas.

const TTL_CONTEST_MS = 2_000;
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

/** Gagal (termasuk ditolak gerbang) selalu melempar, supaya tidak disangka "belum ada contest". */
async function getJson<T>(path: string): Promise<T> {
  const res = await djPublicFetch(path);
  if (!res.ok) throw new Error(`DOMjudge menjawab ${res.status} untuk ${path}`);
  return (await res.json()) as T;
}

/** Contest yang dikonfigurasi (id ATAU shortname) di antara contest yang terlihat publik. */
async function findContest(): Promise<Contest | null> {
  const list = await getJson<Contest[]>("/contests");
  if (!Array.isArray(list))
    throw new Error("Daftar contest dari DOMjudge tidak dikenali.");
  const wanted = env.DOMJUDGE_CONTEST_ID;
  return list.find((c) => c.id === wanted || c.shortname === wanted) ?? null;
}

/** "-8:00:12.500" -> -28812500. `null` bila formatnya tidak dikenali. */
function relTimeMs(value: string | null | undefined): number | null {
  const m = /^(-)?(\d+):(\d{2}):(\d{2}(?:\.\d+)?)$/.exec(value ?? "");
  if (!m) return null;
  const ms = (Number(m[2]) * 3600 + Number(m[3]) * 60 + Number(m[4])) * 1000;
  return m[1] ? -ms : ms;
}

/**
 * Contest yang BELUM mulai tidak ada di `/contests` (juga tidak di `/contests/{id}`), tetapi
 * `/contests/{id}/scoreboard` sudah bisa dibaca anonim bila contest aktif dan publik. Barisnya kosong,
 * namun ada `time` (waktu kejadian terakhir di DOMjudge) dan `contest_time` (= `time` - waktu mulai),
 * sehingga waktu mulai = `time` - `contest_time`. Tidak perlu akun "API reader".
 *
 * `null` = tidak ada contest aktif dengan ID itu (404/403). Di sini DOMJUDGE_CONTEST_ID harus External
 * ID, karena shortname tidak bisa dicocokkan sebelum contest muncul di daftar.
 */
async function findUpcoming(): Promise<{ startsAt: string | null } | null> {
  const cid = encodeURIComponent(env.DOMJUDGE_CONTEST_ID);
  const path = `/contests/${cid}/scoreboard`;
  const res = await djPublicFetch(path);
  if (res.status === 404 || res.status === 403) return null;
  if (!res.ok) throw new Error(`DOMjudge menjawab ${res.status} untuk ${path}`);
  const board = (await res.json()) as Scoreboard;

  const at = Date.parse(board.time ?? "");
  const since = relTimeMs(board.contest_time);
  // Dibulatkan ke detik: DOMjudge membulatkan kedua angka itu ke milidetik secara terpisah.
  const start =
    Number.isFinite(at) && since !== null
      ? Math.round((at - since) / 1000) * 1000
      : NaN;
  // Start time yang dimatikan juri ("delay") dihitung DOMjudge dari 0, hasilnya tahun 1970.
  return {
    startsAt: start > Date.UTC(2000, 0) ? new Date(start).toISOString() : null,
  };
}

/**
 * Data lengkap, memakai cache bersama per bagian. `updatedAt` adalah saat scoreboard terakhir benar-benar
 * diambil dari DOMjudge, jadi layar dapat menampilkan usia data yang sebenarnya.
 */
export async function getPublicLeaderboard(): Promise<PublicLeaderboard> {
  const contest = await cached("contest", TTL_CONTEST_MS, findContest);
  // Tidak ada di daftar, atau tanpa start_time (start dimatikan juri setelah waktunya lewat).
  if (!contest.value?.start_time) {
    const next = await cached("upcoming", TTL_CONTEST_MS, findUpcoming);
    const empty = { updatedAt: next.at, problems: [], teams: [] };
    return next.value
      ? { ...empty, status: "upcoming", startsAt: next.value.startsAt }
      : { ...empty, status: "inactive" };
  }

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
  // Hanya tim yang tampil di scoreboard publik, dan hanya id + nama.
  const onBoard = new Set(board.value.rows.map((r) => r.team_id));
  return {
    status: "open",
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
