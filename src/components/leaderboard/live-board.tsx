"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { useQuery } from "@tanstack/react-query";
import { Compass, WifiOff } from "lucide-react";
import {
  Cell,
  FIXED_AC,
  FIXED_BLOCK,
  FIXED_NAME,
  FIXED_PENALTY,
  FIXED_SHADOW,
  FIXED_WIDTH,
  LIVE_VARS,
  FrozenBanner,
  Legend,
  MoveIndicator,
  RankBadge,
  elapsedLabel,
  useFlipRows,
  useRankMoves,
} from "@/components/leaderboard/live-parts";
import { PROBLEM_FALLBACK_COLORS } from "@/lib/contest-status";
import type { PublicLeaderboard } from "@/lib/domjudge/public-leaderboard";
import { formatClock } from "@/lib/format";
import { cn } from "@/lib/utils";

/** Cache server dan CDN untuk rute ini 2 detik, jadi polling 3 detik selalu mendapat data yang baru. */
const POLL_LIVE = 3_000;

async function fetchLeaderboard(
  signal: AbortSignal,
): Promise<PublicLeaderboard> {
  const res = await fetch("/api/public/leaderboard", {
    signal,
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Leaderboard belum dapat dimuat.");
  return res.json();
}

function subscribeTick(onTick: () => void) {
  const id = setInterval(onTick, 1_000);
  return () => clearInterval(id);
}
/** Dibulatkan ke detik: nilai snapshot harus sama di antara dua pembacaan dalam detik yang sama. */
const nowSnapshot = () => Math.floor(Date.now() / 1_000) * 1_000;
const serverNowSnapshot = () => null;

/**
 * Jam browser yang berdetak tiap detik. `null` selama prerender dan hydration (Next melarang
 * `Date.now()` saat prerender); data contest baru tiba di browser, jadi tidak ada yang menunggunya.
 */
function useNowMs(): number | null {
  return useSyncExternalStore<number | null>(
    subscribeTick,
    nowSnapshot,
    serverNowSnapshot,
  );
}

type Phase = "before" | "running" | "ended" | "unknown";

/** Chip status "Selesai" yang sama dengan bilah atas peserta (`Topbar`). */
function EndedChip() {
  return (
    <span className="border-maroon-700/80 bg-maroon-700/25 text-wa inline-flex shrink-0 items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-bold tracking-[0.12em] uppercase">
      <span className="bg-wa size-2 rounded-full" />
      Selesai
    </span>
  );
}

function Clock({
  phase,
  startMs,
  endMs,
  now,
}: {
  phase: Phase;
  startMs: number;
  endMs: number;
  now: number | null;
}) {
  if (now === null || phase === "unknown") return null;

  // Sama seperti peserta: setelah selesai, chip "Selesai" + label "Status" + 00:00:00 berwarna merah.
  if (phase === "ended") {
    return (
      <div className="ml-auto flex items-center gap-4">
        <EndedChip />
        <div className="text-right">
          <p className="eyebrow">Status</p>
          <p className="text-wa mt-1 font-mono text-3xl font-bold tabular-nums sm:text-4xl">
            00:00:00
          </p>
        </div>
      </div>
    );
  }

  const label = phase === "before" ? "Mulai dalam" : "Sisa waktu";
  const value = formatClock((phase === "before" ? startMs : endMs) - now);
  return (
    <div className="ml-auto text-right">
      <p className="eyebrow">{label}</p>
      <p
        className={cn(
          "mt-1 font-mono text-3xl font-bold tabular-nums sm:text-4xl",
          phase === "running" ? "text-aqua-400" : "text-foam-50",
        )}
      >
        {value}
      </p>
    </div>
  );
}

function Notice({ title, text }: { title: string; text: string }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-16 text-center">
      <Compass className="size-10 text-mist-400" aria-hidden="true" />
      <p className="mt-4 text-xl font-bold sm:text-2xl">{title}</p>
      {text && <p className="mt-2 text-base text-mist-400">{text}</p>}
    </div>
  );
}

/**
 * Leaderboard terbuka untuk proyektor (`/live`): tanpa login, tanpa sidebar. Datanya dari
 * `/api/public/leaderboard`, yang sudah ikut aturan freeze DOMjudge (sel setelah pembekuan = pending).
 *
 * Halaman pas satu layar dan tidak di-scroll; tabelnya yang di-scroll sendiri bila tim atau soal tidak
 * muat (atas-bawah untuk tim, ke samping untuk soal), dengan blok kiri dan header yang tetap terlihat.
 */
export function LiveBoard() {
  const now = useNowMs();
  const q = useQuery({
    queryKey: ["public-leaderboard"],
    queryFn: ({ signal }) => fetchLeaderboard(signal),
    refetchInterval: POLL_LIVE,
    // Layar proyektor sering tertutup jendela lain; tetap perbarui.
    refetchIntervalInBackground: true,
  });
  // Saat gagal ambil, react-query tetap menyimpan data terakhir: tampil terus, dengan penanda.
  const data = q.data;
  const board = data?.scoreboard;
  const rows = board?.rows;

  const teamName = useMemo(
    () => new Map((data?.teams ?? []).map((t) => [t.id, t.name])),
    [data?.teams],
  );
  const moves = useRankMoves(rows);
  const listRef = useFlipRows(rows);

  // Penanda scroll: bayangan di tepi header/blok tetap saat sudah di-scroll, dan efek memudar di
  // kanan/bawah bila masih ada soal/tim yang belum terlihat.
  const scrollRef = useRef<HTMLDivElement>(null);
  const [scroll, setScroll] = useState({
    left: false,
    right: false,
    top: false,
    down: false,
  });
  function updateScroll() {
    const el = scrollRef.current;
    if (!el) return;
    const next = {
      left: el.scrollLeft > 1,
      right: el.scrollLeft + el.clientWidth < el.scrollWidth - 1,
      top: el.scrollTop > 1,
      down: el.scrollTop + el.clientHeight < el.scrollHeight - 1,
    };
    setScroll((s) =>
      s.left === next.left &&
      s.right === next.right &&
      s.top === next.top &&
      s.down === next.down
        ? s
        : next,
    );
  }
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    updateScroll();
    const ro = new ResizeObserver(updateScroll);
    ro.observe(el);
    if (el.firstElementChild) ro.observe(el.firstElementChild);
    return () => ro.disconnect();
  });

  const startMs = data?.contest?.start_time
    ? Date.parse(data.contest.start_time)
    : NaN;
  const endMs = data?.contest?.end_time
    ? Date.parse(data.contest.end_time)
    : NaN;
  const phase: Phase =
    now === null || !Number.isFinite(startMs) || !Number.isFinite(endMs)
      ? "unknown"
      : now < startMs
        ? "before"
        : now >= endMs
          ? "ended"
          : "running";

  const frozen = !!board?.state?.frozen && !board.state.thawed;
  const frozenAtMs = board?.state?.frozen
    ? Date.parse(board.state.frozen)
    : NaN;
  const frozenAtLabel =
    Number.isFinite(frozenAtMs) && Number.isFinite(startMs)
      ? elapsedLabel(frozenAtMs - startMs)
      : null;

  const cols = data?.problems ?? [];
  // Blok kiri (rank, tim, AC, penalti) selebar tetap dan selalu terlihat; kolom soal di kanannya.
  const grid = `${FIXED_WIDTH} repeat(${Math.max(cols.length, 1)}, minmax(5rem,1fr))`;
  const showBoard =
    !!data && data.available && phase !== "before" && !!rows && rows.length > 0;

  let notice: { title: string; text: string } | null = null;
  if (!data) {
    notice = q.isError
      ? {
          title: "Leaderboard belum dapat dimuat",
          text: "Mencoba lagi otomatis...",
        }
      : { title: "Memuat leaderboard...", text: "" };
  } else if (!data.available || phase === "before") {
    notice = {
      title: "Leaderboard belum dibuka",
      text: "Klasemen muncul begitu contest dimulai.",
    };
  } else if (!rows || rows.length === 0) {
    notice = { title: "Belum ada tim di leaderboard", text: "" };
  }

  const stale = q.isError && !!data;

  // Hitung mundur ke pengambilan data berikutnya. Timer react-query dihitung ulang tiap pengambilan
  // selesai (berhasil atau gagal), jadi patokannya adalah yang paling akhir di antara keduanya.
  const lastTryMs = Math.max(q.dataUpdatedAt, q.errorUpdatedAt);
  const refreshIn =
    now === null || lastTryMs === 0
      ? null
      : Math.min(
          POLL_LIVE / 1_000,
          Math.max(0, Math.ceil((lastTryMs + POLL_LIVE - now) / 1_000)),
        );

  return (
    <main className="bg-arena min-h-0 flex-1 overflow-y-auto">
      {/* h-full + flex: halaman pas satu layar; sisa tinggi untuk tabel, yang di-scroll di dalamnya. */}
      <div className="mx-auto flex h-full w-full max-w-[96rem] flex-col gap-3 px-4 py-3 sm:px-8 sm:py-4">
        <header className="flex flex-wrap items-end justify-between gap-x-10 gap-y-2">
          <div className="min-w-0">
            <p className="eyebrow">UMNPC Internal Contest</p>
            <h1 className="title-display mt-1 text-3xl sm:text-4xl">
              {data?.contest?.name || "Leaderboard"}
            </h1>
          </div>
          <Clock phase={phase} startMs={startMs} endMs={endMs} now={now} />
        </header>

        {frozen && phase !== "before" && (
          <FrozenBanner atLabel={frozenAtLabel} ended={phase === "ended"} />
        )}

        <section
          className={cn(
            "bg-panel relative flex min-h-40 flex-1 flex-col overflow-hidden rounded-2xl border",
            frozen && phase !== "before"
              ? "border-ice-400/40 shadow-[0_0_0_1px_rgba(127,208,242,0.08),0_0_32px_-12px_rgba(127,208,242,0.35)]"
              : "border-line",
          )}
        >
          {notice && <Notice title={notice.title} text={notice.text} />}
          {showBoard && rows && (
            <>
              <div
                ref={scrollRef}
                onScroll={updateScroll}
                className="min-h-0 flex-1 [scrollbar-width:thin] overflow-auto"
              >
                <div
                  className={cn(
                    "flex min-h-full w-max min-w-full flex-col pr-4 pb-4",
                    LIVE_VARS,
                  )}
                >
                  {/* Header kolom tetap di atas saat daftar tim di-scroll */}
                  <div
                    className={cn(
                      "bg-panel sticky top-0 z-30 grid shrink-0 items-end gap-x-3 pt-4 pb-3 transition-shadow",
                      scroll.top && "shadow-[0_12px_14px_-12px_rgb(0_0_0/0.8)]",
                    )}
                    style={{ gridTemplateColumns: grid }}
                  >
                    <div
                      className={cn(
                        FIXED_BLOCK,
                        "bg-panel -my-1 content-end items-end self-stretch py-1",
                        scroll.left && FIXED_SHADOW,
                      )}
                    >
                      <span className="eyebrow">RANK</span>
                      <span className="eyebrow">Tim</span>
                      <span className="eyebrow text-center">AC</span>
                      <span className="eyebrow text-center">Penalti</span>
                    </div>
                    {cols.map((c, i) => (
                      <div
                        key={c.id}
                        className="flex flex-col items-center gap-2"
                      >
                        <span className="font-mono text-sm font-bold tracking-wider">
                          {c.label}
                        </span>
                        <span
                          aria-hidden="true"
                          className="size-2.5 rounded-full ring-1 ring-white/10"
                          style={{
                            backgroundColor:
                              c.rgb ??
                              PROBLEM_FALLBACK_COLORS[
                                i % PROBLEM_FALLBACK_COLORS.length
                              ],
                          }}
                        />
                      </div>
                    ))}
                  </div>

                  {/* Baris meregang membagi tinggi yang tersisa; tidak lebih pendek dari min-h. */}
                  <ol ref={listRef} className="flex flex-1 flex-col gap-1.5">
                    {rows.map((row) => {
                      const move = moves[row.team_id ?? ""];
                      const name =
                        teamName.get(row.team_id ?? "") ?? row.team_id;
                      return (
                        <li
                          key={row.team_id}
                          data-team={row.team_id}
                          // overflow-clip, bukan overflow-hidden: hidden membuat sticky di dalamnya tidak bekerja.
                          className="relative grid min-h-14 flex-1 items-center gap-x-3 overflow-clip rounded-xl py-1"
                          style={{ gridTemplateColumns: grid }}
                        >
                          {move && (
                            <span
                              key={move.n}
                              aria-hidden="true"
                              className={cn(
                                "pointer-events-none absolute inset-0 z-20",
                                move.dir === "up" ? "flash-up" : "flash-down",
                              )}
                            />
                          )}
                          <div
                            className={cn(
                              FIXED_BLOCK,
                              // -my-1: menutup padding baris juga, supaya sel lain (mis. animasi pending) tidak tembus.
                              "bg-panel -my-1 self-stretch",
                              scroll.left && FIXED_SHADOW,
                            )}
                          >
                            <span className="flex items-center gap-1">
                              <RankBadge rank={row.rank ?? 0} />
                              <MoveIndicator move={move} />
                            </span>
                            <span
                              className={cn("min-w-0 truncate", FIXED_NAME)}
                              title={name}
                            >
                              {name}
                            </span>
                            <span className={FIXED_AC}>
                              {row.score?.num_solved ?? 0}
                            </span>
                            <span className={FIXED_PENALTY}>
                              {`${row.score?.total_time ?? 0}'`}
                            </span>
                          </div>
                          {cols.map((c) => (
                            <Cell
                              key={c.id}
                              p={row.problems?.find(
                                (p) => p.problem_id === c.id,
                              )}
                            />
                          ))}
                        </li>
                      );
                    })}
                  </ol>
                </div>
              </div>

              {/* Penanda masih ada soal di kanan / tim di bawah */}
              {scroll.right && (
                <div
                  aria-hidden="true"
                  className="from-panel pointer-events-none absolute inset-y-0 right-0 z-40 w-16 bg-gradient-to-l to-transparent"
                />
              )}
              {scroll.down && (
                <div
                  aria-hidden="true"
                  className="from-panel pointer-events-none absolute inset-x-0 bottom-0 z-40 h-12 bg-gradient-to-t to-transparent"
                />
              )}
            </>
          )}
        </section>

        <footer className="flex shrink-0 flex-wrap items-center justify-between gap-x-6 gap-y-2 text-sm text-mist-400">
          <Legend />
          <div className="flex items-center gap-4">
            {stale && (
              <span
                role="alert"
                className="text-wa inline-flex items-center gap-1.5 font-semibold"
              >
                <WifiOff className="size-4" aria-hidden="true" />
                Koneksi terputus, menampilkan data terakhir
              </span>
            )}
            {data && (
              <span>
                Diperbarui{" "}
                {new Date(data.updatedAt).toLocaleTimeString("id-ID", {
                  hour12: false,
                })}
              </span>
            )}
            {refreshIn !== null && (
              <span className="tabular-nums" aria-live="off">
                {q.isFetching || refreshIn === 0
                  ? "Memperbarui..."
                  : `Refresh dalam ${refreshIn} dtk`}
              </span>
            )}
          </div>
        </footer>
      </div>
    </main>
  );
}
