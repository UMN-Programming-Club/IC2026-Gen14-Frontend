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
      mime: "application/pdf",
      filename: `${p.id}.pdf`,
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

/** Escape teks untuk string literal PDF. Hanya ASCII. */
function pdfText(t: string): string {
  return t.replace(/[\\()]/g, (c) => `\\${c}`).replace(/[^\x20-\x7e]/g, "?");
}

/**
 * Statement contoh berupa PDF (seperti DOMjudge sungguhan), dua halaman A4, dibangun manual tanpa
 * dependensi. Isinya placeholder, cukup untuk menguji viewer PDF di halaman soal.
 */
export function statementPdf(p: ContestProblem): Uint8Array<ArrayBuffer> {
  const line = (x: number, y: number, size: number, text: string) =>
    `BT /F1 ${size} Tf ${x} ${y} Td (${pdfText(text)}) Tj ET`;
  const pages: string[][] = [
    [
      line(
        56,
        780,
        10,
        "STATEMENT CONTOH (MODE MOCK) - pada contest sungguhan berupa PDF dari panitia",
      ),
      line(56, 740, 24, `${p.label}. ${p.name}`),
      line(56, 715, 11, `Batas waktu: ${p.time_limit} detik`),
      line(56, 680, 14, "Deskripsi"),
      line(
        56,
        660,
        11,
        "Ini hanya teks pengganti agar halaman soal bisa dirancang. Deskripsi, format input,",
      ),
      line(
        56,
        645,
        11,
        "format output, dan contoh kasus uji akan muncul di sini pada contest sungguhan.",
      ),
      line(56, 610, 14, "Format input"),
      line(
        56,
        590,
        11,
        "Satu baris berisi dua bilangan bulat A dan B (1 <= A, B <= 10^9).",
      ),
      line(56, 555, 14, "Format output"),
      line(56, 535, 11, "Satu baris berisi A + B."),
      line(56, 80, 9, "Halaman 1 dari 2"),
    ],
    [
      line(56, 780, 14, "Contoh"),
      line(56, 755, 11, "Input"),
      line(72, 737, 11, "3 4"),
      line(56, 710, 11, "Output"),
      line(72, 692, 11, "7"),
      line(56, 80, 9, "Halaman 2 dari 2"),
    ],
  ];

  const objects: string[] = [];
  const pageIds = pages.map((_, i) => 4 + i * 2);
  objects[1] = "<< /Type /Catalog /Pages 2 0 R >>";
  objects[2] = `<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(" ")}] /Count ${pages.length} >>`;
  objects[3] = "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>";
  pages.forEach((content, i) => {
    const stream = content.join("\n");
    objects[pageIds[i]] =
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 3 0 R >> >> /Contents ${pageIds[i] + 1} 0 R >>`;
    objects[pageIds[i] + 1] =
      `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`;
  });

  let out = "%PDF-1.4\n";
  const offsets: number[] = [];
  for (let id = 1; id < objects.length; id++) {
    offsets[id] = out.length;
    out += `${id} 0 obj\n${objects[id]}\nendobj\n`;
  }
  const xref = out.length;
  out += `xref\n0 ${objects.length}\n0000000000 65535 f \n`;
  for (let id = 1; id < objects.length; id++) {
    out += `${String(offsets[id]).padStart(10, "0")} 00000 n \n`;
  }
  out += `trailer\n<< /Size ${objects.length} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return new TextEncoder().encode(out);
}
