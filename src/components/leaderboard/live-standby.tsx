"use client";

import { WifiOff } from "lucide-react";
import { ArenaScreen, GetReady } from "@/components/home/home-views";
import type { PublicLeaderboard } from "@/lib/domjudge/public-leaderboard";

/** Contest aktif tetapi belum mulai: layar "Get Ready" yang sama dengan Home peserta. */
function Upcoming({
  startsAt,
  now,
}: {
  startsAt: string | null;
  now: number | null;
}) {
  const startMs = startsAt ? Date.parse(startsAt) : NaN;
  const targetMs = Number.isFinite(startMs) ? startMs : null;
  // Hitungan sudah nol tetapi DOMjudge belum membuka klasemen (beberapa detik).
  const opening = targetMs !== null && now !== null && now >= targetMs;
  return (
    <GetReady
      now={now}
      targetMs={targetMs}
      subtitle={opening ? "Membuka leaderboard..." : undefined}
      waitingText="Hitung mundur akan muncul di sini begitu panitia menetapkan waktu mulai."
    />
  );
}

function StandbyContent({
  data,
  failed,
  now,
}: {
  data: PublicLeaderboard | undefined;
  failed: boolean;
  now: number | null;
}) {
  if (data?.status === "upcoming") {
    return <Upcoming startsAt={data.startsAt ?? null} now={now} />;
  }
  if (data) {
    return (
      <ArenaScreen
        white="Belum Ada"
        accent="Kontes"
        subtitle="Hitung mundur muncul otomatis di sini begitu panitia mengaktifkan kontes."
      />
    );
  }
  if (failed) {
    return (
      <ArenaScreen
        white="Koneksi"
        accent="Terputus"
        subtitle="Data kontes belum dapat dimuat. Mencoba lagi otomatis..."
      />
    );
  }
  return (
    <p className="text-muted-foreground flex flex-1 items-center justify-center">
      Memuat...
    </p>
  );
}

/**
 * Layar `/live` selama belum ada leaderboard (belum ada kontes, belum mulai, memuat, atau gagal):
 * satu layar penuh tersendiri, tanpa judul "Leaderboard" dan tanpa kotak tabel. Hitung mundur memakai
 * jam BROWSER (laptop proyektor harus berjam benar).
 */
export function LiveStandby({
  data,
  failed,
  stale,
  now,
}: {
  data: PublicLeaderboard | undefined;
  /** Belum pernah berhasil mengambil data, dan percobaan terakhir gagal. */
  failed: boolean;
  /** Ada data lama, tetapi pembaruannya sedang gagal. */
  stale: boolean;
  now: number | null;
}) {
  return (
    <main className="bg-arena min-h-0 flex-1 overflow-y-auto">
      {/* min-h-full: terpusat di layar; di layar yang terlalu pendek halamannya di-scroll. */}
      <div className="flex min-h-full flex-col py-6">
        <StandbyContent data={data} failed={failed} now={now} />
        {stale && (
          <p
            role="alert"
            className="text-wa flex items-center justify-center gap-1.5 px-4 text-sm font-semibold"
          >
            <WifiOff className="size-4" aria-hidden="true" />
            Koneksi terputus, mencoba lagi otomatis
          </p>
        )}
      </div>
    </main>
  );
}
