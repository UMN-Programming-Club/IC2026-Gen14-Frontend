import "server-only";
import { cookies } from "next/headers";
import { getIronSession, type SessionOptions } from "iron-session";
import { env } from "@/lib/env";

export interface SessionData {
  username: string;
  /** Disimpan terenkripsi di cookie httpOnly; tidak pernah dikirim ke JS browser. */
  password: string;
  userid?: number;
  teamId: string;
  teamName?: string;
}

export const sessionOptions: SessionOptions = {
  cookieName: "umnpc_session",
  password: env.SESSION_SECRET,
  ttl: 60 * 60 * 12, // 12 jam
  cookieOptions: {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  },
};

export async function getSession() {
  return getIronSession<SessionData>(await cookies(), sessionOptions);
}

/** Kembalikan data session bila login, selain itu null. */
export async function getSessionUser(): Promise<SessionData | null> {
  const session = await getSession();
  if (!session.username || !session.password || !session.teamId) return null;
  return {
    username: session.username,
    password: session.password,
    userid: session.userid,
    teamId: session.teamId,
    teamName: session.teamName,
  };
}
