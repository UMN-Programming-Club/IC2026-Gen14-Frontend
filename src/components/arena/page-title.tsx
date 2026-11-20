import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Pembungkus isi halaman: margin dan lebar maksimum seragam. */
export function PageContainer({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "mx-auto w-full max-w-[1400px] px-5 py-6 sm:px-8 lg:px-10 lg:py-9",
        className,
      )}
    >
      {children}
    </div>
  );
}

/** Judul display dua warna: bagian pertama putih, bagian kedua teal. */
export function PageTitle({
  white,
  accent,
  joined = false,
  subtitle,
  aside,
}: {
  white: string;
  accent: string;
  /** true = tanpa spasi di antara dua bagian (mis. LEADER + BOARD). */
  joined?: boolean;
  subtitle?: ReactNode;
  /** Elemen di sisi kanan judul (mis. legenda). */
  aside?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-3">
      <div>
        <h1 className="title-display text-5xl sm:text-6xl">
          {white}
          {joined ? "" : " "}
          <span className="text-aqua-400">{accent}</span>
        </h1>
        {subtitle && <p className="mt-3 text-mist-400">{subtitle}</p>}
      </div>
      {aside}
    </div>
  );
}
