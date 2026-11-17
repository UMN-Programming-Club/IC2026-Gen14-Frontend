import "server-only";
import { cache } from "react";
import { env } from "@/lib/env";
import { djClient, type Credentials } from "./client";
import type { components } from "./schema";

export type Contest = components["schemas"]["Contest"];

export class ContestError extends Error {
  constructor(
    message: string,
    readonly kind: "not-found" | "unreachable",
  ) {
    super(message);
    this.name = "ContestError";
  }
}

/**
 * Cari contest yang dikonfigurasi (DOMJUDGE_CONTEST_ID) berdasarkan `id` ATAU `shortname`.
 * Tidak pernah jatuh ke data palsu: bila tidak ketemu, lempar ContestError.
 */
export const resolveContest = cache(
  async (username: string, password: string): Promise<Contest> => {
    const creds: Credentials = { username, password };
    const wanted = env.DOMJUDGE_CONTEST_ID;

    let contests: Contest[] | undefined;
    try {
      const { data, error } = await djClient(creds).GET("/api/v4/contests", {
        params: { query: { onlyActive: false } },
      });
      if (error || !data) {
        throw new ContestError(
          "DOMjudge menolak permintaan daftar contest.",
          "unreachable",
        );
      }
      contests = data as Contest[];
    } catch (e) {
      if (e instanceof ContestError) throw e;
      throw new ContestError(
        "Server DOMjudge tidak dapat dihubungi.",
        "unreachable",
      );
    }

    const found = contests.find(
      (c) => c.id === wanted || c.shortname === wanted,
    );
    if (!found) {
      throw new ContestError(
        `Contest "${wanted}" tidak ditemukan di DOMjudge (id/shortname tidak cocok, atau akun ini tidak punya akses).`,
        "not-found",
      );
    }
    return found;
  },
);
