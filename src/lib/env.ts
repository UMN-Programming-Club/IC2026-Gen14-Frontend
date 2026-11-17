import "server-only";
import { z } from "zod";

/** Env kosong (`KEY=`) diperlakukan sama seperti tidak diisi. */
const emptyToUndefined = (v: unknown) => (v === "" ? undefined : v);

/** Alamat palsu yang dipakai internal saat mode mock (tidak pernah dihubungi lewat jaringan). */
export const MOCK_BASE_URL = "http://mock.local";

const schema = z
  .object({
    DOMJUDGE_MOCK: z
      .preprocess(emptyToUndefined, z.enum(["true", "false"]).default("false"))
      .transform((v) => v === "true"),
    DOMJUDGE_URL: z.preprocess(emptyToUndefined, z.string().url().optional()),
    DOMJUDGE_CONTEST_ID: z.string().min(1),
    SESSION_SECRET: z
      .string()
      .min(32, "SESSION_SECRET harus minimal 32 karakter"),
  })
  .refine((v) => v.DOMJUDGE_MOCK || !!v.DOMJUDGE_URL, {
    path: ["DOMJUDGE_URL"],
    message: "wajib diisi, kecuali DOMJUDGE_MOCK=true",
  });

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  const detail = parsed.error.issues
    .map((i) => `${i.path.join(".")}: ${i.message}`)
    .join("; ");
  throw new Error(
    `Konfigurasi environment tidak valid (${detail}). Salin .env.example ke .env.local dan isi nilainya.`,
  );
}

const MOCK = parsed.data.DOMJUDGE_MOCK;

if (MOCK && process.env.NODE_ENV === "production") {
  console.warn(
    "[PERINGATAN] DOMJUDGE_MOCK=true pada build produksi: aplikasi memakai DATA PALSU dan menerima login apa saja. " +
      "Pastikan ini disengaja (mis. preview desain), bukan deploy contest sungguhan.",
  );
}

export const env = {
  /** true = tidak memanggil DOMjudge; semua data berasal dari src/lib/mock. */
  MOCK,
  DOMJUDGE_URL: MOCK
    ? MOCK_BASE_URL
    : (parsed.data.DOMJUDGE_URL as string).replace(/\/+$/, ""),
  DOMJUDGE_CONTEST_ID: parsed.data.DOMJUDGE_CONTEST_ID,
  SESSION_SECRET: parsed.data.SESSION_SECRET,
};
