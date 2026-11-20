"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useContestQuery } from "@/lib/api-client";
import type { ContestProblem } from "@/lib/domjudge/types";

/** /problems tanpa soal terpilih: langsung buka soal pertama (daftar ada di layout). */
export default function ProblemsIndexPage() {
  const router = useRouter();
  const problems = useContestQuery<ContestProblem[]>("problems", 60_000);
  const firstId = problems.data?.[0]?.id;

  useEffect(() => {
    if (firstId) router.replace(`/problems/${encodeURIComponent(firstId)}`);
  }, [firstId, router]);

  if (problems.isSuccess && !firstId) {
    return (
      <div className="border-line bg-panel rounded-2xl border px-6 py-12 text-center text-mist-400">
        Belum ada soal pada contest ini.
      </div>
    );
  }
  return null;
}
