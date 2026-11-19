// Fungsi format murni (aman dipakai di server maupun client).

export const pad = (n: number) => String(n).padStart(2, "0");

/** 2_774_000 ms -> "00:46:14". */
export function formatClock(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  return `${pad(Math.floor(total / 3600))}:${pad(Math.floor((total % 3600) / 60))}:${pad(total % 60)}`;
}

/** Pecah selisih waktu menjadi hari/jam/menit/detik untuk hitung mundur. */
export function splitCountdown(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  return {
    days: Math.floor(total / 86400),
    hours: Math.floor((total % 86400) / 3600),
    minutes: Math.floor((total % 3600) / 60),
    seconds: total % 60,
  };
}

/** Menit -> "34m", "1h05m", "2h10m" (format sel leaderboard). */
export function formatMinutes(min: number): string {
  if (min < 60) return `${min}m`;
  return `${Math.floor(min / 60)}h${pad(min % 60)}m`;
}

/** Waktu contest DOMjudge "2:14:10.000" -> "02:14:10". */
export function parseContestTime(value?: string | null): string {
  const m = /^(\d+):(\d{2}):(\d{2})/.exec(value ?? "");
  return m ? `${pad(Number(m[1]))}:${m[2]}:${m[3]}` : "--:--:--";
}

/** Durasi DOMjudge "3:00:00.000" -> "3 jam", "2:30:00.000" -> "2 jam 30 mnt". */
export function formatDurationLabel(value?: string | null): string {
  const m = /^(\d+):(\d{2}):(\d{2})/.exec(value ?? "");
  if (!m) return "-";
  const hours = Number(m[1]);
  const minutes = Number(m[2]);
  const parts: string[] = [];
  if (hours) parts.push(`${hours} jam`);
  if (minutes) parts.push(`${minutes} mnt`);
  return parts.join(" ") || "-";
}

/** "Alpha" -> "Tim Alpha"; nama yang sudah diawali "Tim" dibiarkan. */
export function teamLabel(name: string): string {
  return /^tim\s/i.test(name) ? name : `Tim ${name}`;
}

/** Inisial untuk avatar: "Tim Alpha" / "Alpha" -> "A". */
export function teamInitial(name: string): string {
  const bare = name.replace(/^tim\s+/i, "").trim();
  return (bare[0] ?? "?").toUpperCase();
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  return `${(bytes / 1024).toFixed(1).replace(".", ",")} KB`;
}
