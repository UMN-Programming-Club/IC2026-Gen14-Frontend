import { djFetch } from "@/lib/domjudge/client";
import { ContestError, resolveContest } from "@/lib/domjudge/contest";
import { PHASE_MESSAGE, fetchServerPhase } from "@/lib/domjudge/phase";
import { getSessionUser } from "@/lib/session";

/** Segmen pertama yang boleh diteruskan ke DOMjudge. Hak akses sebenarnya tetap ditegakkan DOMjudge. */
const ALLOWED_ROOTS = new Set([
  "state",
  "scoreboard",
  "problems",
  "languages",
  "judgement-types",
  "teams",
  "organizations",
  "groups",
  "submissions",
  "judgements",
  "clarifications",
]);
const SEGMENT = /^[A-Za-z0-9_.-]+$/;
const PASS_HEADERS = ["content-type", "content-disposition", "content-length"];

export async function GET(
  request: Request,
  ctx: { params: Promise<{ path: string[] }> },
) {
  const user = await getSessionUser();
  if (!user) {
    return Response.json(
      { ok: false, message: "Belum login." },
      { status: 401 },
    );
  }

  const { path } = await ctx.params;
  if (
    path.length === 0 ||
    !ALLOWED_ROOTS.has(path[0]) ||
    path.some((s) => s === "." || s === ".." || !SEGMENT.test(s))
  ) {
    return Response.json(
      { ok: false, message: "Endpoint tidak diizinkan." },
      { status: 404 },
    );
  }

  try {
    const contest = await resolveContest(user.username, user.password);

    // Soal hanya boleh dilihat selama contest berlangsung. DOMjudge tidak menyembunyikannya setelah
    // contest selesai, jadi ditegakkan di sini (bukan hanya di UI, yang bisa dilewati).
    let stripProblems = false;
    if (path[0] === "problems") {
      const phase = await fetchServerPhase(user, String(contest.id));
      if (phase === null) {
        return Response.json(
          { ok: false, message: "Status contest tidak dapat dipastikan." },
          { status: 502 },
        );
      }
      if (path.length > 1 && phase !== "running") {
        return Response.json(
          { ok: false, message: PHASE_MESSAGE[phase] },
          { status: 403, headers: { "Cache-Control": "no-store" } },
        );
      }
      // Daftar soal tetap dibutuhkan leaderboard (label dan warna kolom), tetapi tanpa judul,
      // batas waktu, dan tautan statement.
      stripProblems = phase === "ended";
    }

    const search = new URL(request.url).search;
    const upstream = await djFetch(
      user,
      `/contests/${contest.id}/${path.join("/")}${search}`,
      {
        headers: {
          Accept: request.headers.get("accept") ?? "application/json",
        },
      },
    );

    const headers = new Headers();
    for (const h of PASS_HEADERS) {
      const v = upstream.headers.get(h);
      if (v) headers.set(h, v);
    }
    headers.set("Cache-Control", "no-store");
    // Jam DOMjudge (header Date-nya, resolusi 1 detik) untuk menyelaraskan jam hitung mundur di browser.
    const djDate = Date.parse(upstream.headers.get("date") ?? "");
    if (Number.isFinite(djDate)) {
      headers.set("X-Clock-Ms", String(djDate));
      headers.set("X-Clock-Resolution", "1000");
    } else {
      headers.set("X-Clock-Ms", String(Date.now()));
      headers.set("X-Clock-Resolution", "1");
    }
    if (stripProblems && upstream.ok) {
      const list = (await upstream.json().catch(() => null)) as Array<
        Record<string, unknown>
      > | null;
      const safe = Array.isArray(list)
        ? list.map((p) => ({
            id: p.id,
            label: p.label,
            ordinal: p.ordinal,
            rgb: p.rgb,
            color: p.color,
          }))
        : [];
      headers.set("Content-Type", "application/json");
      headers.delete("content-length");
      return new Response(JSON.stringify(safe), { status: 200, headers });
    }
    return new Response(upstream.body, { status: upstream.status, headers });
  } catch (e) {
    if (e instanceof ContestError) {
      return Response.json(
        { ok: false, message: e.message },
        { status: e.kind === "not-found" ? 404 : 502 },
      );
    }
    return Response.json(
      { ok: false, message: "Server contest tidak dapat dihubungi." },
      { status: 502 },
    );
  }
}
