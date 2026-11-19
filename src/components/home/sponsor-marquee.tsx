import { cn } from "@/lib/utils";

interface Sponsor {
  code: string;
  name: string;
  /** Warna lingkaran placeholder inisial (logo asli belum tersedia). */
  color: string;
}

const SPONSORS: Sponsor[] = [
  { code: "GDC", name: "Game Dev Club", color: "#0e5a52" },
  { code: "AW", name: "Art Works", color: "#8c1a1a" },
  { code: "USC", name: "UMN Sports", color: "#0d3d3a" },
  { code: "CDC", name: "Career Dev. Centre", color: "#1a6ae8" },
  { code: "SR", name: "Sari Roti", color: "#cf4125" },
];

function SponsorCard({ s }: { s: Sponsor }) {
  return (
    <div className="flex h-[2.7rem] w-[9rem] shrink-0 items-center gap-2.5 rounded-lg bg-[#e0ece9] px-3 shadow-sm lg:h-[3.6rem] lg:w-[11.05rem] lg:gap-3 lg:rounded-[0.6rem] lg:px-4">
      <span
        className="grid size-[1.7rem] shrink-0 place-items-center rounded-full text-[0.55rem] font-bold text-white lg:size-[2.15rem] lg:text-[0.72rem]"
        style={{ backgroundColor: s.color }}
        aria-hidden="true"
      >
        {s.code}
      </span>
      <span className="truncate text-[0.75rem] font-medium text-[#0d2a27] lg:text-[0.9rem]">
        {s.name}
      </span>
    </div>
  );
}

/**
 * Footer sponsor. Label dan strip emas diam; hanya deretan kartu yang bergerak kanan ke kiri.
 * Daftar diduplikasi (2 salinan per setengah track) lalu digeser -50%, jadi loop mulus tanpa lompatan.
 */
export function SponsorMarquee({ className }: { className?: string }) {
  const half = [...SPONSORS, ...SPONSORS];
  return (
    <footer
      className={cn(
        "border-line shrink-0 border-t px-4 pt-3 pb-3 lg:px-[2.1rem] lg:pt-[0.7rem] lg:pb-[0.85rem]",
        className,
      )}
    >
      <div className="flex items-center gap-3 lg:gap-[1.35rem]">
        <span className="bg-gold shrink-0 -skew-x-6 rounded-[0.3rem] px-3 py-1 text-[0.6rem] font-bold tracking-[0.08em] text-[#2a1f08] uppercase italic lg:px-[1.1rem] lg:py-[0.08rem] lg:text-[0.7rem]">
          Media Partner &amp; Sponsor
        </span>
        <div className="film-strip film-strip-footer h-2 flex-1" />
        <span className="text-muted-foreground hidden shrink-0 text-[0.68rem] tracking-[0.08em] uppercase md:inline lg:text-[0.72rem]">
          UMN Programming Club · Internal Contest Gen XIV 2026
        </span>
      </div>
      <div
        className="marquee mt-2.5 overflow-hidden lg:mt-[0.6rem]"
        style={{
          maskImage:
            "linear-gradient(to right, transparent 0, #000 5%, #000 95%, transparent 100%)",
        }}
      >
        <div className="marquee-track flex">
          {[0, 1].map((copy) => (
            <div
              key={copy}
              className="flex shrink-0 gap-3 pr-3 lg:gap-[0.85rem] lg:pr-[0.85rem]"
              aria-hidden={copy === 1}
            >
              {half.map((s, i) => (
                <SponsorCard key={`${copy}-${i}`} s={s} />
              ))}
            </div>
          ))}
        </div>
      </div>
    </footer>
  );
}
