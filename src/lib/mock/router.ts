// Pengganti DOMjudge /api/v4 untuk mode mock. Menerima Request, mengembalikan Response,
// sehingga bisa dipasang sebagai `fetch` pada client tanpa mengubah kode pemanggilnya.
//
// Akun demo (password bebas, kecuali yang disebut di bawah):
//   - username apa saja  -> login sebagai tim "Alpha" (punya submission)
//   - username "baru"    -> tim "Newbie" (belum punya submission, untuk melihat keadaan kosong)
//   - username "admin"   -> akun TANPA tim (frontend harus menolaknya, 403)
//   - password "salah"   -> 401 (menguji pesan kredensial salah)
import { env } from "@/lib/env";
import {
  JUDGEMENT_TYPES,
  LANGUAGES,
  MOCK_CONTEST_ID,
  MOCK_DEMO_TEAM_ID,
  MOCK_NEWBIE_TEAM_ID,
  PROBLEMS,
  TEAMS,
  statementHtml,
} from "./data";
import {
  addSubmission,
  buildContest,
  buildContestState,
  buildScoreboard,
  getPhase,
  getState,
  toJudgement,
  toSubmission,
  visibleProblems,
} from "./state";

const NO_STORE = { "Cache-Control": "no-store" };

/** Jam "DOMjudge" mock: bisa tertinggal dari jam mesin (DOMJUDGE_MOCK_CLOCK_LAG_SEC), seperti server asli di WSL. */
function mockNow(): number {
  return Date.now() - env.MOCK_CLOCK_LAG_MS;
}

function json(body: unknown, status = 200): Response {
  return Response.json(body, {
    status,
    // Seperti server HTTP asli: header Date beresolusi 1 detik.
    headers: {
      "Cache-Control": "no-store",
      Date: new Date(mockNow()).toUTCString(),
    },
  });
}

function error(status: number, message: string): Response {
  return json({ code: status, message }, status);
}

function parseBasicAuth(
  header: string | null,
): { username: string; password: string } | null {
  if (!header?.startsWith("Basic ")) return null;
  const decoded = Buffer.from(header.slice(6), "base64").toString("utf8");
  const i = decoded.indexOf(":");
  if (i < 0) return null;
  return { username: decoded.slice(0, i), password: decoded.slice(i + 1) };
}

function teamIdFor(username: string): string {
  return username === "baru" ? MOCK_NEWBIE_TEAM_ID : MOCK_DEMO_TEAM_ID;
}

export async function mockFetch(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const parts = url.pathname
    .replace(/^\/api\/v4/, "")
    .split("/")
    .filter(Boolean);
  const method = request.method.toUpperCase();

  const auth = parseBasicAuth(request.headers.get("authorization"));
  if (!auth || !auth.username || auth.password === "salah") {
    return error(401, "Invalid credentials (mock)");
  }
  const now = mockNow();

  // GET /user
  if (parts[0] === "user" && parts.length === 1) {
    if (auth.username === "admin") {
      return json({
        userid: 1,
        username: "admin",
        name: "Administrator",
        type: "admin",
        roles: ["admin"],
        team: null,
        team_id: null,
      });
    }
    const teamId = teamIdFor(auth.username);
    return json({
      userid: 2,
      username: auth.username,
      name: auth.username,
      type: "team",
      roles: ["team"],
      team: TEAMS.find((t) => t.id === teamId)?.name,
      team_id: teamId,
    });
  }

  if (parts[0] !== "contests") return error(404, "Not found (mock)");

  // Seperti DOMjudge asli: untuk akun TIM, contest disembunyikan dari GET /contests DAN
  // GET /contests/{id} sampai start time-nya lewat (juga selama start time belum diisi).
  // Hanya akun ber-role API reader (di mock: username "reader") yang boleh melihatnya, dan
  // /contests/{id}/state tetap terbuka tetapi tidak membocorkan waktu mulai (semua null).
  const isReader = auth.username === "reader";
  const hidden = !isReader && getPhase(now) === "before";
  if (parts.length === 1) {
    return json(hidden ? [] : [buildContest()]);
  }

  const [, cid, resource, id, extra] = parts;
  if (cid !== MOCK_CONTEST_ID) {
    return error(404, `Contest with ID '${cid}' not found`);
  }
  if (!resource) {
    return hidden
      ? error(404, `Object with ID '${cid}' not found`)
      : json(buildContest());
  }

  const state = getState();
  const teamId = teamIdFor(auth.username);
  const own = state.submissions.filter((s) => s.teamId === teamId);

  // POST /contests/{cid}/submissions
  if (resource === "submissions" && method === "POST" && !id) {
    // Meniru DOMjudge asli: HANYA menolak sebelum contest mulai. Setelah selesai, submission tetap
    // diterima ("stored but not processed"), jadi penolakannya harus dilakukan frontend/BFF.
    const phase = getPhase(now);
    if (phase === "before") {
      return error(403, "The contest is closed, no submissions accepted.");
    }
    const form = await request.formData().catch(() => null);
    const problem = form?.get("problem");
    const language = form?.get("language");
    const file = form
      ?.getAll("code[]")
      .find((v): v is File => v instanceof File);

    if (
      typeof problem !== "string" ||
      !PROBLEMS.some((p) => p.id === problem)
    ) {
      return error(400, "Problem tidak ditemukan (mock).");
    }
    if (
      typeof language !== "string" ||
      !LANGUAGES.some((l) => l.id === language)
    ) {
      return error(400, "Bahasa tidak ditemukan (mock).");
    }
    if (!file || file.size === 0) {
      return error(400, "Tidak ada file kode (mock).");
    }
    const code = (await file.text()).slice(0, 4096);
    const sub = addSubmission(
      teamId,
      problem,
      language,
      file.name,
      code,
      phase === "ended",
    );
    return json(toSubmission(sub, state.startMs));
  }

  if (method !== "GET") return error(405, "Method not allowed (mock)");

  switch (resource) {
    case "state":
      return json(buildContestState(now));
    case "scoreboard":
      return json(buildScoreboard(now));
    case "languages":
      return json(LANGUAGES);
    case "judgement-types":
      return json(JUDGEMENT_TYPES);
    case "teams":
      return json(TEAMS);
    case "organizations":
    case "groups":
    case "awards":
    case "clarifications":
      return json([]);

    case "problems": {
      const visible = visibleProblems(now);
      if (!id) return json(visible);
      const problem = visible.find((p) => p.id === id);
      if (!problem) return error(404, `Problem with ID '${id}' not found`);
      if (extra === "statement") {
        return new Response(statementHtml(problem), {
          headers: { "Content-Type": "text/html; charset=utf-8", ...NO_STORE },
        });
      }
      return json(problem);
    }

    case "submissions": {
      if (!id) return json(own.map((s) => toSubmission(s, state.startMs)));
      const sub = own.find((s) => String(s.id) === id);
      return sub
        ? json(toSubmission(sub, state.startMs))
        : error(404, `Submission with ID '${id}' not found`);
    }

    case "judgements": {
      if (!id) return json(own.map((s) => toJudgement(s, now)));
      const sub = own.find((s) => String(s.id) === id);
      return sub
        ? json(toJudgement(sub, now))
        : error(404, `Judgement with ID '${id}' not found`);
    }

    default:
      return error(404, "Not found (mock)");
  }
}
