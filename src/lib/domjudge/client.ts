import "server-only";
import createClient from "openapi-fetch";
import { env } from "@/lib/env";
import type { paths } from "./schema";

export interface Credentials {
  username: string;
  password: string;
}

export function basicAuth({ username, password }: Credentials): string {
  return `Basic ${Buffer.from(`${username}:${password}`).toString("base64")}`;
}

/** Client bertipe untuk DOMjudge. Path di schema sudah berawalan /api/v4. */
export function djClient(creds: Credentials) {
  return createClient<paths>({
    baseUrl: env.DOMJUDGE_URL,
    headers: { Authorization: basicAuth(creds), Accept: "application/json" },
    cache: "no-store",
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
  return fetch(`${env.DOMJUDGE_URL}/api/v4${path}`, {
    ...init,
    headers,
    cache: "no-store",
    signal: init.signal ?? AbortSignal.timeout(15_000),
  });
}
