import Image from "next/image";
import { cn } from "@/lib/utils";

/** Simbol Internal Contest UMNPC Gen XIV (bintang emas, tanpa teks). */
export function StarLogo({ className }: { className?: string }) {
  return (
    <Image
      src="/logo/ic14-mark.png"
      alt=""
      aria-hidden
      width={512}
      height={512}
      priority
      className={cn("size-8 shrink-0 object-contain", className)}
    />
  );
}
