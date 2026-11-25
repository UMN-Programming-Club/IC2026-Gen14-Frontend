import { Suspense, type ReactNode } from "react";
import { redirect } from "next/navigation";
import { ContestClockProvider } from "@/components/arena/contest-clock";
import { ContestProvider } from "@/components/contest-context";
import { ContestMain } from "@/components/contest-main";
import { ContestSidebar } from "@/components/contest-sidebar";
import { ContestUnavailable } from "@/components/contest-unavailable";
import { MockBanner } from "@/components/mock-banner";
import { ContestError, resolveContest } from "@/lib/domjudge/contest";
import { getSessionUser } from "@/lib/session";

/** Membaca cookie + memanggil DOMjudge = data runtime, jadi harus di dalam <Suspense>. */
async function ContestShell({ children }: { children: ReactNode }) {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  let contest;
  try {
    contest = await resolveContest(user.username, user.password);
  } catch (e) {
    const known = e instanceof ContestError ? e : null;
    return (
      <ContestUnavailable
        kind={known?.kind ?? "unknown"}
        message={known?.message ?? "Terjadi kesalahan saat memuat contest."}
        teamName={user.teamName ?? user.username}
      />
    );
  }

  return (
    <ContestProvider
      value={{
        contest,
        teamId: user.teamId,
        teamName: user.teamName ?? user.username,
      }}
    >
      {/* Satu jam contest (disinkronkan ke jam DOMjudge) untuk sidebar, Home, dan halaman lain. */}
      <ContestClockProvider>
        <div className="flex h-dvh min-h-0 flex-col overflow-hidden">
          <MockBanner />
          <div className="flex min-h-0 flex-1 flex-col md:flex-row">
            <ContestSidebar />
            <ContestMain>{children}</ContestMain>
          </div>
        </div>
      </ContestClockProvider>
    </ContestProvider>
  );
}

export default function ContestLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense
      fallback={
        <p className="text-muted-foreground p-8 text-center">
          Memuat contest...
        </p>
      }
    >
      <ContestShell>{children}</ContestShell>
    </Suspense>
  );
}
