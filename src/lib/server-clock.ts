// Jam DOMjudge di sisi browser. Tipe/fungsi murni, aman dipakai di client component.
//
// Pergantian fase (mulai, freeze, selesai) ditentukan oleh jam mesin DOMjudge, yang bisa berbeda
// beberapa detik dari jam perangkat peserta maupun dari mesin Next. Waktu DOMjudge hanya didapat dari
// header `Date` (resolusi 1 detik), jadi tiap sampel hanya menyatakan: "selisih jam ada di rentang [lo, hi]".
// Banyak sampel dengan fase detik berbeda mempersempit rentang itu (seperti irisan interval).

interface Sample {
  at: number;
  lo: number;
  hi: number;
}

const MAX_SAMPLES = 40;
const MAX_AGE_MS = 15 * 60_000;

let samples: Sample[] = [];
let offsetMs = 0;

function bounds(list: Sample[]): { lo: number; hi: number } {
  return {
    lo: Math.max(...list.map((s) => s.lo)),
    hi: Math.min(...list.map((s) => s.hi)),
  };
}

/**
 * Catat satu sampel. `ms` adalah waktu server (epoch ms) yang dilaporkan, benar pada rentang
 * [ms, ms + resolution). `sentAt` / `receivedAt` adalah jam perangkat saat permintaan dikirim / diterima.
 */
export function recordClockSample(
  sentAt: number,
  receivedAt: number,
  ms: number,
  resolution: number,
): void {
  const rtt = receivedAt - sentAt;
  if (!Number.isFinite(ms) || ms <= 0 || rtt < 0 || rtt > 3000) return;
  const mid = sentAt + rtt / 2;
  samples = samples.filter((s) => receivedAt - s.at < MAX_AGE_MS);
  samples.push({
    at: receivedAt,
    // Waktu server dibangkitkan di suatu titik dalam perjalanan: rentangnya dilebarkan rtt/2.
    lo: ms - mid - rtt / 2,
    hi: ms + resolution - mid + rtt / 2,
  });
  if (samples.length > MAX_SAMPLES) samples.shift();
  // Rentang saling bertentangan (jam berubah/melompat): buang sampel tertua sampai konsisten.
  while (samples.length > 1) {
    const b = bounds(samples);
    if (b.lo <= b.hi) break;
    samples.shift();
  }
  const b = bounds(samples);
  offsetMs = (b.lo + b.hi) / 2;
}

/** Waktu sekarang menurut jam DOMjudge (epoch ms). */
export function serverNow(): number {
  return Date.now() + offsetMs;
}

/** Lebar rentang ketidakpastian saat ini (ms); kecil = jam sudah tersinkron baik. */
export function clockUncertaintyMs(): number {
  if (samples.length === 0) return Infinity;
  const b = bounds(samples);
  return b.hi - b.lo;
}

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/**
 * Cari tepi pergantian detik jam DOMjudge dengan sampling rapat (maks ~1,5 detik): begitu nilai `Date`
 * berubah, rentang selisih jam menyempit menjadi selebar jeda sampling (~100 ms).
 */
export async function syncServerClock(signal?: AbortSignal): Promise<void> {
  let previous: number | null = null;
  for (let i = 0; i < 14; i++) {
    if (signal?.aborted) return;
    const sentAt = Date.now();
    let body: { ms?: number; resolution?: number } | null = null;
    try {
      const res = await fetch("/api/clock", { cache: "no-store", signal });
      if (!res.ok) return;
      body = await res.json();
    } catch {
      return;
    }
    const receivedAt = Date.now();
    if (!body || typeof body.ms !== "number") return;
    const resolution = body.resolution ?? 1;
    recordClockSample(sentAt, receivedAt, body.ms, resolution);
    // Resolusi 1 ms (mode mock): satu sampel sudah tepat.
    if (resolution <= 1) return;
    if (previous !== null && body.ms !== previous) return;
    previous = body.ms;
    await sleep(100);
  }
}
