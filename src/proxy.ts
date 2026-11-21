import { NextResponse, type NextRequest } from "next/server";

const COOKIE_NAME = "umnpc_session";
// Rute terbuka (tanpa login). Daftarkan hanya yang memang sengaja publik, dan cocokkan persis.
const PUBLIC_PATHS = ["/login", "/api/auth/login", "/api/public/leaderboard"];

/**
 * Gerbang ringan: tanpa cookie session -> /login (halaman) atau 401 (API).
 * Validasi sebenarnya (dekripsi cookie) tetap dilakukan di server component / route handler.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (PUBLIC_PATHS.includes(pathname)) return NextResponse.next();

  if (request.cookies.has(COOKIE_NAME)) return NextResponse.next();

  if (pathname.startsWith("/api/")) {
    return Response.json(
      { ok: false, message: "Belum login." },
      { status: 401 },
    );
  }
  const url = request.nextUrl.clone();
  url.pathname = "/login";
  url.search = "";
  return NextResponse.redirect(url);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
