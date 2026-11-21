import { connection } from "next/server";
import { getPublicLeaderboard } from "@/lib/domjudge/public-leaderboard";

/**
 * Data leaderboard TERBUKA (tanpa login). Tidak membaca cookie, tidak menerima parameter apa pun dari
 * pengunjung, dan hanya memanggil URL tetap ke DOMjudge, jadi tidak ada jalur untuk meminta data lain.
 *
 * Beban ke DOMjudge tetap kecil berapa pun pengunjungnya: server memakai satu cache bersama, dan
 * `s-maxage` memungkinkan CDN (mis. Vercel) menyajikannya tanpa menjalankan fungsi ini lagi.
 */
export async function GET() {
  await connection(); // selalu dijalankan saat ada permintaan, bukan dibekukan saat build
  try {
    const data = await getPublicLeaderboard();
    return Response.json(data, {
      headers: {
        "Cache-Control": data.available
          ? "public, max-age=2, s-maxage=5, stale-while-revalidate=10"
          : "public, max-age=2, s-maxage=5",
      },
    });
  } catch {
    // Jangan membocorkan alasan teknis (alamat, kode status) ke pengunjung anonim.
    return Response.json(
      { ok: false, message: "Leaderboard belum dapat dimuat." },
      { status: 502, headers: { "Cache-Control": "no-store" } },
    );
  }
}
