// Data contoh untuk mode mock (DOMJUDGE_MOCK=true). Semua data di sini fiktif.
// Bentuknya meniru respons DOMjudge 9 /api/v4 supaya halaman tidak perlu tahu bedanya.
import type {
  ContestProblem,
  JudgementType,
  Language,
  Team,
} from "@/lib/domjudge/types";

export const MOCK_CONTEST_ID = "IC2026";
export const MOCK_DEMO_TEAM_ID = "demo";
export const CONTEST_DURATION_MS = 5 * 60 * 60 * 1000;
export const PENALTY_MINUTES = 20;
/** Submission baru berstatus "menunggu" selama ini sebelum verdict-nya keluar. */
export const JUDGE_DELAY_MS = 4_000;

export const TEAMS: Team[] = [
  { id: "demo", name: "Tim Demo", organization_id: "umn" },
  { id: "alpha", name: "Alpha Coders", organization_id: "umn" },
  { id: "binary", name: "Binary Brigade", organization_id: "umn" },
  { id: "cache", name: "Cache Me If You Can", organization_id: "umn" },
  { id: "dijkstra", name: "Dijkstra Fans", organization_id: "umn" },
  { id: "segfault", name: "Segfault Squad", organization_id: "umn" },
  { id: "greedy", name: "Greedy Gophers", organization_id: "umn" },
  { id: "null", name: "Null Pointers", organization_id: "umn" },
].map((t) => ({ ...t, hidden: false, group_ids: ["participants"] }));

export const PROBLEMS: ContestProblem[] = [
  { id: "hello", label: "A", name: "Hello World", time_limit: 1 },
  { id: "sumtwo", label: "B", name: "Penjumlahan Dua Angka", time_limit: 1 },
  { id: "primes", label: "C", name: "Bilangan Prima", time_limit: 2 },
  { id: "paths", label: "D", name: "Jalur Terpendek", time_limit: 3 },
  { id: "strings", label: "E", name: "Palindrom Terpanjang", time_limit: 2 },
].map((p, ordinal) => ({
  ...p,
  ordinal,
  short_name: p.label,
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
  /** Menit sejak contest mulai. */
  minute: number;
  languageId: string;
  verdict: string;
  /** true = tidak pernah selesai dinilai (untuk menampilkan kondisi "menunggu"). */
  pending?: boolean;
}

/** Contest dianggap sudah berjalan 60 menit saat server mulai, jadi semua `minute` harus < 60. */
export const SEED_SUBMISSIONS: SeedSubmission[] = [
  // Tim Demo (akun login mock): selesai 2 soal, 1 dengan penalti, 1 TLE, 1 CE, 1 menunggu.
  {
    teamId: "demo",
    problemId: "hello",
    minute: 6,
    languageId: "cpp",
    verdict: "AC",
  },
  {
    teamId: "demo",
    problemId: "sumtwo",
    minute: 14,
    languageId: "python3",
    verdict: "WA",
  },
  {
    teamId: "demo",
    problemId: "sumtwo",
    minute: 19,
    languageId: "python3",
    verdict: "AC",
  },
  {
    teamId: "demo",
    problemId: "primes",
    minute: 31,
    languageId: "cpp",
    verdict: "TLE",
  },
  {
    teamId: "demo",
    problemId: "paths",
    minute: 44,
    languageId: "java",
    verdict: "CE",
  },
  {
    teamId: "demo",
    problemId: "strings",
    minute: 52,
    languageId: "go",
    verdict: "AC",
    pending: true,
  },

  {
    teamId: "alpha",
    problemId: "hello",
    minute: 4,
    languageId: "cpp",
    verdict: "AC",
  },
  {
    teamId: "alpha",
    problemId: "sumtwo",
    minute: 9,
    languageId: "cpp",
    verdict: "AC",
  },
  {
    teamId: "alpha",
    problemId: "primes",
    minute: 25,
    languageId: "cpp",
    verdict: "WA",
  },
  {
    teamId: "alpha",
    problemId: "primes",
    minute: 33,
    languageId: "cpp",
    verdict: "AC",
  },
  {
    teamId: "alpha",
    problemId: "paths",
    minute: 50,
    languageId: "cpp",
    verdict: "WA",
  },

  {
    teamId: "binary",
    problemId: "hello",
    minute: 8,
    languageId: "java",
    verdict: "AC",
  },
  {
    teamId: "binary",
    problemId: "sumtwo",
    minute: 22,
    languageId: "java",
    verdict: "AC",
  },

  {
    teamId: "cache",
    problemId: "hello",
    minute: 5,
    languageId: "c",
    verdict: "AC",
  },
  {
    teamId: "cache",
    problemId: "sumtwo",
    minute: 12,
    languageId: "c",
    verdict: "WA",
  },
  {
    teamId: "cache",
    problemId: "sumtwo",
    minute: 18,
    languageId: "c",
    verdict: "WA",
  },
  {
    teamId: "cache",
    problemId: "sumtwo",
    minute: 27,
    languageId: "c",
    verdict: "AC",
  },
  {
    teamId: "cache",
    problemId: "primes",
    minute: 41,
    languageId: "c",
    verdict: "RTE",
  },

  {
    teamId: "dijkstra",
    problemId: "hello",
    minute: 11,
    languageId: "python3",
    verdict: "AC",
  },
  {
    teamId: "dijkstra",
    problemId: "paths",
    minute: 38,
    languageId: "cpp",
    verdict: "AC",
  },

  {
    teamId: "segfault",
    problemId: "hello",
    minute: 17,
    languageId: "c",
    verdict: "WA",
  },
  {
    teamId: "segfault",
    problemId: "hello",
    minute: 23,
    languageId: "c",
    verdict: "RTE",
  },
  {
    teamId: "segfault",
    problemId: "hello",
    minute: 29,
    languageId: "c",
    verdict: "AC",
  },

  {
    teamId: "greedy",
    problemId: "hello",
    minute: 33,
    languageId: "go",
    verdict: "AC",
  },

  {
    teamId: "null",
    problemId: "sumtwo",
    minute: 47,
    languageId: "java",
    verdict: "TLE",
  },
];

interface StatementText {
  description: string;
  input: string;
  output: string;
  sampleIn: string;
  sampleOut: string;
}

const STATEMENTS: Record<string, StatementText> = {
  hello: {
    description: "Cetak tulisan <code>Hello, World!</code> ke layar.",
    input: "Tidak ada input.",
    output: "Satu baris berisi <code>Hello, World!</code>.",
    sampleIn: "(kosong)",
    sampleOut: "Hello, World!",
  },
  sumtwo: {
    description:
      "Diberikan dua bilangan bulat <i>A</i> dan <i>B</i>. Cetak hasil penjumlahannya.",
    input:
      "Satu baris berisi dua bilangan bulat <i>A</i> dan <i>B</i> (|A|, |B| ≤ 10<sup>9</sup>).",
    output: "Satu bilangan bulat: <i>A</i> + <i>B</i>.",
    sampleIn: "3 4",
    sampleOut: "7",
  },
  primes: {
    description:
      "Hitung banyaknya bilangan prima yang kurang dari atau sama dengan <i>N</i>.",
    input: "Satu bilangan bulat <i>N</i> (1 ≤ <i>N</i> ≤ 10<sup>7</sup>).",
    output: "Satu bilangan bulat: banyaknya bilangan prima ≤ <i>N</i>.",
    sampleIn: "10",
    sampleOut: "4",
  },
  paths: {
    description:
      "Diberikan graf berbobot tak berarah. Cari panjang jalur terpendek dari simpul 1 ke simpul <i>N</i>.",
    input:
      "Baris pertama: <i>N</i> dan <i>M</i>. Lalu <i>M</i> baris berisi <i>u v w</i>.",
    output: "Panjang jalur terpendek, atau <code>-1</code> bila tidak ada.",
    sampleIn: "3 3\n1 2 4\n2 3 5\n1 3 10",
    sampleOut: "9",
  },
  strings: {
    description:
      "Cari panjang substring palindrom terpanjang dari string <i>S</i>.",
    input: "Satu string <i>S</i> huruf kecil (1 ≤ |<i>S</i>| ≤ 5000).",
    output: "Satu bilangan bulat: panjang palindrom terpanjang.",
    sampleIn: "babad",
    sampleOut: "3",
  },
};

/** Statement versi HTML (DOMjudge sungguhan biasanya mengirim PDF). */
export function statementHtml(p: ContestProblem): string {
  const s = STATEMENTS[p.id ?? ""];
  return `<!doctype html>
<html lang="id"><head><meta charset="utf-8"><title>${p.name}</title>
<style>
body{font:16px/1.6 system-ui,sans-serif;max-width:46rem;margin:2rem auto;padding:0 1rem;color:#18181b}
h1{margin-bottom:.25rem} .meta{color:#71717a;margin-top:0}
pre{background:#f4f4f5;padding:.75rem 1rem;border-radius:.5rem;overflow:auto}
code{background:#f4f4f5;padding:.1rem .3rem;border-radius:.25rem}
.mock{background:#fef3c7;color:#92400e;padding:.5rem .75rem;border-radius:.5rem;font-size:.875rem}
</style></head><body>
<p class="mock">Statement contoh (mode mock). Pada DOMjudge sungguhan, ini berupa PDF.</p>
<h1>${p.label}. ${p.name}</h1>
<p class="meta">Batas waktu: ${p.time_limit} detik</p>
<p>${s?.description ?? ""}</p>
<h2>Input</h2><p>${s?.input ?? ""}</p>
<h2>Output</h2><p>${s?.output ?? ""}</p>
<h2>Contoh</h2>
<p>Input</p><pre>${s?.sampleIn ?? ""}</pre>
<p>Output</p><pre>${s?.sampleOut ?? ""}</pre>
</body></html>`;
}
