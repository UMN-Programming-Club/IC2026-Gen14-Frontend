import "server-only";
import createClient from "openapi-fetch";
import { env } from "@/lib/env";
import { mockFetch } from "@/lib/mock/router";
import type { paths } from "./schema";

export interface Credentials {
  username: string;
  password: string;
}

export function basicAuth({ username, password }: Credentials): string {
  return `Basic ${Buffer.from(`${username}:${password}`).toString("base64")}`;
}

/** Header kunci untuk gerbang nginx DOMjudge (BACKEND_SETUP.md 10.7). Kosong bila gerbang tidak dipakai. */
function gateHeaders(): Record<string, string> {
  return env.GATE_KEY ? { "X-DJ-Gate": env.GATE_KEY } : {};
}

/**
 * Client bertipe untuk DOMjudge. Path di schema sudah berawalan /api/v4.
 * Pada mode mock (DOMJUDGE_MOCK=true), request dijawab oleh src/lib/mock, bukan lewat jaringan.
 */
export function djClient(creds: Credentials) {
  return createClient<paths>({
    baseUrl: env.DOMJUDGE_URL,
    headers: {
      Authorization: basicAuth(creds),
      Accept: "application/json",
      ...gateHeaders(),
    },
    cache: "no-store",
    ...(env.MOCK ? { fetch: mockFetch } : {}),
  });
}

/**
 * fetch mentah ke DOMjudge (untuk proxy respons biner seperti PDF statement
 * atau upload multipart). `path` relatif terhadap /api/v4, mis. "/contests/2/problems".
 */
export function djFetch(
  creds: Credentials,
  path: string,
  init: RequestInit = {},
): Promise<Response> {
  const headers = new Headers(init.headers);
  headers.set("Authorization", basicAuth(creds));
  if (!headers.has("Accept")) headers.set("Accept", "application/json");
  for (const [k, v] of Object.entries(gateHeaders())) headers.set(k, v);
  const url = `${env.DOMJUDGE_URL}/api/v4${path}`;
  const options: RequestInit = {
    ...init,
    headers,
    cache: "no-store",
    signal: init.signal ?? AbortSignal.timeout(15_000),
  };
  return env.MOCK ? mockFetch(new Request(url, options)) : fetch(url, options);
}

/**
 * GET anonim (tanpa login) ke DOMjudge, hanya untuk data yang memang publik (halaman leaderboard terbuka).
 * Tidak membawa kredensial apa pun, jadi DOMjudge sendiri yang menentukan isinya (termasuk freeze).
 * Mode mock memakai akun contoh karena mock tidak melayani permintaan anonim.
 */
export function djPublicFetch(path: string): Promise<Response> {
  if (env.MOCK) return djFetch({ username: "public", password: "x" }, path);
  return fetch(`${env.DOMJUDGE_URL}/api/v4${path}`, {
    headers: { Accept: "application/json", ...gateHeaders() },
    cache: "no-store",
    signal: AbortSignal.timeout(10_000),
  });
}
