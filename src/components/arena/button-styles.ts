import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost";

const BASE =
  "inline-flex items-center justify-center gap-2 rounded-lg text-sm font-bold uppercase tracking-[0.08em] transition-all outline-none focus-visible:ring-2 focus-visible:ring-aqua-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-ink-950 disabled:pointer-events-none disabled:bg-slate-800 disabled:text-mist-400/60 disabled:shadow-none";

const VARIANTS: Record<Variant, string> = {
  primary:
    "bg-aqua-400 text-ink-950 shadow-[0_10px_28px_-10px_rgb(63_184_166/0.7)] hover:bg-aqua-200",
  secondary:
    "border border-line-strong bg-transparent text-aqua-400 hover:border-aqua-400/60 hover:bg-aqua-400/10",
  ghost: "text-aqua-400 hover:bg-aqua-400/10",
};

/** Kelas tombol bergaya Deep Sea Arena. Dipakai untuk <button>, <a>, maupun <Link>. */
export function arenaButton(variant: Variant = "primary", className?: string) {
  return cn(BASE, "px-5 py-3", VARIANTS[variant], className);
}
