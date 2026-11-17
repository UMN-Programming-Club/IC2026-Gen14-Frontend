"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useContestQuery } from "@/lib/api-client";
import type { ContestProblem, Language } from "@/lib/domjudge/types";

const SELECT_CLASS =
  "h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

function guessLanguage(filename: string, languages: Language[]): string {
  const ext = filename.split(".").pop()?.toLowerCase() ?? "";
  return (
    languages.find((l) => l.extensions.some((e) => e.toLowerCase() === ext))
      ?.id ?? ""
  );
}

function SubmitForm({
  problemId,
  languages,
}: {
  problemId: string;
  languages: Language[];
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [language, setLanguage] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const file = new FormData(form).get("code");
    if (!(file instanceof File) || file.size === 0) {
      toast.error("Pilih file kode terlebih dahulu.");
      return;
    }
    if (!language) {
      toast.error("Pilih bahasa pemrograman.");
      return;
    }

    setPending(true);
    try {
      const body = new FormData();
      body.set("problem", problemId);
      body.set("language", language);
      body.set("code", file);
      const res = await fetch("/api/submit", { method: "POST", body });
      const result = await res.json().catch(() => null);
      if (!res.ok) {
        toast.error(result?.message ?? `Submit gagal (${res.status}).`);
        return;
      }
      toast.success("Submission terkirim.");
      await queryClient.invalidateQueries({
        queryKey: ["contest", "submissions"],
      });
      router.push("/submissions");
    } catch {
      toast.error("Tidak dapat menghubungi server.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4">
      <div className="grid gap-2">
        <Label htmlFor="code">File kode</Label>
        <Input
          id="code"
          name="code"
          type="file"
          required
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f)
              setLanguage((cur) => guessLanguage(f.name, languages) || cur);
          }}
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="language">Bahasa</Label>
        <select
          id="language"
          className={SELECT_CLASS}
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          required
        >
          <option value="" disabled>
            Pilih bahasa...
          </option>
          {languages.map((l) => (
            <option key={l.id} value={l.id}>
              {l.name}
            </option>
          ))}
        </select>
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Mengirim..." : "Kirim solusi"}
      </Button>
    </form>
  );
}

export default function ProblemPage() {
  const { id } = useParams<{ id: string }>();
  const problem = useContestQuery<ContestProblem>(`problems/${id}`);
  const languages = useContestQuery<Language[]>("languages", 300_000);

  if (problem.isPending) return <p className="text-zinc-500">Memuat soal...</p>;
  if (problem.isError) {
    return (
      <p role="alert" className="text-red-600">
        {problem.error.message}
      </p>
    );
  }

  const p = problem.data;
  const hasStatement = (p.statement?.length ?? 0) > 0;

  return (
    <div className="grid gap-4">
      <div>
        <Link
          href="/problems"
          className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
        >
          <ArrowLeft className="size-4" /> Semua soal
        </Link>
        <h1 className="mt-1 flex items-center gap-2 text-xl font-semibold">
          {p.name} <Badge variant="outline">{p.label}</Badge>
        </h1>
        <p className="text-sm text-zinc-500">Batas waktu {p.time_limit}s</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_20rem]">
        <div className="min-h-[70vh] overflow-hidden rounded-lg border">
          {hasStatement ? (
            <iframe
              title={`Statement ${p.name}`}
              src={`/api/contest/problems/${encodeURIComponent(id)}/statement`}
              className="h-[75vh] w-full"
            />
          ) : (
            <p className="p-6 text-zinc-500">Statement belum tersedia.</p>
          )}
        </div>

        <Card className="h-fit">
          <CardHeader>
            <CardTitle>Submit</CardTitle>
          </CardHeader>
          <CardContent>
            {languages.isPending ? (
              <p className="text-sm text-zinc-500">Memuat bahasa...</p>
            ) : languages.isError ? (
              <p role="alert" className="text-sm text-red-600">
                {languages.error.message}
              </p>
            ) : (
              <SubmitForm problemId={id} languages={languages.data} />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
