import { cn } from "@/lib/utils";

/** Logo bintang empat sudut UMNPC (emas, titik tengah teal). */
export function StarLogo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      className={cn("size-8", className)}
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M32 2 C34 20 44 30 62 32 C44 34 34 44 32 62 C30 44 20 34 2 32 C20 30 30 20 32 2 Z"
        stroke="#c9a45c"
        strokeWidth="3"
        strokeLinejoin="round"
        fill="#0a1112"
      />
      <path
        d="M32 12 C33 24 40 31 52 32 C40 33 33 40 32 52 C31 40 24 33 12 32 C24 31 31 24 32 12 Z"
        fill="#c9a45c"
        fillOpacity="0.9"
      />
      <circle cx="32" cy="32" r="6.5" fill="#0d3d3a" />
      <circle cx="32" cy="32" r="3.2" fill="#40baa9" />
    </svg>
  );
}
