import { Compass, FileText, House, type LucideIcon } from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Aktif hanya bila path persis sama (untuk "/"). */
  exact?: boolean;
  /** Terkunci (ikon gembok) sebelum contest dimulai. */
  lockedBeforeStart?: boolean;
}

export const NAV: NavItem[] = [
  { href: "/", label: "Home", icon: House, exact: true },
  { href: "/leaderboard", label: "Leaderboard", icon: Compass },
  {
    href: "/problems",
    label: "Problemset",
    icon: FileText,
    lockedBeforeStart: true,
  },
];

export function isActive(item: NavItem, pathname: string): boolean {
  return item.exact ? pathname === item.href : pathname.startsWith(item.href);
}
