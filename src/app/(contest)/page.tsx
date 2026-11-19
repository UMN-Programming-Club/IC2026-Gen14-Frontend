"use client";

import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { useContestInfo } from "@/components/contest-context";
import {
  buildChips,
  buildRows,
  formatDurationLabel,
  previewModel,
  type HomeModel,
  type Phase,
  type PreviewKey,
} from "@/components/home/home-model";
import {
  BeforeView,
  EndedView,
  RunningView,
  TimerBlock,
} from "@/components/home/home-views";
import { SponsorMarquee } from "@/components/home/sponsor-marquee";
import { useNow } from "@/components/home/use-now";
import { useContestQuery } from "@/lib/api-client";
import type {
  ContestProblem,
  ContestState,
  Judgement,
  JudgementType,
  Scoreboard,
  Submission,
} from "@/lib/domjudge/types";

const PREVIEW_KEYS: PreviewKey[] = [
  "before",
  "running-empty",
  "running",
  "ended",
];

export default function HomePage() {
  const { contest, teamId, teamName } = useContestInfo();
  const now = useNow();

  const state = useContestQuery<ContestState>("state", 15_000);
  const board = useContestQuery<Scoreboard>("scoreboard", 15_000);
  const problems = useContestQuery<ContestProblem[]>("problems", 60_000);
  const submissions = useContestQuery<Submission[]>("submissions", 5_000);
  const judgements = useContestQuery<Judgement[]>("judgements", 5_000);
  const jtypes = useContestQuery<JudgementType[]>("judgement-types", 300_000);

  // Preview 4 state (hanya development): /?preview=before|running-empty|running|ended
  const previewParam = useSearchParams().get("preview") as PreviewKey | null;
  const preview =
    process.env.NODE_ENV !== "production" &&
    previewParam &&
    PREVIEW_KEYS.includes(previewParam)
      ? previewParam
      : null;

  const startMs = contest.start_time ? Date.parse(contest.start_time) : null;
  const endMs = contest.end_time ? Date.parse(contest.end_time) : null;

  const live = useMemo<HomeModel>(() => {
    const clock = now ?? 0;
    const started =
      !!state.data?.started ||
      (startMs !== null && clock >= startMs && now !== null);
    const ended =
      !!state.data?.ended || (endMs !== null && clock >= endMs && now !== null);
    const phase: Phase = ended ? "ended" : started ? "running" : "before";

    const row = board.data?.rows.find((r) => r.team_id === teamId);
    const chips = buildChips(problems.data, board.data, teamId);
    return {
      phase,
      teamName,
      targetMs: phase === "before" ? startMs : endMs,
      startLabel:
        startMs !== null
          ? format(new Date(startMs), "dd MMM yyyy", {
              locale: idLocale,
            }).toUpperCase()
          : "-",
      durationLabel: formatDurationLabel(
        contest.duration,
        startMs ?? undefined,
        endMs ?? undefined,
      ),
      problemCount: problems.data?.length || chips.length || null,
      stats: {
        rank: row?.rank ?? null,
        solved: row?.score?.num_solved ?? 0,
        penalty: row?.score?.total_time ?? 0,
        submissionCount: submissions.data?.length ?? 0,
      },
      chips,
      rows: buildRows(
        submissions.data,
        judgements.data,
        jtypes.data,
        problems.data,
      ),
    };
  }, [
    now,
    state.data,
    board.data,
    problems.data,
    submissions.data,
    judgements.data,
    jtypes.data,
    contest.duration,
    startMs,
    endMs,
    teamId,
    teamName,
  ]);

  const model = useMemo(
    () => (preview && now !== null ? previewModel(preview, now) : live),
    [preview, now, live],
  );

  // Preview memakai target tetap relatif terhadap waktu mount pertama, supaya hitung mundur berjalan.
  const previewAnchor = useMemo(() => ({ value: null as number | null }), []);
  let targetMs = model.targetMs;
  if (preview && now !== null && model.targetMs !== null) {
    previewAnchor.value ??= model.targetMs;
    targetMs = previewAnchor.value;
  }

  return (
    <div className="bg-background relative flex h-full min-h-0 flex-col overflow-hidden">
      {/* Latar dekoratif: glow teal + pola titik */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            model.phase === "ended"
              ? "radial-gradient(60% 45% at 50% 100%, rgb(180 40 40 / 0.10), transparent 70%), radial-gradient(55% 30% at 50% 0%, rgb(64 186 169 / 0.06), transparent 70%)"
              : "radial-gradient(60% 35% at 50% 0%, rgb(64 186 169 / 0.09), transparent 70%)",
        }}
      />
      <div className="bg-dots pointer-events-none absolute inset-0 top-[2.9rem] lg:top-[3.3rem]" />

      <div className="relative flex min-h-0 flex-1 flex-col">
        <TimerBlock
          phase={model.phase}
          now={now}
          targetMs={targetMs}
          startLabel={model.startLabel}
        />
        {model.phase === "before" && (
          <BeforeView
            now={now}
            targetMs={targetMs}
            teamName={model.teamName}
            durationLabel={model.durationLabel}
            problemCount={model.problemCount}
          />
        )}
        {model.phase === "running" && (
          <RunningView
            teamName={model.teamName}
            stats={model.stats}
            chips={model.chips}
            rows={model.rows}
          />
        )}
        {model.phase === "ended" && (
          <EndedView stats={model.stats} total={model.chips.length} />
        )}
      </div>

      <SponsorMarquee className="relative" />
    </div>
  );
}
