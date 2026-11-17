// Pengganti DOMjudge /api/v4 untuk mode mock. Menerima Request, mengembalikan Response,
// sehingga bisa dipasang sebagai `fetch` pada client tanpa mengubah kode pemanggilnya.
//
// Akun demo (password bebas, kecuali yang disebut di bawah):
//   - username apa saja  -> login sebagai "Tim Demo"
//   - username "admin"   -> akun TANPA tim (frontend harus menolaknya, 403)
//   - password "salah"   -> 401 (menguji pesan kredensial salah)
import {
  JUDGEMENT_TYPES,
  LANGUAGES,
  MOCK_CONTEST_ID,
  MOCK_DEMO_TEAM_ID,
  PROBLEMS,
  TEAMS,
  statementHtml,
} from "./data";
import {
  addSubmission,
  buildContest,
  buildContestState,
  buildScoreboard,
  getState,
  toJudgement,
  toSubmission,
} from "./state";

const NO_STORE = { "Cache-Control": "no-store" };

function json(body: unknown, status = 200): Response {
  return Response.json(body, { status, headers: NO_STORE });
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
  const now = Date.now();

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
    return json({
      userid: 2,
      username: auth.username,
      name: auth.username,
      type: "team",
      roles: ["team"],
      team: TEAMS.find((t) => t.id === MOCK_DEMO_TEAM_ID)?.name,
      team_id: MOCK_DEMO_TEAM_ID,
    });
  }

  if (parts[0] !== "contests") return error(404, "Not found (mock)");

  // GET /contests
  if (parts.length === 1) return json([buildContest()]);

  const [, cid, resource, id, extra] = parts;
  if (cid !== MOCK_CONTEST_ID) {
    return error(404, `Contest with ID '${cid}' not found`);
  }
  if (!resource) return json(buildContest());

  const state = getState();
  const teamId = MOCK_DEMO_TEAM_ID;
  const own = state.submissions.filter((s) => s.teamId === teamId);

  // POST /contests/{cid}/submissions
  if (resource === "submissions" && method === "POST" && !id) {
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
    const sub = addSubmission(teamId, problem, language, file.name, code);
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
      if (!id) return json(PROBLEMS);
      const problem = PROBLEMS.find((p) => p.id === id);
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
