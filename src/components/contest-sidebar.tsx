"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Compass,
  FileText,
  House,
  Lock,
  LogOut,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import { StarLogo } from "@/components/brand/star-logo";
import { useContestInfo } from "@/components/contest-context";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useContestQuery } from "@/lib/api-client";
import type { ContestState } from "@/lib/domjudge/types";
import { cn } from "@/lib/utils";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Terkunci sampai contest dimulai. */
  lockedUntilStart?: boolean;
}

/** Satu sumber data nav untuk desktop, tablet (rail), dan mobile (bottom bar). */
const NAV: NavItem[] = [
  { href: "/", label: "Home", icon: House },
  { href: "/scoreboard", label: "Leaderboard", icon: Compass },
  {
    href: "/problems",
    label: "Problemset",
    icon: FileText,
    lockedUntilStart: true,
  },
];

function useLogout() {
  const router = useRouter();
  return async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/login");
    router.refresh();
  };
}

function Avatar({ name, className }: { name: string; className?: string }) {
  return (
    <span
      className={cn(
        "grid shrink-0 place-items-center rounded-lg bg-gradient-to-br from-[#3fbfa9] to-[#0f6b5e] font-bold text-[#06201c]",
        className,
      )}
    >
      {name.trim().charAt(0).toUpperCase() || "?"}
    </span>
  );
}

function NavLink({
  item,
  active,
  locked,
}: {
  item: NavItem;
  active: boolean;
  locked: boolean;
}) {
  const Icon = item.icon;
  const base =
    "relative flex items-center rounded-[0.7rem] transition-colors max-md:flex-col max-md:justify-center max-md:gap-0.5 max-md:px-1 max-md:py-1.5 md:size-[2.6rem] md:justify-center lg:h-[2.3rem] lg:w-full lg:justify-start lg:gap-3 lg:px-3.5";
  const inner = (
    <>
      {active && (
        <span className="bg-teal absolute top-1/2 hidden h-5 w-[0.22rem] -translate-y-1/2 rounded-r-full md:-left-[0.7rem] md:block lg:-left-[0.85rem]" />
      )}
      <Icon className="size-[1.05rem] shrink-0 lg:size-[1.05rem]" />
      <span className="text-[0.7rem] md:hidden lg:inline lg:text-[0.95rem]">
        {item.label}
      </span>
      {locked && (
        <Lock className="size-3.5 shrink-0 max-md:absolute max-md:top-1 max-md:right-3 md:absolute md:right-0.5 md:bottom-0.5 md:size-3 lg:static lg:ml-auto lg:size-[1.05rem]" />
      )}
    </>
  );

  if (locked) {
    return (
      <div
        aria-disabled="true"
        title={`${item.label} (terkunci sampai contest dimulai)`}
        className={cn(base, "cursor-not-allowed text-white/25")}
      >
        {inner}
      </div>
    );
  }
  return (
    <Link
      href={item.href}
      title={item.label}
      aria-current={active ? "page" : undefined}
      className={cn(
        base,
        active
          ? "bg-sidebar-accent max-md:text-teal font-semibold text-white max-md:bg-transparent"
          : "text-muted-foreground hover:text-foreground hover:bg-white/5",
      )}
    >
      {inner}
    </Link>
  );
}

export function ContestSidebar() {
  const { teamName } = useContestInfo();
  const pathname = usePathname();
  const logout = useLogout();
  const state = useContestQuery<ContestState>("state", 15_000);
  // Preview UI-only (development): /?preview=before mengunci Problemset seperti contest belum mulai.
  const preview = useSearchParams().get("preview");
  const previewBefore =
    process.env.NODE_ENV !== "production" && preview === "before";
  const notStarted =
    previewBefore || (state.data ? !state.data.started : false);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <aside
      className={cn(
        "border-sidebar-border bg-sidebar order-last shrink-0 border-t pb-[env(safe-area-inset-bottom)]",
        "md:order-first md:flex md:w-[4.5rem] md:flex-col md:items-center md:border-t-0 md:border-r md:pb-4",
        "lg:w-[12.56rem] lg:items-stretch lg:px-[0.85rem] lg:pb-[1rem]",
      )}
    >
      {/* Logo (tablet: bintang saja; desktop: bintang + teks) */}
      <div className="hidden items-center gap-3 md:flex md:h-[4.5rem] md:justify-center lg:h-auto lg:justify-start lg:px-[0.75rem] lg:pt-[1.4rem]">
        <StarLogo className="size-[1.7rem] lg:size-[1.95rem]" />
        <div className="hidden leading-tight lg:block">
          <p className="text-[1.05rem] font-bold tracking-wide">UMNPC</p>
          <p className="text-muted-foreground text-[0.72rem]">GEN XIV 2026</p>
        </div>
      </div>
      <div className="film-strip mt-[1.1rem] ml-[0.2rem] hidden w-[11.4rem] rounded-l-full lg:block" />

      <nav
        aria-label="Navigasi utama"
        className="grid grid-cols-4 md:mt-4 md:flex md:flex-col md:gap-2 lg:mt-[1.15rem] lg:gap-[0.3rem]"
      >
        {NAV.map((item) => (
          <NavLink
            key={item.href}
            item={item}
            active={isActive(item.href)}
            locked={!!item.lockedUntilStart && notStarted}
          />
        ))}

        {/* Mobile: Akun (popover) */}
        <Popover>
          <PopoverTrigger
            className="text-muted-foreground data-popup-open:text-teal flex flex-col items-center justify-center gap-0.5 px-1 py-1.5 outline-none md:hidden"
            aria-label="Akun"
          >
            <UserRound className="size-[1.05rem]" />
            <span className="text-[0.7rem]">Akun</span>
          </PopoverTrigger>
          <PopoverContent side="top" align="end" className="w-56">
            <div className="flex items-center gap-3">
              <Avatar name={teamName} className="size-9 text-sm" />
              <div className="min-w-0 leading-tight">
                <p className="truncate text-sm font-semibold">{teamName}</p>
                <p className="text-muted-foreground text-xs">Peserta</p>
              </div>
            </div>
            <button
              type="button"
              onClick={logout}
              className="border-line text-foreground flex h-9 items-center justify-center gap-2 rounded-lg border text-sm font-medium hover:bg-white/5"
            >
              <LogOut className="size-4" />
              Keluar
            </button>
          </PopoverContent>
        </Popover>
      </nav>

      {/* Kartu tim (tablet: avatar + keluar; desktop: kartu penuh) */}
      <div className="mt-auto hidden md:block md:w-full lg:w-auto">
        <div className="lg:border-line lg:bg-surface flex flex-col items-center gap-2 md:pb-0 lg:flex-row lg:gap-[0.65rem] lg:rounded-[0.8rem] lg:border lg:p-[0.6rem]">
          <Avatar
            name={teamName}
            className="size-[2.1rem] text-sm lg:size-[2.25rem] lg:text-base"
          />
          <div className="hidden min-w-0 flex-1 leading-tight lg:block">
            <p className="truncate text-[0.82rem] font-semibold">{teamName}</p>
            <p className="text-muted-foreground mt-0.5 text-[0.7rem]">
              Peserta
            </p>
          </div>
          <button
            type="button"
            onClick={logout}
            title="Keluar"
            aria-label="Keluar"
            className="text-muted-foreground hover:text-foreground grid size-8 place-items-center rounded-lg hover:bg-white/5 lg:size-7"
          >
            <LogOut className="size-[1.05rem]" />
          </button>
        </div>
      </div>
    </aside>
  );
}
