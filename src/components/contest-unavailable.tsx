"use client";

import { LogOut, RotateCw } from "lucide-react";
import { StarLogo } from "@/components/brand/star-logo";
import type { ContestError } from "@/lib/domjudge/contest";
import { useLogout } from "@/lib/use-logout";

type Kind = ContestError["kind"] | "unknown";

const TITLE: Record<Kind, [string, string]> = {
  "not-found": ["Contest belum", "aktif"],
  unreachable: ["Server tidak", "terhubung"],
  unknown: ["Contest gagal", "dimuat"],
};

/**
 * Layar penuh saat contest tidak bisa dimuat (belum di-activate, atau server bermasalah). Tidak ada
 * sidebar di sini, jadi tombol Keluar harus ada agar tim tidak terjebak di sesi yang sudah login.
 */
export function ContestUnavailable({
  kind,
  message,
  teamName,
}: {
  kind: Kind;
  message: string;
  teamName: string;
}) {
  const logout = useLogout();
  const [white, accent] = TITLE[kind];

  return (
    <main className="bg-arena min-h-0 flex-1 overflow-y-auto">
      <div className="mx-auto flex min-h-full w-full max-w-xl flex-col items-center justify-center px-4 py-10 text-center">
        <StarLogo className="size-12" />
        <h1 className="font-display mt-5 text-4xl leading-none font-extrabold uppercase italic sm:text-5xl">
          {white} <span className="text-danger">{accent}</span>
        </h1>
        <p role="alert" className="text-muted-foreground mt-3 max-w-md">
          {message}
        </p>
        <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="bg-teal hover:bg-teal/90 flex h-10 items-center gap-2 rounded-lg px-5 text-sm font-bold text-[#06201c]"
          >
            <RotateCw className="size-4" aria-hidden="true" />
            Muat ulang
          </button>
          <button
            type="button"
            onClick={logout}
            className="border-line text-foreground flex h-10 items-center gap-2 rounded-lg border px-5 text-sm font-medium hover:bg-white/5"
          >
            <LogOut className="size-4" aria-hidden="true" />
            Keluar
          </button>
        </div>
        <p className="text-muted-foreground mt-6 text-xs">
          Masuk sebagai <span className="font-semibold">{teamName}</span>
        </p>
      </div>
    </main>
  );
}
