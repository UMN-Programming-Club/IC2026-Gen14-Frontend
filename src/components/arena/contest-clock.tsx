"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useContestInfo } from "@/components/contest-context";
import { useContestQuery } from "@/lib/api-client";
import { serverNow, syncServerClock } from "@/lib/server-clock";
import type { ContestState } from "@/lib/domjudge/types";

export type Phase = "before" | "running" | "ended";

export interface ContestClock {
  /** null selama data pertama belum tiba (hindari kedip dan hydration mismatch). */
  phase: Phase | null;
  /** Waktu sekarang menurut server, dibulatkan ke detik. */
  now: number | null;
  start: number | null;
  end: number | null;
  untilStartMs: number;
  remainingMs: number;
  /** 0..1, porsi waktu contest yang sudah lewat. */
  progress: number;
}

const Ctx = createContext<ContestClock | null>(null);

/** "1:00:00.000" -> ms. */
function durationMs(value?: string | null): number | null {
  const m = /^(\d+):(\d{2}):(\d{2})(?:\.(\d+))?/.exec(value ?? "");
  if (!m) return null;
  return (Number(m[1]) * 3600 + Number(m[2]) * 60 + Number(m[3])) * 1000;
}

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/** Jeda antar percobaan ambil `/state` setelah batas waktu terlewati (dalam ms). */
const SETTLE_DELAYS = [0, 400, 800, 1500, 2500, 4000, 6000];

/**
 * Satu-satunya jam contest di aplikasi. Mengapa tidak cukup mem-poll `/state`:
 * - jam perangkat peserta sering melenceng, jadi jam dihitung dari jam DOMjudge (header `Date`-nya), yang bisa beda beberapa detik;
 * - tiap batas waktu (mulai, freeze, selesai) punya timer tepat, bukan menunggu poll berikutnya;
 * - setelah batas terlewati, `/state` diambil berulang dengan cepat sampai DOMjudge ikut berubah,
 *   lalu semua data (soal, scoreboard, submission) langsung disegarkan.
 */
export function ContestClockProvider({ children }: { children: ReactNode }) {
  const { contest } = useContestInfo();
  const queryClient = useQueryClient();
  const router = useRouter();
  // Tanpa waktu mulai yang diketahui (contest kerangka) tidak ada timer tepat, jadi poll lebih rapat.
  const state = useContestQuery<ContestState>(
    "state",
    contest.synthetic ? 2_000 : 5_000,
  );
  // `now` dimulai null supaya HTML server dan client sama.
  const [now, setNow] = useState<number | null>(null);

  // Tick sejajar dengan pergantian detik jam server, jadi angka berganti tepat waktu.
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const tick = () => {
      const n = serverNow();
      setNow(Math.floor(n / 1000) * 1000);
      timer = setTimeout(tick, Math.max(30, 1000 - (n % 1000) + 5));
    };
    tick();
    return () => clearTimeout(timer);
  }, []);

  // Contest kerangka belum tahu waktu mulai, tetapi begitu mulai `/state` memberinya.
  const start = contest.start_time
    ? Date.parse(contest.start_time)
    : state.data?.started
      ? Date.parse(state.data.started)
      : null;
  const end = contest.end_time ? Date.parse(contest.end_time) : null;
  const freezeFor = durationMs(contest.scoreboard_freeze_duration);
  const freeze =
    end !== null && freezeFor !== null && freezeFor > 0
      ? end - freezeFor
      : null;

  let phase: Phase | null = null;
  if (state.data) {
    phase = state.data.ended
      ? "ended"
      : state.data.started
        ? "running"
        : "before";
  } else if (now !== null) {
    phase =
      start !== null && end !== null
        ? now >= end
          ? "ended"
          : now >= start
            ? "running"
            : "before"
        : "before";
  }

  // Timer tepat di tiap batas waktu. `/state` diambil berulang sampai DOMjudge melaporkan batas itu
  // (menutup selisih jam dan latensi). Perubahan datanya sendiri disegarkan oleh efek fase di bawah.
  useEffect(() => {
    let cancelled = false;
    const timers: ReturnType<typeof setTimeout>[] = [];

    const settle = async (reached: (s: ContestState) => boolean) => {
      // Sebar sedikit supaya ratusan peserta tidak menembak server pada milidetik yang sama.
      await sleep(Math.random() * 250);
      for (const wait of SETTLE_DELAYS) {
        if (wait) await sleep(wait);
        if (cancelled) return;
        await queryClient.refetchQueries({ queryKey: ["contest", "state"] });
        const s = queryClient.getQueryData<ContestState>(["contest", "state"]);
        if (s && reached(s)) return;
      }
    };

    const boundaries: Array<[number | null, (s: ContestState) => boolean]> = [
      [start, (s) => !!s.started],
      [freeze, (s) => !!s.frozen],
      [end, (s) => !!s.ended],
    ];
    // Pemeriksa yang selalu membaca jam terbaru (estimasi selisih jam terus menyempit), bukan satu
    // setTimeout panjang yang dihitung dari estimasi lama. Batas yang sudah lewat >10 dtk saat halaman
    // dibuka dianggap lewat; yang baru saja lewat tetap diproses.
    const pending = boundaries.filter(
      (b): b is [number, (s: ContestState) => boolean] =>
        b[0] !== null && b[0] > serverNow() - 10_000,
    );
    const check = () => {
      if (cancelled) return;
      const t = serverNow();
      for (let i = pending.length - 1; i >= 0; i--) {
        if (t >= pending[i][0]) {
          const [, reached] = pending.splice(i, 1)[0];
          void settle(reached);
        }
      }
      if (pending.length === 0) return;
      const next = Math.min(...pending.map(([at]) => at)) - t;
      timers.push(setTimeout(check, Math.min(1000, Math.max(15, next))));
    };
    check();
    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
    };
  }, [start, freeze, end, queryClient]);

  // Selaraskan jam dengan jam DOMjudge: sekali saat dibuka, lalu berkala (jam mesin bisa melompat).
  useEffect(() => {
    const controller = new AbortController();
    void syncServerClock(controller.signal);
    const t = setInterval(
      () => void syncServerClock(controller.signal),
      5 * 60_000,
    );
    return () => {
      controller.abort();
      clearInterval(t);
    };
  }, []);

  // Fase atau status freeze berubah (dari batas waktu, atau juri menekan "start now"/"freeze now"):
  // segarkan SEMUA data supaya soal, scoreboard dan tombol submit langsung sesuai.
  const stateKey = state.data
    ? `${phase}|${state.data.frozen ? 1 : 0}|${state.data.thawed ? 1 : 0}`
    : null;
  const prevKey = useRef<string | null>(null);
  useEffect(() => {
    if (stateKey && prevKey.current && prevKey.current !== stateKey) {
      void queryClient.invalidateQueries({ queryKey: ["contest"] });
    }
    if (stateKey) prevKey.current = stateKey;
  }, [stateKey, queryClient]);

  // Contest kerangka (waktu mulai tidak diketahui sebelum mulai): begitu DOMjudge melaporkan sudah
  // mulai, muat ulang data server supaya waktu mulai/selesai dan status submit yang asli terambil.
  const needsReload = !!contest.synthetic && !!state.data?.started;
  useEffect(() => {
    if (needsReload) router.refresh();
  }, [needsReload, router]);

  // Selama belum mulai, juri bisa mengubah jadwal (mis. "delay start"): ambil ulang data contest berkala.
  const watchSchedule = phase === "before" && !contest.synthetic;
  useEffect(() => {
    if (!watchSchedule) return;
    const t = setInterval(() => router.refresh(), 30_000);
    return () => clearInterval(t);
  }, [watchSchedule, router]);

  const value = useMemo<ContestClock>(() => {
    const untilStartMs =
      start !== null && now !== null ? Math.max(0, start - now) : 0;
    const remainingMs =
      end !== null && now !== null ? Math.max(0, end - now) : 0;
    let progress = 0;
    if (phase === "ended") progress = 1;
    else if (
      phase === "running" &&
      start !== null &&
      end !== null &&
      now !== null &&
      end > start
    ) {
      progress = Math.min(1, Math.max(0, (now - start) / (end - start)));
    }
    return { phase, now, start, end, untilStartMs, remainingMs, progress };
  }, [phase, now, start, end]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useContestClock(): ContestClock {
  const v = useContext(Ctx);
  if (!v) {
    throw new Error(
      "useContestClock harus dipakai di dalam <ContestClockProvider>.",
    );
  }
  return v;
}
