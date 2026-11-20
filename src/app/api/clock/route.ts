import { djFetch } from "@/lib/domjudge/client";
import { getSessionUser } from "@/lib/session";

/**
 * Jam server DOMjudge, untuk menyelaraskan hitung mundur di browser. Jam mesin DOMjudge (mis. WSL/VPS)
 * bisa berbeda beberapa detik dari mesin Next, dan yang menentukan pergantian fase adalah jam DOMjudge.
 * Satu panggilan ringan ke DOMjudge; waktunya dibaca dari header `Date` (resolusi 1 detik).
 */
export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return Response.json(
      { ok: false, message: "Belum login." },
      { status: 401 },
    );
  }
  let ms = Date.now();
  let resolution = 1;
  try {
    const res = await djFetch(user, "/info");
    const parsed = Date.parse(res.headers.get("date") ?? "");
    if (Number.isFinite(parsed)) {
      ms = parsed;
      resolution = 1000;
    }
  } catch {
    // DOMjudge tidak terjangkau: pakai jam Next sebagai cadangan.
  }
  return Response.json(
    { ms, resolution },
    { headers: { "Cache-Control": "no-store" } },
  );
}
