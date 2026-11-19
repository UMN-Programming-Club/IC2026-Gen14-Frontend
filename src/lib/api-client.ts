"use client";

import { useQuery } from "@tanstack/react-query";
import { recordClockSample } from "@/lib/server-clock";

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/** GET ke BFF Next.js (`/api/contest/<path>`); tidak pernah langsung ke DOMjudge. */
export async function getJson<T>(
  path: string,
  signal?: AbortSignal,
): Promise<T> {
  const sentAt = Date.now();
  const res = await fetch(`/api/contest/${path}`, {
    signal,
    cache: "no-store",
  });
  const receivedAt = Date.now();
  // Tiap respons membawa jam DOMjudge; ikut dipakai untuk menyempitkan estimasi selisih jam.
  const clockMs = Number(res.headers.get("x-clock-ms"));
  const clockRes = Number(res.headers.get("x-clock-resolution")) || 1;
  if (Number.isFinite(clockMs) && clockMs > 0) {
    recordClockSample(sentAt, receivedAt, clockMs, clockRes);
  }
  // 401 ditangani global di <Providers> (QueryCache.onError -> redirect ke /login).
  const body = await res.json().catch(() => null);
  if (!res.ok) {
    throw new ApiError(
      body?.message ?? `Terjadi kesalahan (${res.status}).`,
      res.status,
    );
  }
  return body as T;
}

export function useContestQuery<T>(path: string, refetchMs?: number) {
  return useQuery({
    queryKey: ["contest", path],
    queryFn: ({ signal }) => getJson<T>(path, signal),
    refetchInterval: refetchMs,
    refetchIntervalInBackground: false,
    retry: (count, error) =>
      !(error instanceof ApiError && error.status < 500) && count < 2,
  });
}
