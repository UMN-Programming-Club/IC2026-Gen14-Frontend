// Helper format waktu untuk Home. Waktu "sekarang" diambil dari useContestClock() (jam DOMjudge),
// bukan Date.now(), supaya hitung mundur sama di semua perangkat peserta.

export function pad2(n: number) {
  return String(Math.max(0, Math.floor(n))).padStart(2, "0");
}

export function splitDuration(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  return {
    days: Math.floor(total / 86400),
    hours: Math.floor((total % 86400) / 3600),
    minutes: Math.floor((total % 3600) / 60),
    seconds: total % 60,
  };
}

/** HH:MM:SS (jam boleh lebih dari 24). */
export function formatHms(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  return `${pad2(total / 3600)}:${pad2((total % 3600) / 60)}:${pad2(total % 60)}`;
}
