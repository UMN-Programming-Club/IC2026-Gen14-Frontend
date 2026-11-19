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
DOMJUDGE_MOCK_SCENARIO=running   # before | soon | unscheduled | running | ending | ended
DOMJUDGE_URL=
DOMJUDGE_CONTEST_ID=IC2026
SESSION_SECRET=<string acak minimal 32 karakter>
```

**Skenario** (`DOMJUDGE_MOCK_SCENARIO`, restart dev server setelah mengubahnya) memilih keadaan contest yang disimulasikan,
sehingga ketiga tampilan Home bisa dirancang tanpa menunggu waktu sungguhan:

| Nilai              | Keadaan                                                                                       |
| ------------------ | --------------------------------------------------------------------------------------------- |
| `running` (bawaan) | Contest berjalan 2 jam 14 menit dari 3 jam, ada submission dan satu yang masih _pending_.     |
| `before`           | Contest mulai sekitar 8 hari lagi. Problemset terkunci, soal dan submission kosong.           |
| `unscheduled`      | Contest sudah di-activate tetapi **start time kosong**. Tanpa hitung mundur, menunggu jadwal. |
| `ended`            | Contest sudah selesai. Submission ditolak, Home menampilkan hasil akhir.                      |

Skenario `soon` memulai contest ~25 detik setelah server jalan (menguji peralihan otomatis dari "belum mulai" ke "berlangsung").
Skenario `ending` membekukan scoreboard ~25 detik dan mengakhiri contest ~50 detik setelah server jalan.

### Perpindahan fase (start, freeze, end)

`ContestClockProvider` (`src/components/arena/contest-clock.tsx`) adalah satu-satunya jam contest. Jam dihitung dari jam
**DOMjudge** (header `Date` dari responsnya, lewat `/api/clock` dan BFF), bukan jam perangkat dan bukan jam mesin Next.
Ini penting: mesin DOMjudge (mis. WSL, yang jamnya sering tertinggal beberapa detik dari Windows) yang menentukan
kapan fase berganti. Header `Date` beresolusi 1 detik, jadi saat dibuka halaman mencari tepi pergantian detiknya dengan
sampling rapat (~100 ms) dan menyempitkan estimasinya dari setiap respons berikutnya. Untuk mensimulasikannya di mock:
`DOMJUDGE_MOCK_CLOCK_LAG_SEC=5`. Tiap batas waktu (mulai, freeze = akhir dikurangi
`scoreboard_freeze_duration`, selesai) punya timer tepat; setelah batas lewat, `/state` diambil berulang cepat sampai
DOMjudge ikut berubah, lalu seluruh data (soal, scoreboard, submission) disegarkan. Perubahan manual juri (start now,
freeze now) tertangkap oleh poll `/state` (5 detik). Tetap disarankan menyinkronkan jam mesin DOMjudge (NTP), karena jam itu juga yang dipakai
untuk waktu submission dan skor.

Pada skenario `before`, `soon` dan `unscheduled`, mock meniru DOMjudge asli: untuk akun tim, contest **disembunyikan dari
`/contests` dan `/contests/{id}`** sampai start time lewat, dan `/contests/{id}/state` berisi `null` semua. Hanya akun
ber-role API reader (di mock: username `reader`) yang boleh melihatnya.

### Sebelum contest dimulai (DOMjudge asli)

DOMjudge **tidak memberi waktu mulai ke akun tim** sebelum contest berjalan. Karena itu ada dua mode:

- **Tanpa konfigurasi tambahan**: peserta tetap bisa login dan melihat Home "Menunggu jadwal mulai" (tanpa hitung mundur).
  Begitu contest mulai, halaman memuat ulang sendiri.
- **Dengan akun pembaca** (disarankan): buat user DOMjudge ber-role **API reader** (tanpa tim), lalu isi
  `DOMJUDGE_READER_USER` dan `DOMJUDGE_READER_PASSWORD`. Akun ini hanya dipakai server untuk membaca metadata contest
  (nama dan waktu mulai), sehingga hitung mundur akurat. Jangan memakai akun jury/admin.

Lalu `npm run dev`. Seluruh data berasal dari `src/lib/mock/`, tanpa koneksi jaringan ke DOMjudge. Halaman dan route handler
**tidak berubah**; hanya lapisan terbawah (`src/lib/domjudge/client.ts`) yang mengalihkan request ke mock.
Banner kuning "MODE MOCK" tampil di semua halaman supaya data palsu tidak tertukar dengan yang sungguhan.

**Akun demo**

| Login             | Hasil                                                                                |
| ----------------- | ------------------------------------------------------------------------------------ |
| username apa saja | Masuk sebagai tim **Alpha** (password bebas), punya submission                       |
| username `baru`   | Masuk sebagai tim **Newbie**, belum punya submission (untuk tampilan keadaan kosong) |
| username `admin`  | Ditolak: akun tanpa tim (menguji pesan error 403)                                    |
| password `salah`  | Ditolak: kredensial salah (menguji pesan error 401)                                  |

**Data yang tersedia**: 1 contest (`IC2026`, durasi 3 jam), 6 soal (`IC1`-`IC6`), 9 tim, 5 bahasa, dan seed submission
yang mencakup semua kondisi sel leaderboard: first solve, AC, AC setelah salah (`+N`), hanya salah (`-N`), dan satu
submission yang **menunggu terus** (untuk menguji tampilan "pending"). Scoreboard dihitung dengan aturan DOMjudge (penalti 20 menit).

**Submit bekerja** dan tersimpan di memori server (hilang saat dev server di-restart). Submission baru berstatus
"menunggu" selama beberapa detik, lalu verdict-nya keluar dan scoreboard ikut berubah. Verdict diberikan bergantian
(AC, WA, TLE, AC, CE, RTE, MLE). Untuk memaksa verdict tertentu, tulis `mock:WA` (atau `AC`, `TLE`, `RTE`, `CE`, `MLE`, `OLE`, `NO`)
di dalam file kode, misalnya sebagai komentar.

**Perbedaan dengan DOMjudge sungguhan**

- Statement soal berupa **HTML**, bukan PDF.
- Halaman clarifications belum ada di frontend, jadi endpoint-nya hanya mengembalikan daftar kosong.
- Hanya dua tim yang bisa login (Alpha dan Newbie); tim lain hanya muncul di leaderboard.
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
| `DOMJUDGE_CONTEST_ID` | `IC2026`                       | `id` (External ID) **atau** `shortname` contest.                                                |
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
    (auth)/login/page.tsx          # halaman login (layout terbelah)
    (contest)/layout.tsx           # baca session + resolve contest, lalu render <AppShell> (di dalam <Suspense>)
    (contest)/page.tsx             # Home: 3 keadaan (sebelum mulai, berlangsung, selesai)
    (contest)/leaderboard/         # klasemen (polling 15 detik)
    (contest)/problems/            # layout = daftar soal; [id] = tab Info soal / Kirim solusi
    api/auth/{login,logout}/       # BFF: login/logout
    api/contest/[...path]/         # BFF: proxy GET (whitelist) ke DOMjudge
    api/submit/                    # BFF: upload kode (multipart) ke DOMjudge
  components/
    ui/                            # komponen shadcn (Base UI); belum dipakai oleh tampilan Deep Sea Arena
    arena/                         # komponen tampilan Deep Sea Arena
      app-shell.tsx, sidebar.tsx, topbar.tsx, nav.ts   # rangka halaman: sidebar, status bar, navigasi mobile
      contest-clock.tsx            # hook useContestClock(): fase contest (before/running/ended) + hitung mundur
      sponsor-bar.tsx, logo.tsx    # footer sponsor (marquee), lambang bintang, dekorasi kotak
      verdict-badge.tsx, button-styles.ts, page-title.tsx
    contest-context.tsx            # info contest + tim untuk client component
    mock-banner.tsx                # banner kuning "MODE MOCK" (hanya tampil bila DOMJUDGE_MOCK=true)
    providers.tsx                  # TanStack Query + toast; redirect ke /login saat 401
  lib/
    env.ts, session.ts             # env tervalidasi, konfigurasi iron-session
    api-client.ts                  # sisi client: getJson + hook useContestQuery
    event.ts, sponsors.ts          # identitas acara (GEN, tanggal, lokasi, jumlah soal) dan daftar sponsor
    format.ts, contest-status.ts   # format waktu/angka, status sel scoreboard
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

Tampilan mengikuti **Deep Sea Arena**. Acuannya ada di `DESIGN_REF/` (style guide, login, Home 3 keadaan,
leaderboard, problemset).

- **Warna**: token ada di `src/app/globals.css` (blok `@theme`) dengan nama persis seperti style guide: `ink-950`,
  `ink-900`, `slate-800`, `teal-600`, `aqua-400`, `aqua-200`, `foam-50`, `mist-400`, `maroon-700`, `brass-400`. Pakai
  sebagai kelas Tailwind (`bg-ink-950`, `text-aqua-400`, ...). Status verdict: `ok`, `wa`, `tle`, `pending`.
  Catatan: `slate-800` dan `teal-600` menimpa warna bawaan Tailwind.
- **Font** (dimuat di `layout.tsx`): Barlow Condensed 800 miring untuk judul (`title-display`), Plus Jakarta Sans untuk
  isi dan heading, JetBrains Mono untuk timer dan angka (`font-mono`).
- **Utilitas**: `title-display` (judul besar), `eyebrow` (label kecil kapital), `panel`, `bg-arena` (latar bergradasi + kisi titik).
- **Tema tunggal (gelap)**. Token shadcn dipetakan ke palet yang sama, jadi komponen di `components/ui` ikut selaras.
- **Data dekoratif** diubah di `src/lib/event.ts` (GEN, tanggal, lokasi, jumlah soal) dan `src/lib/sponsors.ts` (sponsor;
  isinya masih placeholder dari desain, belum ada logo asli).
- **Label soal** di desain adalah `IC1`...`IC6`. Label ini diambil dari field `label` soal di DOMjudge, jadi isi
  _short name_ soal di DOMjudge dengan `IC1`, `IC2`, dst.
- **Batas memori** pada desain "Info soal" belum ditampilkan karena API contest DOMjudge tidak menyediakannya. Kartu
  tersebut diganti daftar bahasa yang diterima.
- Cara melihat tiga keadaan Home: lihat skenario di bagian [Mode mock](#mode-mock-tanpa-backend).

Hindari mengubah logika di `src/lib/domjudge/**`, `src/proxy.ts`, dan `src/app/api/**` kecuali memang perlu. Di sanalah
autentikasi dan pembatasan akses berada.

## Deploy

- Butuh **server Node** (mis. Vercel atau VPS), bukan static export, karena ada route handler dan cookie session.
- Set tiga environment variable di atas pada platform deploy. `SESSION_SECRET` untuk produksi harus berbeda dari lokal.
- **DOMjudge wajib diakses lewat HTTPS** dari server Next.js, karena kredensial tim dikirim lewat Basic Auth.
  Contoh: `DOMJUDGE_URL=https://contest.example.com/domjudge`.
- Cookie session otomatis `secure` saat `NODE_ENV=production`, jadi situs harus dilayani lewat HTTPS.

## Status

Sudah ada: login/logout, Home (3 keadaan), leaderboard, problemset (info soal + statement + kirim solusi dengan
drag-and-drop), submission terbaru dengan verdict di Home, mode mock dengan skenario. Tampilan sudah mengikuti
Deep Sea Arena (`DESIGN_REF/`).

Sudah diuji manual end-to-end terhadap DOMjudge 9.0.0 + judgehost lokal (WSL2) sebelum redesain: login tim, submit,
dan verdict untuk C, C++, Java, Python 3, dan Go. Tampilan baru diuji lewat mode mock (semua skenario, desktop dan
mobile); **belum dijalankan ulang terhadap DOMjudge sungguhan**.

Belum diuji: leaderboard dengan banyak tim / saat freeze, dan login dengan akun yang bukan tim pada DOMjudge sungguhan.

Belum / rencana:

- Halaman **clarifications** (tanya-jawab dengan juri).
- Editor kode di browser (paket CodeMirror sudah terpasang, belum dipakai).
- Halaman daftar submission lengkap (desain hanya menampilkan 5 terbaru di Home).
- Logo sponsor asli.

## Pemecahan masalah

| Gejala                                           | Penyebab / solusi                                                                                                                  |
| ------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------- |
| "Konfigurasi environment tidak valid" saat start | `.env.local` belum dibuat atau `SESSION_SECRET` < 32 karakter.                                                                     |
| Login: "Server contest tidak dapat dihubungi"    | DOMjudge mati atau `DOMJUDGE_URL` salah. Cek `curl $DOMJUDGE_URL/api/v4/info`. Di WSL: `systemctl start nginx php8.3-fpm mariadb`. |
| Login: "Akun ini tidak terhubung ke sebuah tim"  | Login dengan akun tim, bukan `admin`. Buat user ber-role `team` yang terhubung ke tim di Jury → Users.                             |
| "Contest ... tidak ditemukan di DOMjudge"        | `DOMJUDGE_CONTEST_ID` tidak cocok dengan `id`/`shortname` contest, atau akun belum punya akses ke contest itu.                     |
| Scoreboard kosong                                | Tim belum ditambahkan ke contest (Jury → Contests → tim), atau contest belum dimulai.                                              |
| Submission selalu "Menunggu / diproses"          | Judgehost belum berjalan (`judgedaemon`). Cek Jury → Judgehosts.                                                                   |
