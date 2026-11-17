import { env } from "@/lib/env";

/** Penanda tegas bahwa aplikasi memakai data palsu (DOMJUDGE_MOCK=true). Tidak tampil di mode normal. */
export function MockBanner() {
  if (!env.MOCK) return null;
  return (
    <div
      role="status"
      className="bg-amber-100 px-4 py-1.5 text-center text-sm text-amber-900 dark:bg-amber-950 dark:text-amber-200"
    >
      <strong>MODE MOCK</strong>: data contoh, tidak terhubung ke DOMjudge.
      Login dengan username apa saja (password bebas);{" "}
      <code className="font-mono">admin</code> = akun tanpa tim, password{" "}
      <code className="font-mono">salah</code> = ditolak.
    </div>
  );
}
