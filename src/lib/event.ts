// Identitas acara untuk elemen dekoratif (halaman login, sidebar, footer).
// Ubah di sini bila generasi, tanggal, atau lokasi berganti.
export const EVENT = {
  club: "UMN Programming Club",
  clubShort: "UMNPC",
  name: "Internal Contest",
  generation: "GEN XIV",
  year: 2026,
  /** Dipakai di halaman login (sebelum ada data contest). */
  dateLabel: "28 November 2026",
  location: "UMN, Kantin Gedung C",
  /**
   * Jumlah soal untuk kartu "Jumlah soal" di Home sebelum contest dimulai. DOMjudge menyembunyikan
   * daftar soal dari tim sebelum mulai, jadi angkanya tidak bisa dibaca dari API. Sesuaikan manual.
   */
  problemCount: 6,
} as const;
