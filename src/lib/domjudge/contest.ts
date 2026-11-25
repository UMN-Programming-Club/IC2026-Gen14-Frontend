import "server-only";
import { cache } from "react";
import { env } from "@/lib/env";
import { EVENT } from "@/lib/event";
import { djClient, djFetch, type Credentials } from "./client";
import type { Contest } from "./types";

export type { Contest };

export class ContestError extends Error {
  constructor(
    message: string,
    readonly kind: "not-found" | "unreachable",
  ) {
    super(message);
    this.name = "ContestError";
  }
}

/**
 * Pesan ContestError dibaca PESERTA (layar penuh dan jawaban API), jadi tanpa istilah teknis dan tanpa
 * ID contest. Petunjuk untuk panitia ditulis ke log server.
 */
const MSG_UNREACHABLE =
  "Server contest sedang tidak dapat dihubungi. Coba muat ulang beberapa saat lagi.";
const MSG_NOT_FOUND =
  "Belum ada contest yang aktif untuk tim kamu. Tunggu arahan panitia, lalu muat ulang halaman ini.";

async function getJson<T>(creds: Credentials, path: string): Promise<T | null> {
  let res: Response;
  try {
    res = await djFetch(creds, path);
  } catch {
    throw new ContestError(MSG_UNREACHABLE, "unreachable");
  }
  if (!res.ok) return null;
  const body = (await res.json().catch(() => null)) as T | null;
  return body && typeof body === "object" ? body : null;
}

/**
 * Contest yang sudah di-activate tetapi BELUM mulai disembunyikan DOMjudge dari akun tim:
 * `/contests` dan `/contests/{id}` tidak mengembalikannya, dan `/contests/{id}/state` hanya berisi
 * `null` (waktu mulai tidak dibocorkan). Hanya akun ber-role "API reader" yang boleh melihatnya.
 */
async function viaReader(id: string): Promise<Contest | null> {
  if (!env.READER) return null;
  return getJson<Contest>(env.READER, `/contests/${encodeURIComponent(id)}`);
}

/**
 * Tanpa akun pembaca, waktu mulai tidak bisa diketahui sebelum contest dimulai. `/state` tetap bisa
 * dipanggil tim, jadi dipakai untuk memastikan contest ada dan tim boleh mengaksesnya; datanya
 * disintesis dengan waktu kosong (UI: "Menunggu jadwal mulai"). `synthetic` memicu muat ulang saat mulai.
 */
async function synthesize(
  creds: Credentials,
  id: string,
): Promise<Contest | null> {
  const state = await getJson<unknown>(
    creds,
    `/contests/${encodeURIComponent(id)}/state`,
  );
  if (!state) return null;
  return {
    id,
    shortname: id,
    name: `${EVENT.name} ${EVENT.generation} ${EVENT.year}`,
    formal_name: `${EVENT.name} ${EVENT.generation} ${EVENT.year}`,
    start_time: null,
    end_time: null,
    duration: undefined,
    allow_submit: false,
    penalty_time: 20,
    scoreboard_type: "pass-fail",
    synthetic: true,
  } as Contest;
}

/**
 * Cari contest yang dikonfigurasi (DOMJUDGE_CONTEST_ID) berdasarkan `id` ATAU `shortname`.
 * Tidak pernah jatuh ke data palsu tentang soal atau skor: bila tidak ketemu, lempar ContestError.
 *
 * Urutan: (1) daftar `/contests` milik tim (berlaku setelah contest mulai); (2) akun pembaca opsional
 * (waktu mulai akurat sebelum mulai); (3) kerangka minimal dari `/state` (tanpa waktu mulai).
 */
export const resolveContest = cache(
  async (username: string, password: string): Promise<Contest> => {
    const creds: Credentials = { username, password };
    const wanted = env.DOMJUDGE_CONTEST_ID;

    let contests: Contest[] | undefined;
    try {
      const { data, error } = await djClient(creds).GET("/api/v4/contests", {
        params: { query: { onlyActive: false } },
      });
      if (error || !data) {
        console.warn("[contest] DOMjudge menolak permintaan daftar contest.");
        throw new ContestError(MSG_UNREACHABLE, "unreachable");
      }
      contests = data as Contest[];
    } catch (e) {
      if (e instanceof ContestError) throw e;
      throw new ContestError(MSG_UNREACHABLE, "unreachable");
    }

    const found =
      contests.find((c) => c.id === wanted || c.shortname === wanted) ??
      (await viaReader(wanted)) ??
      (await synthesize(creds, wanted));

    if (!found) {
      console.warn(
        `[contest] "${wanted}" tidak ditemukan. Pastikan contest sudah di-activate, publik, dapat diakses ` +
          "tim ini, dan DOMJUDGE_CONTEST_ID sama dengan External ID contest.",
      );
      throw new ContestError(MSG_NOT_FOUND, "not-found");
    }
    return found;
  },
);
