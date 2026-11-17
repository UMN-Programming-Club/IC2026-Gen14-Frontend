import { z } from "zod";
import { djFetch } from "@/lib/domjudge/client";
import { getSession } from "@/lib/session";
import type { components } from "@/lib/domjudge/schema";

const body = z.object({
  username: z.string().trim().min(1, "Username wajib diisi").max(100),
  password: z.string().min(1, "Password wajib diisi").max(200),
});

function fail(status: number, message: string) {
  return Response.json({ ok: false, message }, { status });
}

export async function POST(request: Request) {
  const parsed = body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return fail(400, parsed.error.issues[0]?.message ?? "Input tidak valid");
  }
  const { username, password } = parsed.data;

  let res: Response;
  try {
    res = await djFetch({ username, password }, "/user");
  } catch {
    return fail(
      502,
      "Server contest tidak dapat dihubungi. Coba lagi sebentar.",
    );
  }

  if (res.status === 401) return fail(401, "Username atau password salah.");
  if (!res.ok)
    return fail(502, `Server contest membalas error (${res.status}).`);

  const user = (await res.json()) as components["schemas"]["User"] & {
    username?: string;
  };
  if (!user.team_id) {
    return fail(
      403,
      "Akun ini tidak terhubung ke sebuah tim. Gunakan akun tim peserta.",
    );
  }

  const session = await getSession();
  session.username = username;
  session.password = password;
  session.userid = user.userid;
  session.teamId = user.team_id;
  session.teamName = user.team ?? undefined;
  await session.save();

  return Response.json({ ok: true, team: user.team ?? null });
}
