import { PixelStrip } from "@/components/arena/logo";
import { EVENT } from "@/lib/event";
import { SPONSORS } from "@/lib/sponsors";

function SponsorCard({ name, initials, color }: (typeof SPONSORS)[number]) {
  return (
    <li className="text-ink-950 flex w-72 shrink-0 items-center gap-3 rounded-xl bg-[#e1ece9] px-4 py-3.5">
      <span
        aria-hidden="true"
        className="flex size-10 shrink-0 items-center justify-center rounded-full text-[0.7rem] font-extrabold text-white"
        style={{ backgroundColor: color }}
      >
        {initials}
      </span>
      <span className="truncate text-sm font-semibold">{name}</span>
    </li>
  );
}

/** Footer "Media Partner & Sponsor" (hanya di Home). Berjalan otomatis, berhenti bila reduced-motion. */
export function SponsorBar() {
  // Daftar digandakan agar putaran marquee tidak putus.
  const loop = [...SPONSORS, ...SPONSORS, ...SPONSORS, ...SPONSORS];
  return (
    <footer className="border-line bg-ink-950/60 border-t px-5 pt-5 pb-6 sm:px-8 lg:px-10">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <span className="bg-brass-400 text-ink-950 rounded-md px-3 py-1.5 text-xs font-extrabold tracking-wider uppercase italic">
          Media Partner &amp; Sponsor
        </span>
        <PixelStrip count={36} className="hidden flex-1 sm:flex" />
        <p className="ml-auto text-xs tracking-wider text-mist-400 uppercase">
          {EVENT.club} · {EVENT.name} {EVENT.generation} {EVENT.year}
        </p>
      </div>

      <div className="mt-4 overflow-hidden mask-[linear-gradient(to_right,transparent,black_6%,black_94%,transparent)]">
        <ul className="animate-marquee flex w-max gap-4 hover:[animation-play-state:paused]">
          {loop.map((s, i) => (
            <SponsorCard key={i} {...s} />
          ))}
        </ul>
      </div>
    </footer>
  );
}
