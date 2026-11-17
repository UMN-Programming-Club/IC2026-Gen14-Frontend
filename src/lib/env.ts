import "server-only";
import { z } from "zod";

const schema = z.object({
  DOMJUDGE_URL: z
    .string()
    .url()
    .transform((v) => v.replace(/\/+$/, "")),
  DOMJUDGE_CONTEST_ID: z.string().min(1),
  SESSION_SECRET: z
    .string()
    .min(32, "SESSION_SECRET harus minimal 32 karakter"),
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

export const env = parsed.data;
