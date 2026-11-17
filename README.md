# UMNPC Internal Contest: Frontend

Frontend peserta untuk UMNPC Internal Contest, dibangun dengan **Next.js 16 (App Router) + Tailwind CSS v4 + shadcn/ui**.
Backend-nya adalah **DOMjudge 9.0.0** (repo terpisah, folder `backend/`). Frontend ini hanya berbicara dengan
DOMjudge lewat REST API-nya (`/api/v4`, standar ICPC Contest API).

## Arsitektur

```
Browser ──(cookie session)──> Next.js Route Handlers (BFF) ──(Basic Auth)──> DOMjudge /api/v4
```

- **Browser tidak pernah memanggil DOMjudge langsung.** Semua request lewat route handler Next.js di `src/app/api/*`.
  Akibatnya CORS di DOMjudge **tidak perlu diatur**.
- **Login.** DOMjudge hanya mendukung HTTP Basic Auth (tidak ada token). Saat login, server memanggil `GET /api/v4/user`
  dengan kredensial tersebut. Bila valid dan akun terhubung ke sebuah **tim**, kredensial disimpan di cookie session
  terenkripsi dan `httpOnly` (`iron-session`), bukan di `localStorage`. Akun tanpa tim (mis. `admin`) ditolak.
- **Proxy GET dengan whitelist.** `src/app/api/contest/[...path]/route.ts` hanya meneruskan endpoint contest yang
  diizinkan (scoreboard, problems, submissions, dst.). Segmen path divalidasi, dan contest selalu di-resolve di server
  dari `DOMJUDGE_CONTEST_ID` (browser tidak bisa memilih contest lain).
- **Hak akses sebenarnya ditegakkan DOMjudge.** Tim hanya bisa melihat submission miliknya sendiri, dsb.

## Prasyarat

- **Node.js 22 LTS** (minimal 20.9, syarat Next.js 16) dan npm.
- **Salah satu** dari:
  - **Mode mock** (tanpa backend): cocok untuk mengerjakan tampilan. Lihat [Mode mock](#mode-mock-tanpa-backend).
  - **Backend DOMjudge** yang sudah berjalan, dengan sebuah **contest** yang `id` atau `shortname`-nya sama dengan
    `DOMJUDGE_CONTEST_ID`, dan **akun tim** (user ber-role `team` yang terhubung ke sebuah tim) untuk login.

Panduan menjalankan backend ada di `BACKEND_SETUP.md` di repo backend (butuh Linux; di Windows pakai WSL2).
Pada WSL2, DOMjudge yang berjalan di `http://localhost/domjudge` bisa diakses dari Windows lewat `localhost`.

## Menjalankan

```bash
npm install
cp .env.example .env.local     # lalu isi nilainya (lihat tabel di bawah)
npm run dev                    # http://localhost:3000
```

## Mode mock (tanpa backend)

Untuk mengerjakan desain tanpa DOMjudge, isi `.env.local` seperti ini:

```
DOMJUDGE_MOCK=true
DOMJUDGE_URL=
DOMJUDGE_CONTEST_ID=IC2026
SESSION_SECRET=<string acak minimal 32 karakter>
```

Lalu `npm run dev`. Seluruh data berasal dari `src/lib/mock/`, tanpa koneksi jaringan ke DOMjudge. Halaman dan route handler
**tidak berubah**; hanya lapisan terbawah (`src/lib/domjudge/client.ts`) yang mengalihkan request ke mock.
Banner kuning "MODE MOCK" tampil di semua halaman supaya data palsu tidak tertukar dengan yang sungguhan.

**Akun demo**

| Login             | Hasil                                               |
| ----------------- | --------------------------------------------------- |
| username apa saja | Masuk sebagai **Tim Demo** (password bebas)         |
| username `admin`  | Ditolak: akun tanpa tim (menguji pesan error 403)   |
| password `salah`  | Ditolak: kredensial salah (menguji pesan error 401) |

**Data yang tersedia**: 1 contest (`IC2026`, sedang berjalan sekitar 1 jam dari 5 jam), 5 soal, 8 tim, 5 bahasa, dan seed submission
yang mencakup berbagai kondisi: selesai (AC), salah dengan penalti (WA, TLE, RTE), compiler error tanpa penalti (CE), dan satu
submission yang **menunggu terus** (untuk menguji tampilan "pending"). Scoreboard dihitung dengan aturan DOMjudge (penalti 20 menit).

**Submit bekerja** dan tersimpan di memori server (hilang saat dev server di-restart). Submission baru berstatus
"menunggu" selama beberapa detik, lalu verdict-nya keluar dan scoreboard ikut berubah. Verdict diberikan bergantian
(AC, WA, TLE, AC, CE, RTE, MLE). Untuk memaksa verdict tertentu, tulis `mock:WA` (atau `AC`, `TLE`, `RTE`, `CE`, `MLE`, `OLE`, `NO`)
di dalam file kode, misalnya sebagai komentar.

**Perbedaan dengan DOMjudge sungguhan**

- Statement soal berupa **HTML**, bukan PDF.
- Halaman clarifications belum ada di frontend, jadi endpoint-nya hanya mengembalikan daftar kosong.
- Hanya satu tim yang bisa login (Tim Demo); tim lain hanya muncul di scoreboard.
- Scoreboard tidak pernah dibekukan (freeze).
- Perubahan `DOMJUDGE_MOCK` pada build produksi butuh **build ulang** (nilainya ikut tertanam pada halaman statis).

> **Mode mock hanya untuk pengembangan atau preview desain.** Mode ini menerima login apa saja. Jangan aktifkan untuk contest
> sungguhan. Mode ini tidak aktif kecuali `DOMJUDGE_MOCK=true` ditulis eksplisit. Bila `DOMJUDGE_URL` kosong tanpa itu, aplikasi
> berhenti dengan pesan error (tidak diam-diam memakai data palsu).

### Environment variable

Semuanya **server-only** (tidak pernah dikirim ke browser). Divalidasi dengan zod di `src/lib/env.ts`;
aplikasi gagal start dengan pesan jelas bila ada yang salah.

| Variabel              | Contoh                         | Keterangan                                                                                      |
| --------------------- | ------------------------------ | ----------------------------------------------------------------------------------------------- |
| `DOMJUDGE_MOCK`       | `false` (bawaan)               | `true` = mode mock, tanpa backend. Lihat bagian Mode mock.                                      |
| `DOMJUDGE_URL`        | `http://localhost/domjudge`    | Base URL DOMjudge, tanpa `/` di akhir dan tanpa `/api/v4`. Wajib, kecuali `DOMJUDGE_MOCK=true`. |
| `DOMJUDGE_CONTEST_ID` | `IC2026`                       | `id` **atau** `shortname` contest di DOMjudge.                                                  |
| `SESSION_SECRET`      | (string acak, minimal 32 char) | Kunci enkripsi cookie. Buat dengan `openssl rand -hex 32`.                                      |

> Jangan commit `.env.local`. Hanya `.env.example` yang boleh masuk git.

## Script

| Perintah            | Fungsi                                                                      |
| ------------------- | --------------------------------------------------------------------------- |
| `npm run dev`       | Dev server (Turbopack).                                                     |
| `npm run build`     | Build produksi (juga memvalidasi aturan Cache Components, lihat di bawah).  |
| `npm run start`     | Jalankan hasil build.                                                       |
| `npm run lint`      | ESLint.                                                                     |
| `npm run typecheck` | `tsc --noEmit`.                                                             |
| `npm run format`    | Prettier (+ urutan class Tailwind) untuk `src/`.                            |
| `npm run gen:api`   | Generate ulang tipe API dari spec OpenAPI DOMjudge (butuh backend menyala). |

### Memperbarui tipe API

`src/lib/domjudge/schema.d.ts` dibuat otomatis dari `http://localhost/domjudge/api/doc.json`
(`openapi-typescript`). **Jangan diedit manual.** Jalankan `npm run gen:api` bila versi DOMjudge berubah. Bila
backend ada di alamat lain, ubah URL pada script `gen:api` di `package.json`.

Respons `/judgements` tidak ada di spec OpenAPI DOMjudge, jadi tipenya ditulis manual di
`src/lib/domjudge/types.ts`.

## Struktur proyek

```
src/
  proxy.ts                         # gerbang ringan: tanpa cookie session -> /login (halaman) / 401 (API)
  app/
    layout.tsx                     # root layout + <Providers>
    (auth)/login/page.tsx          # halaman login
    (contest)/layout.tsx           # baca session + resolve contest, lalu render header (di dalam <Suspense>)
    (contest)/page.tsx             # ringkasan: status contest, peringkat tim
    (contest)/problems/            # daftar soal, detail soal (PDF statement + form submit)
    (contest)/submissions/         # submission tim + verdict (polling 5 detik)
    (contest)/scoreboard/          # scoreboard (polling 15 detik)
    api/auth/{login,logout}/       # BFF: login/logout
    api/contest/[...path]/         # BFF: proxy GET (whitelist) ke DOMjudge
    api/submit/                    # BFF: upload kode (multipart) ke DOMjudge
  components/
    ui/                            # komponen shadcn (Base UI)
    contest-header.tsx             # navigasi, countdown, tombol keluar
    contest-context.tsx            # info contest + tim untuk client component
    mock-banner.tsx                # banner kuning "MODE MOCK" (hanya tampil bila DOMJUDGE_MOCK=true)
    providers.tsx                  # TanStack Query + toast; redirect ke /login saat 401
  lib/
    env.ts, session.ts             # env tervalidasi, konfigurasi iron-session
    api-client.ts                  # sisi client: getJson + hook useContestQuery
    domjudge/
      client.ts                    # sisi server: client openapi-fetch + Basic Auth dari session
      contest.ts                   # resolveContest(): cocokkan id ATAU shortname, error jelas bila tak ada
      schema.d.ts                  # HASIL GENERATE
      types.ts                     # alias tipe (+ tipe Judgement manual)
    mock/                          # mode mock (DOMJUDGE_MOCK=true), meniru DOMjudge /api/v4
      data.ts                      # tim, soal, bahasa, verdict, seed submission, statement contoh
      state.ts                     # state in-memory + perhitungan scoreboard
      router.ts                    # pengganti `fetch` ke DOMjudge (login, GET, submit)
```

## Catatan untuk developer

- **Next.js 16 punya perubahan besar** dibanding versi lama. Baca `AGENTS.md` dan dokumentasi bawaan di
  `node_modules/next/dist/docs/` sebelum menulis kode. Dua hal yang paling terasa:
  - `middleware.ts` diganti menjadi **`proxy.ts`** (fungsi bernama `proxy`).
  - **Cache Components aktif** (`cacheComponents: true`). Kode yang membaca data runtime (cookie, `fetch` ke DOMjudge)
    di server component **harus di dalam `<Suspense>`**. Lihat `src/app/(contest)/layout.tsx`. Halaman contest sendiri
    adalah client component yang mengambil data lewat `useContestQuery`.
- **shadcn di proyek ini memakai Base UI**, bukan Radix. Untuk membungkus elemen lain, pakai prop `render`
  (bukan `asChild`), mis. `<Button render={<Link href="/x" />} nativeButton={false}>`.
- Tambah komponen UI: `npx shadcn@latest add <nama>`.
- Menambah endpoint baru yang ingin diakses browser: tambahkan segmen pertamanya ke `ALLOWED_ROOTS` di
  `src/app/api/contest/[...path]/route.ts`.
- Semua teks antarmuka berbahasa Indonesia.
- Bila mengubah bentuk data yang dibaca frontend (field baru di scoreboard, submission, dst.), perbarui juga
  `src/lib/mock/` agar mode mock tetap mewakili DOMjudge sungguhan.

## Mengerjakan desain

Tampilan saat ini sengaja netral. Untuk branch desain, bagian yang aman diubah:

- `src/app/**/page.tsx`, `src/components/**`, `src/app/globals.css` (token warna/tema), dan font di `layout.tsx`.

Hindari mengubah logika di `src/lib/**`, `src/proxy.ts`, dan `src/app/api/**` kecuali memang perlu. Di sanalah
autentikasi dan pembatasan akses berada.

## Deploy

- Butuh **server Node** (mis. Vercel atau VPS), bukan static export, karena ada route handler dan cookie session.
- Set tiga environment variable di atas pada platform deploy. `SESSION_SECRET` untuk produksi harus berbeda dari lokal.
- **DOMjudge wajib diakses lewat HTTPS** dari server Next.js, karena kredensial tim dikirim lewat Basic Auth.
  Contoh: `DOMJUDGE_URL=https://contest.example.com/domjudge`.
- Cookie session otomatis `secure` saat `NODE_ENV=production`, jadi situs harus dilayani lewat HTTPS.

## Status

Sudah ada: login/logout, ringkasan contest, daftar soal + statement PDF, submit kode (upload file), submission tim
dengan verdict, scoreboard.

Sudah diuji manual end-to-end terhadap DOMjudge 9.0.0 + judgehost lokal (WSL2): login tim, submit, dan verdict di
halaman Submission untuk C, C++, Java, Python 3, dan Go.

Belum diuji: scoreboard dengan banyak tim / saat freeze, dan login dengan akun yang bukan tim (harus ditolak).

Belum / rencana:

- Halaman **clarifications** (tanya-jawab dengan juri).
- Editor kode di browser (paket CodeMirror sudah terpasang, belum dipakai).
- Desain akhir.

## Pemecahan masalah

| Gejala                                           | Penyebab / solusi                                                                                                                  |
| ------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------- |
| "Konfigurasi environment tidak valid" saat start | `.env.local` belum dibuat atau `SESSION_SECRET` < 32 karakter.                                                                     |
| Login: "Server contest tidak dapat dihubungi"    | DOMjudge mati atau `DOMJUDGE_URL` salah. Cek `curl $DOMJUDGE_URL/api/v4/info`. Di WSL: `systemctl start nginx php8.3-fpm mariadb`. |
| Login: "Akun ini tidak terhubung ke sebuah tim"  | Login dengan akun tim, bukan `admin`. Buat user ber-role `team` yang terhubung ke tim di Jury → Users.                             |
| "Contest ... tidak ditemukan di DOMjudge"        | `DOMJUDGE_CONTEST_ID` tidak cocok dengan `id`/`shortname` contest, atau akun belum punya akses ke contest itu.                     |
| Scoreboard kosong                                | Tim belum ditambahkan ke contest (Jury → Contests → tim), atau contest belum dimulai.                                              |
| Submission selalu "Menunggu / diproses"          | Judgehost belum berjalan (`judgedaemon`). Cek Jury → Judgehosts.                                                                   |
