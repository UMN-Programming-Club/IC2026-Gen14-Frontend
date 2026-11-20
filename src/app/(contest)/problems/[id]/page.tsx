"use client";

import {
  useRef,
  useState,
  type DragEvent,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import { useParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  Radio,
  Upload,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { arenaButton } from "@/components/arena/button-styles";
import { useContestClock } from "@/components/arena/contest-clock";
import { useContestInfo } from "@/components/contest-context";
import { useContestQuery } from "@/lib/api-client";
import { cellStatus } from "@/lib/contest-status";
import type {
  ContestProblem,
  Judgement,
  JudgementType,
  Language,
  Scoreboard,
  Submission,
} from "@/lib/domjudge/types";
import { latestVerdictByProblem } from "@/lib/verdicts";
import { formatBytes, formatMinutes } from "@/lib/format";
import { cn } from "@/lib/utils";

const MAX_BYTES = 256 * 1024; // sama dengan batas di /api/submit

type Tab = "info" | "kirim";

function guessLanguage(filename: string, languages: Language[]): string {
  const ext = filename.split(".").pop()?.toLowerCase() ?? "";
  return (
    languages.find((l) => l.extensions.some((e) => e.toLowerCase() === ext))
      ?.id ?? ""
  );
}

function Tabs({ tab, onChange }: { tab: Tab; onChange: (t: Tab) => void }) {
  const items: { id: Tab; label: string }[] = [
    { id: "info", label: "Info soal" },
    { id: "kirim", label: "Kirim solusi" },
  ];
  function onKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
      onChange(tab === "info" ? "kirim" : "info");
    }
  }
  return (
    <div
      role="tablist"
      aria-label="Bagian soal"
      onKeyDown={onKeyDown}
      className="bg-ink-900 mt-6 grid grid-cols-2 gap-1 rounded-xl p-1"
    >
      {items.map((it) => (
        <button
          key={it.id}
          type="button"
          role="tab"
          id={`tab-${it.id}`}
          aria-selected={tab === it.id}
          aria-controls={`panel-${it.id}`}
          tabIndex={tab === it.id ? 0 : -1}
          onClick={() => onChange(it.id)}
          className={cn(
            "focus-visible:ring-aqua-400/60 rounded-lg py-3 text-sm font-bold tracking-[0.1em] uppercase transition-colors outline-none focus-visible:ring-2",
            tab === it.id
              ? "bg-sidebar-accent text-foam-50"
              : "hover:text-foam-50 text-mist-400",
          )}
        >
          {it.label}
        </button>
      ))}
    </div>
  );
}

function StatBox({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="border-line bg-ink-900/60 rounded-xl border px-5 py-4">
      <p className="eyebrow">{label}</p>
      <p className="mt-2 font-mono text-2xl font-bold">{children}</p>
    </div>
  );
}

function TeamStatus({ problemId }: { problemId: string }) {
  const { teamId } = useContestInfo();
  const board = useContestQuery<Scoreboard>("scoreboard", 15_000);
  // Verdict submission terakhir (mis. "Runtime Error"), sama seperti di Home.
  const submissions = useContestQuery<Submission[]>("submissions", 5_000);
  const judgements = useContestQuery<Judgement[]>("judgements", 5_000);
  const jtypes = useContestQuery<JudgementType[]>("judgement-types", 300_000);
  const lastVerdict = latestVerdictByProblem(
    submissions.data,
    judgements.data,
    jtypes.data,
  ).get(problemId);
  const cell = board.data?.rows
    .find((r) => r.team_id === teamId)
    ?.problems?.find((p) => p.problem_id === problemId);
  const status = cellStatus(cell);

  let content: React.ReactNode = (
    <span className="text-mist-400">Belum ada submission</span>
  );
  if (board.isPending) content = <span className="text-mist-400">...</span>;
  else if (cell && (status === "solved" || status === "first")) {
    content = (
      <>
        <span className="bg-ok/15 text-ok inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold">
          <Check className="size-3.5" strokeWidth={3} /> Accepted
        </span>
        <span className="font-mono text-sm text-mist-400">
          {formatMinutes(cell.time ?? 0)}
        </span>
      </>
    );
  } else if (cell && status === "pending") {
    content = (
      <span className="bg-pending/15 text-pending inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold">
        <Radio className="size-3.5" /> Pending
      </span>
    );
  } else if (cell && status === "failed") {
    content = (
      <>
        <span className="bg-wa/15 text-wa inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold">
          <X className="size-3.5" strokeWidth={3} />{" "}
          {lastVerdict && lastVerdict.kind === "wrong"
            ? lastVerdict.text
            : "Belum benar"}
        </span>
        <span className="font-mono text-sm text-mist-400">
          {cell.num_judged} percobaan
        </span>
      </>
    );
  }

  return (
    <div className="border-line bg-ink-950/60 mt-4 flex flex-wrap items-center gap-3 rounded-xl border px-5 py-4 text-sm">
      <span className="text-mist-400">Status tim kamu:</span>
      {content}
    </div>
  );
}

function InfoTab({
  problem,
  languages,
  onSubmitTab,
}: {
  problem: ContestProblem;
  languages: Language[];
  onSubmitTab: () => void;
}) {
  const id = problem.id ?? "";
  const hasStatement = (problem.statement?.length ?? 0) > 0;
  return (
    <div role="tabpanel" id="panel-info" aria-labelledby="tab-info">
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <StatBox label="Batas waktu">{problem.time_limit} detik</StatBox>
        <StatBox label="Bahasa">
          <span className="font-sans text-base leading-snug font-semibold">
            {languages.length > 0
              ? languages.map((l) => l.name).join(", ")
              : "-"}
          </span>
        </StatBox>
      </div>

      <TeamStatus problemId={id} />

      {hasStatement ? (
        <a
          href={`/api/contest/problems/${encodeURIComponent(id)}/statement`}
          target="_blank"
          rel="noopener noreferrer"
          className={arenaButton("primary", "mt-5 w-full justify-between py-4")}
        >
          Baca soal lengkap <ArrowUpRight className="size-4" />
        </a>
      ) : (
        <p className="border-line mt-5 rounded-xl border px-5 py-4 text-sm text-mist-400">
          Statement belum tersedia.
        </p>
      )}
      <button
        type="button"
        onClick={onSubmitTab}
        className={arenaButton("secondary", "mt-3 w-full py-4")}
      >
        Lanjut ke kirim solusi <ArrowRight className="size-4" />
      </button>
    </div>
  );
}

function SubmitTab({
  problemId,
  languages,
  canSubmit,
  blockedReason,
}: {
  problemId: string;
  languages: Language[];
  canSubmit: boolean;
  blockedReason: string | null;
}) {
  const queryClient = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [language, setLanguage] = useState("");
  const [dragging, setDragging] = useState(false);
  const [pending, setPending] = useState(false);

  function pick(f: File | undefined) {
    if (!f) return;
    if (f.size === 0) {
      toast.error("File kosong.");
      return;
    }
    if (f.size > MAX_BYTES) {
      toast.error(`File terlalu besar (maksimal ${MAX_BYTES / 1024} KB).`);
      return;
    }
    setFile(f);
    setLanguage((cur) => guessLanguage(f.name, languages) || cur);
  }

  function onDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragging(false);
    pick(e.dataTransfer.files?.[0]);
  }

  function clear() {
    setFile(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!file) {
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
      toast.success("Submission terkirim", {
        description: "Pantau statusnya di Home dan Leaderboard.",
      });
      clear();
      await Promise.all(
        ["submissions", "judgements", "scoreboard"].map((k) =>
          queryClient.invalidateQueries({ queryKey: ["contest", k] }),
        ),
      );
    } catch {
      toast.error("Tidak dapat menghubungi server.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form
      role="tabpanel"
      id="panel-kirim"
      aria-labelledby="tab-kirim"
      onSubmit={onSubmit}
      className="mt-5"
    >
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={cn(
          "flex flex-col items-center rounded-2xl border-2 border-dashed px-6 py-12 text-center transition-colors",
          dragging
            ? "border-aqua-400 bg-aqua-400/10"
            : "border-aqua-400/40 bg-aqua-400/[0.04]",
        )}
      >
        <Upload className="text-aqua-400 size-10" strokeWidth={1.5} />
        <p className="mt-4 font-bold">Tarik file kode ke sini</p>
        <p className="mt-1 text-sm text-mist-400">
          atau{" "}
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="text-aqua-400 font-semibold underline-offset-2 outline-none hover:underline focus-visible:underline"
          >
            pilih file
          </button>
        </p>
        <input
          ref={inputRef}
          type="file"
          className="sr-only"
          tabIndex={-1}
          aria-label="File kode"
          onChange={(e) => pick(e.target.files?.[0])}
        />
      </div>

      {file && (
        <div className="border-line bg-ink-950/70 mt-4 flex items-center gap-3 rounded-xl border px-5 py-3.5">
          <span className="min-w-0 truncate font-mono text-sm font-bold">
            {file.name}
          </span>
          <span className="shrink-0 text-xs text-mist-400">
            {formatBytes(file.size)}
          </span>
          <span className="ml-auto flex shrink-0 gap-4 text-xs font-bold tracking-wider uppercase">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="text-aqua-400 hover:underline"
            >
              Ganti
            </button>
            <button
              type="button"
              onClick={clear}
              className="text-wa hover:underline"
            >
              Hapus
            </button>
          </span>
        </div>
      )}

      <div className="mt-4 flex items-center gap-4">
        <label htmlFor="language" className="eyebrow">
          Bahasa
        </label>
        <select
          id="language"
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          required
          className="border-line-strong bg-ink-950 text-foam-50 focus:border-aqua-400 h-11 flex-1 rounded-lg border px-3 text-sm font-medium outline-none"
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

      <button
        type="submit"
        disabled={!canSubmit || pending || !file}
        className={arenaButton("primary", "mt-5 w-full py-[1.15rem]")}
      >
        {pending ? (
          "Mengirim..."
        ) : (
          <>
            Kirim submission <ArrowRight className="size-4" />
          </>
        )}
      </button>
      <p className="mt-3 text-center text-sm text-mist-400">
        {blockedReason ?? "Status akan muncul di Home dan Leaderboard"}
      </p>
    </form>
  );
}

export default function ProblemDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { contest } = useContestInfo();
  const { phase } = useContestClock();
  const problems = useContestQuery<ContestProblem[]>("problems", 60_000);
  const languages = useContestQuery<Language[]>("languages", 300_000);
  const [tabState, setTabState] = useState<{ id: string; tab: Tab }>({
    id,
    tab: "info",
  });
  // Pindah soal selalu kembali ke tab "Info soal".
  const tab: Tab = tabState.id === id ? tabState.tab : "info";
  const setTab = (t: Tab) => setTabState({ id, tab: t });

  if (problems.isPending) return null;
  const problem = problems.data?.find((p) => p.id === id);
  if (!problem) {
    return (
      <div className="border-line bg-panel rounded-2xl border px-6 py-12 text-center text-mist-400">
        Soal tidak ditemukan.
      </div>
    );
  }

  const blockedReason =
    phase === "ended"
      ? "Contest sudah selesai. Submission tidak diterima."
      : phase === "before"
        ? "Contest belum dimulai."
        : contest.allow_submit === false
          ? "Pengiriman submission sedang dinonaktifkan panitia."
          : null;

  return (
    <article className="border-line bg-panel rounded-2xl border p-6 sm:p-8">
      <p className="flex items-center gap-3 text-sm">
        <span className="text-aqua-400 font-mono font-bold">
          {problem.label}
        </span>
        <span className="tracking-[0.14em] text-mist-400 uppercase">Task</span>
      </p>
      <h2 className="title-display mt-1 text-4xl sm:text-5xl">
        {problem.name}
      </h2>

      <Tabs tab={tab} onChange={setTab} />

      {languages.isPending ? (
        <p className="mt-6 text-mist-400">Memuat...</p>
      ) : languages.isError ? (
        <p role="alert" className="text-wa mt-6">
          {languages.error.message}
        </p>
      ) : tab === "info" ? (
        <InfoTab
          problem={problem}
          languages={languages.data}
          onSubmitTab={() => setTab("kirim")}
        />
      ) : (
        <SubmitTab
          key={id}
          problemId={id}
          languages={languages.data}
          canSubmit={blockedReason === null}
          blockedReason={blockedReason}
        />
      )}
    </article>
  );
}
