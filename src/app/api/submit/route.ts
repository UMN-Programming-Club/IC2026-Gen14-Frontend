import { djFetch } from "@/lib/domjudge/client";
import { ContestError, resolveContest } from "@/lib/domjudge/contest";
import { getSessionUser } from "@/lib/session";

const MAX_BYTES = 256 * 1024; // batas kode 256 KB

function fail(status: number, message: string) {
  return Response.json({ ok: false, message }, { status });
}

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) return fail(401, "Belum login.");

  const form = await request.formData().catch(() => null);
  if (!form) return fail(400, "Form tidak valid.");

  const problem = form.get("problem");
  const language = form.get("language");
  const file = form.get("code");
  const entryPoint = form.get("entry_point");

  if (typeof problem !== "string" || !problem)
    return fail(400, "Soal belum dipilih.");
  if (typeof language !== "string" || !language)
    return fail(400, "Bahasa belum dipilih.");
  if (!(file instanceof File) || file.size === 0)
    return fail(400, "File kode kosong.");
  if (file.size > MAX_BYTES)
    return fail(413, "File kode terlalu besar (maks 256 KB).");

  try {
    const contest = await resolveContest(user.username, user.password);

    const upstreamForm = new FormData();
    upstreamForm.set("problem", problem);
    upstreamForm.set("language", language);
    upstreamForm.append("code[]", file, file.name);
    if (typeof entryPoint === "string" && entryPoint) {
      upstreamForm.set("entry_point", entryPoint);
    }

    const res = await djFetch(user, `/contests/${contest.id}/submissions`, {
      method: "POST",
      body: upstreamForm,
    });

    const payload = await res.json().catch(() => null);
    if (!res.ok) {
      const message =
        (payload && typeof payload.message === "string" && payload.message) ||
        `Submit ditolak (${res.status}).`;
      return fail(
        res.status === 401 ? 401 : res.status >= 500 ? 502 : 400,
        message,
      );
    }
    return Response.json({ ok: true, id: payload?.id ?? null });
  } catch (e) {
    if (e instanceof ContestError) {
      return fail(e.kind === "not-found" ? 404 : 502, e.message);
    }
    return fail(502, "Server contest tidak dapat dihubungi.");
  }
}
