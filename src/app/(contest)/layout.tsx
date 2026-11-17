import { Suspense, type ReactNode } from "react";
import { redirect } from "next/navigation";
import { ContestProvider } from "@/components/contest-context";
import { ContestHeader } from "@/components/contest-header";
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
    const message =
      e instanceof ContestError
        ? e.message
        : "Terjadi kesalahan saat memuat contest.";
    return (
      <main className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center gap-3 px-4 py-16">
        <h1 className="text-xl font-semibold">Contest tidak dapat dimuat</h1>
        <p role="alert" className="text-zinc-600 dark:text-zinc-400">
          {message}
        </p>
      </main>
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
      <ContestHeader />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">
        {children}
      </main>
    </ContestProvider>
  );
}

export default function ContestLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense
      fallback={
        <p className="p-8 text-center text-zinc-500">Memuat contest...</p>
      }
    >
      <ContestShell>{children}</ContestShell>
    </Suspense>
  );
}
