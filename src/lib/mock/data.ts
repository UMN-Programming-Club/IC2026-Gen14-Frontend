// Data contoh untuk mode mock (DOMJUDGE_MOCK=true). Semua data di sini fiktif.
// Bentuknya meniru respons DOMjudge 9 /api/v4 supaya halaman tidak perlu tahu bedanya.
import type {
  ContestProblem,
  JudgementType,
  Language,
  Team,
} from "@/lib/domjudge/types";

export const MOCK_CONTEST_ID = "IC2026";
/** Akun login biasa dipetakan ke tim ini. */
export const MOCK_DEMO_TEAM_ID = "alpha";
/** Login dengan username `baru` memakai tim ini (tanpa satu pun submission). */
export const MOCK_NEWBIE_TEAM_ID = "newbie";
export const CONTEST_DURATION_MS = 3 * 60 * 60 * 1000;
export const PENALTY_MINUTES = 20;
/** Submission baru berstatus "menunggu" selama ini sebelum verdict-nya keluar. */
export const JUDGE_DELAY_MS = 4_000;
/** Pada skenario `running`, contest dianggap sudah berjalan selama ini (menit). */
export const RUNNING_ELAPSED_MIN = 134;

export const TEAMS: Team[] = [
  { id: "alpha", name: "Alpha" },
  { id: "kraken", name: "Kraken" },
  { id: "nautilus", name: "Nautilus" },
  { id: "leviathan", name: "Leviathan" },
  { id: "abyssal", name: "Abyssal" },
  { id: "trident", name: "Trident" },
  { id: "coral", name: "Coral" },
  { id: "siren", name: "Siren" },
  { id: "newbie", name: "Newbie" },
].map((t) => ({
  ...t,
  organization_id: "umn",
  hidden: false,
  group_ids: ["participants"],
}));

export const PROBLEMS: ContestProblem[] = [
  { id: "ic1", name: "Battle Imbalance", time_limit: 1, rgb: "#ffffff" },
  { id: "ic2", name: "Chain Reaction", time_limit: 1, rgb: "#6b7280" },
  { id: "ic3", name: "Emergency Signal", time_limit: 2, rgb: "#ef4444" },
  {
    id: "ic4",
    name: "Absolute Symmetry Encryption",
    time_limit: 2,
    rgb: "#10b981",
  },
  { id: "ic5", name: "Generator Calibration", time_limit: 3, rgb: "#3b82f6" },
  { id: "ic6", name: "Server Tolerance", time_limit: 2, rgb: "#8b5cf6" },
].map((p, ordinal) => ({
  ...p,
  label: p.id.toUpperCase(),
  short_name: p.id.toUpperCase(),
  ordinal,
  attachments: [],
  statement: [
    {
      href: `contests/${MOCK_CONTEST_ID}/problems/${p.id}/statement`,
      mime: "text/html",
      filename: `${p.id}.html`,
    },
  ],
}));

export const LANGUAGES: Language[] = [
  { id: "c", name: "C", extensions: ["c"] },
  { id: "cpp", name: "C++", extensions: ["cpp", "cc", "cxx", "c++"] },
  { id: "java", name: "Java", extensions: ["java"] },
  { id: "python3", name: "Python 3", extensions: ["py"] },
  { id: "go", name: "Go", extensions: ["go"] },
].map((l) => ({
  ...l,
  allow_judge: true,
  filter_compiler_files: true,
  time_factor: 1,
  entry_point_required: false,
}));

export const JUDGEMENT_TYPES: JudgementType[] = [
  { id: "AC", name: "correct", penalty: false, solved: true },
  { id: "CE", name: "compiler error", penalty: false, solved: false },
  { id: "MLE", name: "memory limit", penalty: true, solved: false },
  { id: "NO", name: "no output", penalty: true, solved: false },
  { id: "OLE", name: "output limit", penalty: true, solved: false },
  { id: "RTE", name: "run error", penalty: true, solved: false },
  { id: "TLE", name: "timelimit", penalty: true, solved: false },
  { id: "WA", name: "wrong answer", penalty: true, solved: false },
];

export interface SeedSubmission {
  teamId: string;
  problemId: string;
  /** Menit sejak contest mulai. Harus < RUNNING_ELAPSED_MIN. */
  minute: number;
  languageId: string;
  verdict: string;
  /** true = tidak pernah selesai dinilai pada skenario `running` (menampilkan kondisi "menunggu"). */
  pending?: boolean;
}

const s = (
  teamId: string,
  problemId: string,
  minute: number,
  languageId: string,
  verdict: string,
  pending = false,
): SeedSubmission => ({
  teamId,
  problemId,
  minute,
  languageId,
  verdict,
  pending,
});

/**
 * Submission awal. Mencakup semua kondisi sel leaderboard: first solve (bintang), AC biasa,
 * AC setelah salah (+N), hanya salah (-N), menunggu, dan belum dicoba.
 * Tim `alpha` (akun login) punya 2 AC, 1 salah, 1 menunggu = 5 submission.
 */
export const SEED_SUBMISSIONS: SeedSubmission[] = [
  s("kraken", "ic1", 34, "cpp", "AC"),
  s("kraken", "ic2", 52, "cpp", "WA"),
  s("kraken", "ic2", 60, "cpp", "AC"),
  s("kraken", "ic3", 70, "cpp", "WA"),
  s("kraken", "ic3", 78, "cpp", "WA"),
  s("kraken", "ic3", 86, "cpp", "AC"),
  s("kraken", "ic4", 118, "cpp", "AC"),
  s("kraken", "ic5", 126, "cpp", "AC"),

  s("nautilus", "ic1", 41, "java", "AC"),
  s("nautilus", "ic2", 48, "java", "WA"),
  s("nautilus", "ic2", 55, "java", "WA"),
  s("nautilus", "ic2", 62, "java", "WA"),
  s("nautilus", "ic2", 70, "java", "AC"),
  s("nautilus", "ic3", 90, "java", "WA"),
  s("nautilus", "ic3", 97, "java", "WA"),
  s("nautilus", "ic4", 125, "java", "AC"),
  s("nautilus", "ic5", 130, "java", "AC"),

  s("alpha", "ic1", 35, "cpp", "AC"),
  s("alpha", "ic2", 60, "cpp", "WA"),
  s("alpha", "ic2", 80, "cpp", "AC"),
  s("alpha", "ic3", 95, "python3", "WA"),
  s("alpha", "ic4", 132, "cpp", "AC", true),

  s("leviathan", "ic1", 50, "c", "AC"),
  s("leviathan", "ic3", 65, "c", "AC"),
  s("leviathan", "ic4", 120, "c", "AC"),
  s("leviathan", "ic5", 100, "c", "WA"),
  s("leviathan", "ic5", 104, "c", "WA"),
  s("leviathan", "ic5", 108, "c", "WA"),
  s("leviathan", "ic5", 112, "c", "WA"),

  s("abyssal", "ic1", 62, "python3", "AC"),
  s("abyssal", "ic2", 70, "python3", "WA"),
  s("abyssal", "ic2", 82, "python3", "AC"),
  s("abyssal", "ic4", 110, "python3", "WA"),
  s("abyssal", "ic5", 127, "python3", "AC"),

  s("trident", "ic1", 47, "go", "AC"),
  s("trident", "ic4", 123, "go", "AC"),

  s("coral", "ic1", 95, "java", "AC"),
  s("coral", "ic2", 100, "java", "WA"),
  s("coral", "ic2", 106, "java", "WA"),

  s("siren", "ic1", 90, "cpp", "WA"),
];

/** Statement versi HTML (DOMjudge sungguhan biasanya mengirim PDF). Isinya placeholder. */
export function statementHtml(p: ContestProblem): string {
  return `<!doctype html>
<html lang="id"><head><meta charset="utf-8"><title>${p.label} ${p.name}</title>
<style>
body{font:16px/1.6 system-ui,sans-serif;max-width:46rem;margin:2rem auto;padding:0 1rem;color:#18181b}
h1{margin-bottom:.25rem} .meta{color:#71717a;margin-top:0}
pre{background:#f4f4f5;padding:.75rem 1rem;border-radius:.5rem;overflow:auto}
.mock{background:#fef3c7;color:#92400e;padding:.5rem .75rem;border-radius:.5rem;font-size:.875rem}
</style></head><body>
<p class="mock">Statement contoh (mode mock). Pada DOMjudge sungguhan, ini berupa PDF dari panitia.</p>
<h1>${p.label}. ${p.name}</h1>
<p class="meta">Batas waktu: ${p.time_limit} detik</p>
<p>Ini hanya teks pengganti agar halaman soal bisa dirancang. Deskripsi, format input, format output, dan contoh
kasus uji akan muncul di sini pada contest sungguhan.</p>
<h2>Contoh</h2>
<p>Input</p><pre>3 4</pre>
<p>Output</p><pre>7</pre>
</body></html>`;
}
