"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useContestQuery } from "@/lib/api-client";
import type { ContestProblem } from "@/lib/domjudge/types";

export default function ProblemsPage() {
  const problems = useContestQuery<ContestProblem[]>("problems", 60_000);

  if (problems.isPending)
    return <p className="text-zinc-500">Memuat soal...</p>;
  if (problems.isError) {
    return (
      <p role="alert" className="text-red-600">
        {problems.error.message}
      </p>
    );
  }
  if (problems.data.length === 0) {
    return (
      <p className="text-zinc-500">
        Belum ada soal yang dibuka. Soal muncul setelah contest dimulai.
      </p>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {problems.data.map((p) => (
        <Link key={p.id} href={`/problems/${encodeURIComponent(p.id ?? "")}`}>
          <Card className="h-full transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-900">
            <CardHeader>
              <CardTitle className="flex items-center justify-between gap-2">
                <span className="truncate">{p.name}</span>
                <Badge variant="outline">{p.label}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-zinc-500">
              Batas waktu {p.time_limit}s
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
