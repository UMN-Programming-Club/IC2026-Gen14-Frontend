"use client";

import { useRouter } from "next/navigation";

/** Hapus sesi di server, lalu kembali ke halaman login. */
export function useLogout() {
  const router = useRouter();
  return async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/login");
    router.refresh();
  };
}
