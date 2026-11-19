"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Lock, X } from "lucide-react";
import { PixelStrip, StarMark } from "@/components/arena/logo";
import { arenaButton } from "@/components/arena/button-styles";
import { EVENT } from "@/lib/event";
import { cn } from "@/lib/utils";

const FIELD =
  "h-14 w-full rounded-xl border bg-ink-950 px-4 text-base text-foam-50 outline-none transition-shadow placeholder:text-mist-400/50 focus:border-aqua-400 focus:shadow-[0_0_0_4px_rgb(63_184_166/0.16)]";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);
    const form = new FormData(e.currentTarget);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: form.get("username"),
          password: form.get("password"),
        }),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) {
        setError(body?.message ?? "Login gagal.");
        return;
      }
      router.replace("/");
      router.refresh();
    } catch {
      setError(
        "Tidak dapat menghubungi server. Periksa koneksi lalu coba lagi.",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="bg-arena grid flex-1 lg:grid-cols-[1.25fr_1fr]">
      {/* Sisi kiri: identitas acara */}
      <section className="relative flex flex-col overflow-hidden px-6 py-8 sm:px-12 lg:px-[4.5rem] lg:py-14">
        {/* Cincin dekoratif */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-40 -bottom-56 hidden size-[44rem] rounded-full border-[5.5rem] border-slate-800/70 lg:block"
        />

        <div className="relative flex items-center gap-3">
          <StarMark className="size-10" />
          <div className="leading-tight">
            <p className="text-lg font-extrabold tracking-wide">
              {EVENT.clubShort}
            </p>
            <p className="text-xs tracking-[0.12em] text-mist-400 uppercase">
              {EVENT.club}
            </p>
          </div>
        </div>

        <div className="relative my-10 lg:my-auto">
          <h1 className="title-display from-aqua-200 via-aqua-400 bg-linear-to-b to-teal-600 bg-clip-text text-[clamp(4.25rem,12vw,10rem)] text-transparent">
            Internal
            <br />
            Contest
          </h1>
          <span className="title-display from-foam-50 to-aqua-200 text-ink-950 mt-6 inline-block rounded-full bg-linear-to-r px-7 py-2 text-4xl sm:text-5xl">
            {EVENT.generation}
          </span>
        </div>

        <dl className="relative flex flex-wrap gap-x-12 gap-y-4 lg:mt-0">
          <div>
            <dt className="eyebrow">Tanggal</dt>
            <dd className="mt-1 text-lg font-semibold">{EVENT.dateLabel}</dd>
          </div>
          <div>
            <dt className="eyebrow">Lokasi</dt>
            <dd className="mt-1 text-lg font-semibold">{EVENT.location}</dd>
          </div>
        </dl>
      </section>

      {/* Sisi kanan: formulir */}
      <section className="border-line bg-ink-950/80 flex items-center border-t px-6 py-12 sm:px-12 lg:border-t-0 lg:border-l lg:px-[4.5rem]">
        <div className="mx-auto w-full max-w-md">
          <h2 className="title-display text-5xl">Masuk ke arena</h2>
          <p className="mt-3 text-mist-400">Gunakan akun tim dari panitia.</p>

          <form onSubmit={onSubmit} className="mt-10 flex flex-col gap-6">
            <div className="flex flex-col gap-2.5">
              <label htmlFor="username" className="eyebrow">
                Username tim
              </label>
              <input
                id="username"
                name="username"
                autoComplete="username"
                autoCapitalize="none"
                spellCheck={false}
                placeholder="mis. alpha_team"
                required
                autoFocus
                aria-invalid={error ? true : undefined}
                className={cn(
                  FIELD,
                  error ? "border-wa/70" : "border-line-strong",
                )}
              />
            </div>

            <div className="flex flex-col gap-2.5">
              <label htmlFor="password" className="eyebrow">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  aria-invalid={error ? true : undefined}
                  className={cn(
                    FIELD,
                    "pr-12",
                    error ? "border-wa/70" : "border-line-strong",
                  )}
                />
                <Lock
                  aria-hidden="true"
                  className="pointer-events-none absolute top-1/2 right-4 size-5 -translate-y-1/2 text-mist-400"
                />
              </div>
            </div>

            {error && (
              <p
                role="alert"
                className="text-wa flex items-center gap-2 text-sm"
              >
                <X className="size-4 shrink-0" strokeWidth={3} />
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={pending}
              className={arenaButton("primary", "h-14 w-full text-base")}
            >
              {pending ? (
                "Memeriksa..."
              ) : (
                <>
                  Masuk arena <ArrowRight className="size-5" />
                </>
              )}
            </button>
          </form>

          <PixelStrip count={20} className="mt-12 opacity-70" />
        </div>
      </section>
    </main>
  );
}
