// Media partner & sponsor di footer halaman Home.
// Data di bawah masih placeholder dari desain. Ganti dengan sponsor sebenarnya.
export interface Sponsor {
  name: string;
  /** 2-3 huruf untuk avatar bulat (sampai logo asli tersedia). */
  initials: string;
  /** Warna latar avatar. */
  color: string;
}

export const SPONSORS: Sponsor[] = [
  { name: "Game Dev Club", initials: "GDC", color: "#0f5c53" },
  { name: "Art Works", initials: "AW", color: "#8e1b1b" },
  { name: "UMN Sports", initials: "USC", color: "#0b3b36" },
  { name: "Career Dev. Centre", initials: "CDC", color: "#1d6fe0" },
  { name: "Sari Roti", initials: "SR", color: "#d1452a" },
];
