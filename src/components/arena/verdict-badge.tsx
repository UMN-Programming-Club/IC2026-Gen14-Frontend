import { Check, Radio, TriangleAlert, X } from "lucide-react";
import { cn } from "@/lib/utils";

type Tone = "ok" | "wa" | "tle" | "pending" | "neutral";

const TONE: Record<Tone, string> = {
  ok: "bg-ok/15 text-ok",
  wa: "bg-wa/15 text-wa",
  tle: "bg-tle/15 text-tle",
  pending: "bg-pending/15 text-pending",
  neutral: "bg-mist-400/15 text-mist-400",
};

const KNOWN: Record<string, { label: string; tone: Tone }> = {
  AC: { label: "Accepted", tone: "ok" },
  WA: { label: "Wrong Answer", tone: "wa" },
  TLE: { label: "Time Limit", tone: "tle" },
  MLE: { label: "Memory Limit", tone: "tle" },
  OLE: { label: "Output Limit", tone: "tle" },
  RTE: { label: "Runtime Error", tone: "wa" },
  CE: { label: "Compile Error", tone: "neutral" },
  NO: { label: "No Output", tone: "wa" },
};

/** `judgementTypeId` null/undefined = masih diproses (Pending). */
export function VerdictBadge({
  judgementTypeId,
  className,
}: {
  judgementTypeId?: string | null;
  className?: string;
}) {
  const pending = !judgementTypeId;
  const known = judgementTypeId ? KNOWN[judgementTypeId] : undefined;
  const tone: Tone = pending ? "pending" : (known?.tone ?? "wa");
  const label = pending ? "Pending" : (known?.label ?? judgementTypeId);
  const Icon = pending
    ? Radio
    : tone === "ok"
      ? Check
      : tone === "neutral"
        ? TriangleAlert
        : X;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold",
        TONE[tone],
        className,
      )}
    >
      <Icon className="size-3.5" strokeWidth={2.5} aria-hidden="true" />
      {label}
    </span>
  );
}
