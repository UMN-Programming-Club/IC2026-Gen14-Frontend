import { cn } from "@/lib/utils";

/** Lambang bintang empat arah (brass) dengan titik teal di tengah. */
export function StarMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 48 48"
      aria-hidden="true"
      fill="none"
      className={className}
    >
      <path
        d="M24 2 L28.6 19.4 L46 24 L28.6 28.6 L24 46 L19.4 28.6 L2 24 L19.4 19.4 Z"
        className="stroke-brass-400"
        fill="rgb(201 164 92 / 0.12)"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <circle
        cx="24"
        cy="24"
        r="8"
        className="stroke-aqua-400/30"
        strokeWidth="1.5"
      />
      <circle cx="24" cy="24" r="4.5" className="fill-aqua-400" />
    </svg>
  );
}

/** Deretan kotak kecil memudar (dekorasi di bawah logo dan di footer sponsor). */
export function PixelStrip({
  count = 13,
  className,
}: {
  count?: number;
  className?: string;
}) {
  return (
    <div
      aria-hidden="true"
      className={cn("flex items-center gap-[5px]", className)}
    >
      {Array.from({ length: count }, (_, i) => (
        <span
          key={i}
          className="bg-brass-400 h-[7px] w-[7px] rounded-[1px]"
          style={{ opacity: Math.max(0.06, 0.55 - (i / count) * 0.55) }}
        />
      ))}
    </div>
  );
}
