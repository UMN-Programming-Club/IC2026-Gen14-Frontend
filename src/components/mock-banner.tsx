import { env } from "@/lib/env";

const SCENARIO_LABEL = {
  before: "sebelum mulai",
  soon: "mulai sebentar lagi (~25 detik)",
  unscheduled: "belum dijadwalkan (start time kosong)",
  running: "berlangsung",
  frozen: "berlangsung, leaderboard sudah dibekukan",
  ending: "hampir selesai (freeze ~25 dtk, selesai ~50 dtk)",
  ended: "selesai",
} as const;

/** Penanda tegas bahwa aplikasi memakai data palsu (DOMJUDGE_MOCK=true). Tidak tampil di mode normal. */
export function MockBanner() {
  if (!env.MOCK) return null;
  return (
    <div
      role="status"
      className="border-brass-400/30 bg-brass-400/15 text-brass-400 shrink-0 border-b px-4 py-1.5 text-center text-xs"
    >
      <strong className="tracking-wider">MODE MOCK</strong> · data contoh,
      contest {SCENARIO_LABEL[env.MOCK_SCENARIO]}.
      {/* Petunjuk login cukup di layar lebar; di HP banner dibuat satu-dua baris saja. */}
      <span className="hidden sm:inline">
        {" "}
        Login: username apa saja (password bebas);{" "}
        <code className="font-mono">baru</code> = tim tanpa submission,{" "}
        <code className="font-mono">admin</code> = akun tanpa tim, password{" "}
        <code className="font-mono">salah</code> = ditolak.
      </span>
    </div>
  );
}
