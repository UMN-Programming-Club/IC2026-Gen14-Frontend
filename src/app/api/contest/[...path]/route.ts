import { djFetch } from "@/lib/domjudge/client";
import { ContestError, resolveContest } from "@/lib/domjudge/contest";
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
