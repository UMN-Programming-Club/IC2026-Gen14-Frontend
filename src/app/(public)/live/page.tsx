import type { Metadata } from "next";
import { LiveBoard } from "@/components/leaderboard/live-board";

export const metadata: Metadata = {
  title: "Leaderboard Live | UMNPC Internal Contest",
  // Halaman ini terbuka tanpa login; jangan diindeks mesin pencari.
  robots: { index: false, follow: false },
};

export default function LivePage() {
  return <LiveBoard />;
}
