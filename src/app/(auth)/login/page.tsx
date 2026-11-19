"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Lock, X } from "lucide-react";
import { StarLogo } from "@/components/brand/star-logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
    <main className="grid h-full min-h-0 grid-rows-[auto_1fr] overflow-hidden lg:grid-cols-[55.6fr_44.4fr] lg:grid-rows-1">
      {/* ---------- Hero kiri ---------- */}
      <section className="border-line relative flex min-h-0 flex-col overflow-hidden border-b px-6 pt-5 pb-4 lg:border-r lg:border-b-0 lg:px-[3.75rem] lg:pt-[4.25rem] lg:pb-[3.5rem]">
        <div className="bg-dots pointer-events-none absolute inset-0" />
        <div className="bg-teal/[0.06] pointer-events-none absolute -top-24 right-0 size-[28rem] rounded-full blur-3xl" />
        {/* Lingkaran konsentris */}
        <div className="pointer-events-none absolute inset-0 hidden lg:block">
          <div className="absolute right-[-12.5rem] bottom-[-18rem] size-[41.6rem] rounded-full border border-white/[0.04] bg-white/[0.025]" />
          <div className="absolute right-[-8.5rem] bottom-[-14.4rem] size-[35.4rem] rounded-full bg-white/[0.03]" />
          <div className="bg-background absolute right-[-4.2rem] bottom-[-10.2rem] size-[28.9rem] rounded-full border border-white/[0.05]" />
        </div>

        <div className="relative flex items-center gap-3">
          <StarLogo className="size-7 lg:size-[2.1rem]" />
          <div className="leading-tight">
            <p className="text-[1.05rem] font-bold tracking-wide">UMNPC</p>
            <p className="text-muted-foreground text-[0.7rem] tracking-[0.08em] uppercase">
              UMN Programming Club
            </p>
          </div>
        </div>

        <div className="relative mt-4 lg:mt-[7.8rem]">
          <h1 className="font-display bg-gradient-to-b from-[#b4eee3] via-[#4aa395] to-[#0f6b63] bg-clip-text text-[clamp(3rem,15vw,5rem)] leading-[0.87] font-extrabold tracking-[-0.005em] text-transparent uppercase italic lg:text-[7.75rem]">
            Internal
            <br />
            Contest
          </h1>
          <span className="font-display mt-3 inline-flex h-8 items-center rounded-full bg-gradient-to-r from-[#f1faf8] to-[#a8e8dc] px-5 text-[1.25rem] font-bold text-[#0c3a35] italic lg:mt-4 lg:h-[2.9rem] lg:px-[2.2rem] lg:text-[1.75rem]">
            GEN XIV
          </span>
        </div>

        <dl className="relative mt-auto hidden gap-x-[9.8rem] lg:flex">
          <div>
            <dt className="text-muted-foreground text-[0.7rem] font-semibold tracking-[0.1em] uppercase">
              Tanggal
            </dt>
            <dd className="mt-1.5 text-[0.95rem] font-medium">
              28 November 2026
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground text-[0.7rem] font-semibold tracking-[0.1em] uppercase">
              Lokasi
            </dt>
            <dd className="mt-1.5 text-[0.95rem] font-medium">
              UMN, Kantin Gedung C
            </dd>
          </div>
        </dl>
        <p className="text-muted-foreground relative mt-3 text-xs lg:hidden">
          28 November 2026 · UMN, Kantin Gedung C
        </p>
      </section>

      {/* ---------- Form kanan ---------- */}
      <section className="flex min-h-0 items-center justify-center px-6 lg:px-[4.6rem]">
        <form onSubmit={onSubmit} className="w-full max-w-[24.3rem]">
          <h2 className="font-display text-[2rem] leading-none font-extrabold uppercase italic lg:text-[2.45rem]">
            Masuk ke Arena
          </h2>
          <p className="text-muted-foreground mt-2 text-[0.9rem] lg:mt-3">
            Gunakan akun tim dari panitia.
          </p>

          <div className="mt-5 flex flex-col gap-1.5 lg:mt-[2.6rem]">
            <Label
              htmlFor="username"
              className="text-muted-foreground text-[0.72rem] font-semibold tracking-[0.1em] uppercase"
            >
              Username Tim
            </Label>
            <Input
              id="username"
              name="username"
              autoComplete="username"
              required
              autoFocus
              className="border-line focus-visible:border-teal focus-visible:ring-teal/15 h-[2.7rem] rounded-lg bg-[#070c0d] px-4 text-[0.95rem] focus-visible:ring-4"
            />
          </div>

          <div className="mt-4 flex flex-col gap-1.5 lg:mt-[1.7rem]">
            <Label
              htmlFor="password"
              className="text-muted-foreground text-[0.72rem] font-semibold tracking-[0.1em] uppercase"
            >
              Password
            </Label>
            <div className="relative">
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="border-line focus-visible:border-teal focus-visible:ring-teal/15 h-[2.7rem] rounded-lg bg-[#070c0d] px-4 pr-11 text-[0.95rem] focus-visible:ring-4"
              />
              <Lock
                className="text-muted-foreground pointer-events-none absolute top-1/2 right-4 size-4 -translate-y-1/2"
                aria-hidden="true"
              />
            </div>
          </div>

          <div className="mt-3 min-h-5">
            {error && (
              <p
                role="alert"
                className="flex items-center gap-2 text-[0.85rem] text-[#e87474]"
              >
                <X className="size-4 shrink-0" strokeWidth={2.5} />
                {error}
              </p>
            )}
          </div>

          <Button
            type="submit"
            disabled={pending}
            className="bg-teal hover:bg-teal/90 mt-3 h-[2.85rem] w-full rounded-lg text-[0.875rem] font-bold tracking-[0.08em] text-[#06201c] uppercase shadow-[0_0.5rem_1.9rem_-0.4rem_rgb(64_186_169/0.35)]"
          >
            {pending ? "Memeriksa..." : "Masuk Arena"}
            {!pending && <ArrowRight className="size-4" strokeWidth={2.5} />}
          </Button>
        </form>
      </section>
    </main>
  );
}
